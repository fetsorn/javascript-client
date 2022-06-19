import {
  Client,
  executeMaybeAsyncFunction,
  InvokeResult,
  Job,
  MaybeAsync,
  Uri,
} from "../types";

export interface JobRunOptions<TUri extends Uri | string = string> {
  relativeId: string;
  parentId: string;
  jobs: Job<TUri>;
}

type DataOrError = "data" | "error";

export class JobRunner<
  TData extends unknown = unknown,
  TUri extends Uri | string = string
> {
  private jobOutput: Map<string, InvokeResult<TData>>;

  constructor(
    private client: Client,
    private onExecution?: (
      id: string,
      data?: InvokeResult<TData>["data"],
      error?: InvokeResult<TData>["error"]
    ) => MaybeAsync<void>
  ) {
    this.jobOutput = new Map();
  }

  async run(opts: JobRunOptions<TUri>): Promise<void> {
    const { relativeId, parentId, jobs } = opts;

    if (relativeId) {
      let index = relativeId.indexOf(".");
      index = index === -1 ? relativeId.length : index;

      const jobId = relativeId.substring(0, index);
      if (jobId === "") return;

      const steps = jobs[jobId].steps;
      if (steps) {
        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          const absoluteId = parentId
            ? `${parentId}.${jobId}.${i}`
            : `${jobId}.${i}`;
          const input = this.resolveInput(absoluteId, step.input);
          const result = await this.client.invoke<TData, TUri>({
            uri: step.uri,
            method: step.method,
            config: step.config,
            input: input,
          });

          this.jobOutput.set(absoluteId, result);

          if (this.onExecution && typeof this.onExecution === "function") {
            await executeMaybeAsyncFunction(
              this.onExecution,
              absoluteId,
              result.data,
              result.error
            );
          }
        }
      }
      const subJobs = jobs[jobId].jobs;
      if (subJobs) {
        await this.run({
          relativeId: relativeId.substring(index + 1),
          parentId: parentId ? `${parentId}.${jobId}` : jobId,
          jobs: subJobs,
        });
      }
    } else {
      const jobIds = Object.keys(jobs);
      // Run all the sibling jobs in parallel
      await Promise.all(
        jobIds.map((jobId) =>
          this.run({
            relativeId: jobId,
            parentId,
            jobs: jobs,
          })
        )
      );
    }
  }

  resolveInput(
    absCurStepId: string,
    input: Record<string, unknown>
  ): Record<string, unknown> {
    const index = absCurStepId.lastIndexOf(".");
    const curStepId = +absCurStepId.substring(index + 1);
    const absCurJobId = absCurStepId.substring(0, index);
    const outputs = this.jobOutput;

    function resolveValue(value: unknown): unknown {
      if (typeof value === "string" && value.startsWith("$")) {
        const absStepIdArr = value.slice(1).split(".");
        const absJobId = absStepIdArr
          .slice(0, absStepIdArr.length - 2)
          .join(".");
        const dataOrErr: DataOrError = absStepIdArr[
          absStepIdArr.length - 1
        ] as DataOrError;
        const absStepId = `${absJobId}.${
          absStepIdArr[absStepIdArr.length - 2]
        }`;

        if (absCurJobId.includes(absJobId)) {
          if (absJobId === absCurJobId) {
            if (+absStepIdArr[absStepIdArr.length - 2] < curStepId) {
              const output = outputs.get(absStepId);
              if (output && output[dataOrErr]) {
                return output[dataOrErr];
              }
            }
          }
          const output = outputs.get(absStepId);
          if (output && output[dataOrErr]) {
            return output[dataOrErr];
          }
        }

        throw new Error(
          `Could not resolve input for step with stepId: ${absCurJobId}.${curStepId}`
        );
      } else if (Array.isArray(value)) return value.map(resolveValue);
      else if (typeof value === "object" && value !== null) {
        return Object.entries(value as Record<string, unknown>).reduce(
          (obj, [k, v]) => ((obj[k] = resolveValue(v)), obj),
          {} as Record<string, unknown>
        );
      } else return value;
    }

    return resolveValue(input) as Record<string, unknown>;
  }
}
