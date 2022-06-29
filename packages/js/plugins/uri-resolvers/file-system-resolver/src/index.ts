import {
  Bytes,
  Client,
  FileSystem_EncodingEnum,
  FileSystem_Module,
  Args_getFile,
  Args_tryResolveUri,
  Module,
  UriResolver_MaybeUriOrManifest,
  manifest,
} from "./wrap";

import { PluginFactory } from "@polywrap/core-js";
import path from "path";

type NoConfig = Record<string, never>;

export class FileSystemResolverPlugin extends Module<NoConfig> {
  async tryResolveUri(
    args: Args_tryResolveUri,
    _client: Client
  ): Promise<UriResolver_MaybeUriOrManifest | null> {
    if (args.authority !== "fs" && args.authority !== "file") {
      return null;
    }

    const manifestSearchPatterns = ["polywrap.json"];

    let manifest: Bytes | undefined;

    for (const manifestSearchPattern of manifestSearchPatterns) {
      const manifestPath = path.resolve(args.path, manifestSearchPattern);
      const manifestExistsResult = await FileSystem_Module.exists(
        { path: manifestPath },
        _client
      );

      if (manifestExistsResult.data) {
        try {
          const manifestResult = await FileSystem_Module.readFile(
            { path: manifestPath, encoding: FileSystem_EncodingEnum.BINARY },
            _client
          );
          if (manifestResult.error) {
            console.warn(manifestResult.error);
          }
          manifest = manifestResult.data;
        } catch (e) {
          // TODO: logging
        }
      }
    }

    return { uri: null, manifest };
  }

  async getFile(args: Args_getFile, _client: Client): Promise<Bytes | null> {
    try {
      const fileResult = await FileSystem_Module.readFile(
        { path: args.path },
        _client
      );

      if (fileResult.data) {
        return new Uint8Array(fileResult.data);
      }

      return null;
    } catch (e) {
      return null;
    }
  }
}

export const fileSystemResolverPlugin: PluginFactory<NoConfig> = () => {
  return {
    factory: () => new FileSystemResolverPlugin({}),
    manifest,
  };
};
