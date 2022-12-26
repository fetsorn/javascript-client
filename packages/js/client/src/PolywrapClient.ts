import { PolywrapClientConfig } from "./PolywrapClientConfig";
import { buildPolywrapCoreClientConfig, sanitizeUri } from "./helpers";
import { InvokerOptions, TryResolveUriOptions } from "./types";
import { PolywrapCoreClientConfig } from "./PolywrapCoreClientConfig";

import { PolywrapCoreClient } from "@polywrap/core-client-js";
import {
  CoreClientConfig,
  Env,
  GetFileOptions,
  GetImplementationsOptions,
  InterfaceImplementations,
  InvokeResult,
  IUriResolver,
  Uri,
  UriPackageOrWrapper,
  ValidateOptions,
  Wrapper,
} from "@polywrap/core-js";
import { Result, ResultErr, ResultOk } from "@polywrap/result";
import {
  compareSignature,
  ImportedModuleDefinition,
  WrapManifest,
} from "@polywrap/wrap-manifest-types-js";
import { Tracer, TracerConfig } from "@polywrap/tracing-js";

export class PolywrapClient extends PolywrapCoreClient {
  /**
   * Instantiate a PolywrapClient
   *
   * @param config - a whole or partial client configuration
   * @param options - { noDefaults?: boolean }
   */
  constructor(
    config?: Partial<PolywrapClientConfig>,
    options?: { noDefaults?: false }
  );
  constructor(config: PolywrapCoreClientConfig, options: { noDefaults: true });
  constructor(
    config:
      | Partial<PolywrapClientConfig>
      | undefined
      | PolywrapCoreClientConfig,
    options?: { noDefaults?: boolean }
  ) {
    super(buildPolywrapCoreClientConfig(config, options?.noDefaults ?? false));
    try {
      this.setTracingEnabled(config?.tracerConfig);

      Tracer.startSpan("PolywrapClient: constructor");
    } catch (error) {
      Tracer.recordException(error);
      throw error;
    } finally {
      Tracer.endSpan();
    }
  }

  /**
   * Enable tracing for intricate debugging
   *
   * @remarks
   * Tracing uses the @polywrap/tracing-js package
   *
   * @param tracerConfig - configure options such as the tracing level
   * @returns void
   */
  public setTracingEnabled(tracerConfig?: Partial<TracerConfig>): void {
    if (tracerConfig?.consoleEnabled || tracerConfig?.httpEnabled) {
      Tracer.enableTracing("PolywrapClient", tracerConfig);
    } else {
      Tracer.disableTracing();
    }
  }

  @Tracer.traceMethod("PolywrapClient: getConfig")
  public getConfig(): CoreClientConfig {
    return super.getConfig();
  }

  @Tracer.traceMethod("PolywrapClient: getInterfaces")
  public getInterfaces(): readonly InterfaceImplementations[] | undefined {
    return super.getInterfaces();
  }

  @Tracer.traceMethod("PolywrapClient: getEnvs")
  public getEnvs(): readonly Env[] | undefined {
    return super.getEnvs();
  }

  @Tracer.traceMethod("PolywrapClient: getResolver")
  public getResolver(): IUriResolver<unknown> {
    return super.getResolver();
  }

  @Tracer.traceMethod("PolywrapClient: getEnvByUri")
  public getEnvByUri<TUri extends Uri | string = string>(
    uri: TUri
  ): Env | undefined {
    return super.getEnvByUri(sanitizeUri(uri));
  }

  @Tracer.traceMethod("PolywrapClient: getManifest")
  public async getManifest<TUri extends Uri | string = string>(
    uri: TUri
  ): Promise<Result<WrapManifest, Error>> {
    return super.getManifest(sanitizeUri(uri));
  }

  @Tracer.traceMethod("PolywrapClient: getFile")
  public async getFile<TUri extends Uri | string = string>(
    uri: TUri,
    options: GetFileOptions
  ): Promise<Result<string | Uint8Array, Error>> {
    return super.getFile(sanitizeUri(uri), options);
  }

  @Tracer.traceMethod("PolywrapClient: getImplementations")
  public async getImplementations<TUri extends Uri | string = string>(
    uri: TUri,
    options?: GetImplementationsOptions
  ): Promise<Result<Uri[], Error>> {
    return super.getImplementations(sanitizeUri(uri), options);
  }

  @Tracer.traceMethod("PolywrapClient: invokeWrapper")
  public async invokeWrapper<
    TData = unknown,
    TUri extends Uri | string = string
  >(
    options: InvokerOptions<TUri> & { wrapper: Wrapper }
  ): Promise<InvokeResult<TData>> {
    return super.invokeWrapper({
      ...options,
      uri: sanitizeUri(options.uri),
    });
  }

  @Tracer.traceMethod("PolywrapClient: invoke")
  public async invoke<TData = unknown, TUri extends Uri | string = string>(
    options: InvokerOptions<TUri>
  ): Promise<InvokeResult<TData>> {
    return super.invoke({
      ...options,
      uri: sanitizeUri(options.uri),
    });
  }

  @Tracer.traceMethod("PolywrapClient: tryResolveUri")
  public async tryResolveUri<TUri extends Uri | string = string>(
    options: TryResolveUriOptions<TUri>
  ): Promise<Result<UriPackageOrWrapper, unknown>> {
    return super.tryResolveUri({
      ...options,
      uri: sanitizeUri(options.uri),
    });
  }

  @Tracer.traceMethod("PolywrapClient: loadWrapper")
  public async loadWrapper<TUri extends Uri | string = string>(
    uri: TUri
  ): Promise<Result<Wrapper, Error>> {
    return super.loadWrapper(sanitizeUri(uri));
  }

  @Tracer.traceMethod("PolywrapClient: validateConfig")
  public async validate<TUri extends Uri | string>(
    uri: TUri,
    options: ValidateOptions
  ): Promise<Result<true, Error>> {
    const wrapper = await this.loadWrapper(Uri.from(uri));
    if (!wrapper.ok) {
      return ResultErr(new Error(wrapper.error?.message));
    }

    const { abi } = await wrapper.value.getManifest();
    const importedModules: ImportedModuleDefinition[] =
      abi.importedModuleTypes || [];

    const importUri = (importedModuleType: ImportedModuleDefinition) => {
      return this.tryResolveUri({ uri: importedModuleType.uri });
    };
    const resolvedModules = await Promise.all(importedModules.map(importUri));
    const modulesNotFound = resolvedModules.filter(({ ok }) => !ok) as {
      error: Error;
    }[];

    if (modulesNotFound.length) {
      const missingModules = modulesNotFound.map(({ error }) => {
        const uriIndex = error?.message.indexOf("\n");
        return error?.message.substring(0, uriIndex);
      });
      const error = new Error(JSON.stringify(missingModules));
      return ResultErr(error);
    }

    if (options.abi) {
      for (const importedModule of importedModules) {
        const importedModuleManifest = await this.getManifest(
          importedModule.uri
        );
        if (!importedModuleManifest.ok) {
          return ResultErr(importedModuleManifest.error);
        }
        const importedMethods =
          importedModuleManifest.value.abi.moduleType?.methods || [];

        const expectedMethods = importedModules.find(
          ({ uri }) => importedModule.uri === uri
        );

        const errorMessage = `ABI from Uri: ${importedModule.uri} is not compatible with Uri: ${uri}`;
        for (const [i, _] of Object.keys(importedMethods).entries()) {
          const importedMethod = importedMethods[i];

          if (expectedMethods?.methods && expectedMethods?.methods.length < i) {
            const expectedMethod = expectedMethods?.methods[i];
            const areEqual = compareSignature(importedMethod, expectedMethod);

            if (!areEqual) return ResultErr(new Error(errorMessage));
          } else {
            return ResultErr(new Error(errorMessage));
          }
        }
      }
    }

    if (options.recursive) {
      const validateImportedModules = importedModules.map(({ uri }) =>
        this.validate(uri, options)
      );
      const resolverUris = await Promise.all(validateImportedModules);
      const invalidUris = resolverUris.filter(({ ok }) => !ok) as {
        error: Error;
      }[];
      if (invalidUris.length) {
        const missingUris = invalidUris.map(({ error }) => {
          const uriIndex = error?.message.indexOf("\n");
          return error?.message.substring(0, uriIndex);
        });
        const error = new Error(JSON.stringify(missingUris));
        return ResultErr(error);
      }
    }
    return ResultOk(true);
  }
}
