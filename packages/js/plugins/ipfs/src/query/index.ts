import {
  Module,
  Input_catFile,
  Input_resolve,
  Input_tryResolveUri,
  Input_getFile,
  Bytes,
  Options,
  ResolveResult,
  QueryEnv,
  UriResolver_MaybeUriOrManifest,
} from "./w3-man";
import { IpfsConfig } from "../common/IpfsConfig";
import { IpfsClient } from "../common/IpfsClient";
import { execSimple, execFallbacks } from "../common/exec";

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const isIPFS = require("is-ipfs");
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports, @typescript-eslint/naming-convention
const createIpfsClient = require("@dorgjelli-test/ipfs-http-client-lite");

const getOptions = (
  input: Options | undefined | null,
  env: QueryEnv
): Options => {
  const options = input || {};

  if (
    options.disableParallelRequests === undefined ||
    options.disableParallelRequests === null
  ) {
    options.disableParallelRequests = env.disableParallelRequests;
  }

  return options;
};

export interface QueryConfig extends IpfsConfig, Record<string, unknown> {}

export class Query extends Module<QueryConfig> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore: initialized within setProvider
  private _ipfs: IpfsClient;

  constructor(config: QueryConfig) {
    super(config);
    this._ipfs = createIpfsClient(this.config.provider);
  }

  public static isCID(cid: string): boolean {
    return isIPFS.cid(cid) || isIPFS.cidPath(cid) || isIPFS.ipfsPath(cid);
  }

  public async cat(cid: string, options?: Options): Promise<Buffer> {
    return await this._execWithOptions(
      "cat",
      (ipfs: IpfsClient, _provider: string, options: unknown) => {
        return ipfs.cat(cid, options);
      },
      options
    );
  }

  public async catToString(cid: string, options?: Options): Promise<string> {
    const buffer = await this.cat(cid, options);
    return buffer.toString("utf-8");
  }

  public async catFile(input: Input_catFile): Promise<Bytes> {
    const options = getOptions(input.options, this.env);
    return await this.cat(input.cid, options);
  }

  public async resolve(input: Input_resolve): Promise<ResolveResult | null> {
    const options = getOptions(input.options, this.env);
    return await this._execWithOptions(
      "resolve",
      async (ipfs: IpfsClient, provider: string, options: unknown) => {
        const { path } = await ipfs.resolve(input.cid, options);
        return {
          cid: path,
          provider,
        };
      },
      options
    );
  }

  // uri-resolver.core.web3api.eth
  public async tryResolveUri(
    input: Input_tryResolveUri
  ): Promise<UriResolver_MaybeUriOrManifest | null> {
    if (input.authority !== "ipfs") {
      return null;
    }

    if (!Query.isCID(input.path)) {
      // Not a valid CID
      return { manifest: null, uri: null };
    }

    const manifestSearchPatterns = [
      "web3api.json",
      "web3api.yaml",
      "web3api.yml",
    ];

    let manifest: string | undefined;

    for (const manifestSearchPattern of manifestSearchPatterns) {
      try {
        manifest = await this.catToString(
          `${input.path}/${manifestSearchPattern}`,
          {
            timeout: 5000,
            disableParallelRequests: this.env.disableParallelRequests,
          }
        );
      } catch (e) {
        // TODO: logging
        // https://github.com/web3-api/monorepo/issues/33
      }
    }

    if (manifest) {
      return { uri: null, manifest };
    } else {
      // Noting found
      return { uri: null, manifest: null };
    }
  }

  public async getFile(input: Input_getFile): Promise<Bytes | null> {
    try {
      const result = await this.resolve({
        cid: input.path,
        options: {
          timeout: 5000,
          disableParallelRequests: this.env.disableParallelRequests,
        },
      });

      if (!result) {
        return null;
      }

      return await this.cat(result.cid, {
        provider: result.provider,
        timeout: 20000,
        disableParallelRequests: true,
      });
    } catch (e) {
      return null;
    }
  }

  private async _execWithOptions<TReturn>(
    operation: string,
    func: (
      ipfs: IpfsClient,
      provider: string,
      options: unknown
    ) => Promise<TReturn>,
    options?: Options
  ): Promise<TReturn> {
    if (!options) {
      // Default behavior if no options are provided
      return await execSimple(
        operation,
        this._ipfs,
        this.config.provider,
        0,
        func
      );
    }

    const timeout = options.timeout || 0;

    let providers = [
      this.config.provider,
      ...(this.config.fallbackProviders || []),
    ];
    let ipfs = this._ipfs;
    let defaultProvider = this.config.provider;

    // Use the provider defaul toverride specified
    if (options.provider) {
      providers = [options.provider, ...providers];
      ipfs = createIpfsClient(options.provider);
      defaultProvider = options.provider;
    }

    return await execFallbacks(
      operation,
      ipfs,
      defaultProvider,
      providers,
      timeout,
      func,
      {
        parallel: !options.disableParallelRequests,
      }
    );
  }
}
