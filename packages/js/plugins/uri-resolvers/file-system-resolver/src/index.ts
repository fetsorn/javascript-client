import {
  Bytes,
  Client,
  FileSystem_EncodingEnum,
  FileSystem_Module,
  Input_getFile,
  Input_tryResolveUri,
  Module,
  UriResolver_MaybeUriOrManifest,
  manifest,
} from "./wrap";

import { PluginFactory } from "@polywrap/core-js";
import path from "path";

export type ModuleConfig = Record<string, unknown>;

export class FileSystemResolverPlugin extends Module<ModuleConfig> {
  async tryResolveUri(
    input: Input_tryResolveUri,
    _client: Client
  ): Promise<UriResolver_MaybeUriOrManifest | null> {
    if (input.authority !== "fs" && input.authority !== "file") {
      return null;
    }

    const manifestSearchPatterns = ["polywrap.json"];

    let manifest: string | undefined;

    for (const manifestSearchPattern of manifestSearchPatterns) {
      const manifestPath = path.resolve(input.path, manifestSearchPattern);
      const manifestExistsResult = await FileSystem_Module.exists(
        { path: manifestPath },
        _client
      );

      if (manifestExistsResult.data) {
        try {
          const manifestResult = await FileSystem_Module.readFileAsString(
            { path: manifestPath, encoding: FileSystem_EncodingEnum.UTF8 },
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

    if (manifest) {
      return { uri: null, manifest };
    } else {
      // Noting found
      return { uri: null, manifest: null };
    }
  }

  async getFile(input: Input_getFile, _client: Client): Promise<Bytes | null> {
    try {
      const fileResult = await FileSystem_Module.readFile(
        { path: input.path },
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
export const fileSystemResolverPlugin: PluginFactory<ModuleConfig> = (
  opts: ModuleConfig
) => {
  return {
    factory: () => new FileSystemResolverPlugin(opts),
    manifest,
  };
};
