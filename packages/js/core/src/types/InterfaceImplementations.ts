import { Uri } from ".";
import { toUri } from "../utils";

import { Tracer } from "@polywrap/tracing-js";

export interface InterfaceImplementations<TUri extends Uri | string = string> {
  interface: TUri;
  implementations: TUri[];
}

export const sanitizeInterfaceImplementations = Tracer.traceFunc(
  "core: sanitizeInterfaceImplementations",
  (
    input: InterfaceImplementations<Uri | string>[]
  ): InterfaceImplementations<Uri>[] => {
    const output: InterfaceImplementations<Uri>[] = [];
    for (const definition of input) {
      const interfaceUri = toUri(definition.interface);

      const implementations = definition.implementations.map(toUri);

      output.push({
        interface: interfaceUri,
        implementations: implementations,
      });
    }

    return output;
  }
);
