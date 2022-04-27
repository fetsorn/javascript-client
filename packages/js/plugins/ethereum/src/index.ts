// TIP: All user-defined code lives in the module folders (./query, ./mutation)

import * as Internal from "./w3";
import { EthereumConfig } from "./common/EthereumConfig";

import { PluginFactory } from "@web3api/core-js";

export { manifest, schema } from "./w3";

export interface EthereumPluginConfigs
  extends EthereumConfig,
    Record<string, unknown> {}

export class EthereumPlugin extends Internal.EthereumPlugin {
  constructor(config: EthereumPluginConfigs) {
    super({
      query: config,
      mutation: config,
    });
  }
}

export const ethereumPlugin: PluginFactory<EthereumPluginConfigs> = (
  opts: EthereumPluginConfigs
) =>
  Internal.ethereumPlugin({
    query: opts,
    mutation: opts,
  });

export const plugin = ethereumPlugin;
