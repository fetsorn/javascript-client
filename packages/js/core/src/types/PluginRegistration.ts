import { PluginPackage, Uri } from ".";
import { toUri } from "../utils";

import { Tracer } from "@polywrap/tracing-js";

export interface PluginRegistration<TUri extends Uri | string = string> {
  uri: TUri;
  plugin: PluginPackage<unknown>;
}

export const sanitizePluginRegistrations = Tracer.traceFunc(
  "core: sanitizePluginRegistrations",
  (input: PluginRegistration<Uri | string>[]): PluginRegistration<Uri>[] => {
    const output: PluginRegistration<Uri>[] = [];
    for (const definition of input) {
      const uri = toUri(definition.uri);

      output.push({
        uri,
        plugin: definition.plugin,
      });
    }

    return output;
  }
);
