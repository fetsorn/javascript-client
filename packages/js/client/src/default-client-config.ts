import { ClientConfig, WasmWrapper } from ".";
import { PluginWrapper } from "./plugin/PluginWrapper";

import {
  Uri,
  coreInterfaceUris,
  PluginPackage,
  PolywrapManifest,
  Env,
  ExtendableUriResolver,
  CacheResolver,
  PluginResolver,
  RedirectsResolver,
} from "@polywrap/core-js";
import { ipfsPlugin } from "@polywrap/ipfs-plugin-js";
import { ethereumPlugin } from "@polywrap/ethereum-plugin-js";
import { ensPlugin } from "@polywrap/ens-plugin-js";
import { graphNodePlugin } from "@polywrap/graph-node-plugin-js";
import { httpPlugin } from "@polywrap/http-plugin-js";
import { filesystemPlugin } from "@polywrap/fs-plugin-js";
import { uts46Plugin } from "@polywrap/uts46-plugin-js";
import { sha3Plugin } from "@polywrap/sha3-plugin-js";
import { loggerPlugin } from "@polywrap/logger-plugin-js";
import { Tracer } from "@polywrap/tracing-js";

export const getDefaultClientConfig = Tracer.traceFunc(
  "client-js: getDefaultClientConfig",
  (): ClientConfig<Uri> => {
    return {
      envs: [],
      redirects: [],
      plugins: [
        // IPFS is required for downloading Polywrap packages
        {
          uri: new Uri("wrap://ens/ipfs.polywrap.eth"),
          plugin: ipfsPlugin({
            provider: defaultIpfsProviders[0],
            fallbackProviders: defaultIpfsProviders.slice(1),
          }),
        },
        // ENS is required for resolving domain to IPFS hashes
        {
          uri: new Uri("wrap://ens/ens.polywrap.eth"),
          plugin: ensPlugin({}),
        },
        {
          uri: new Uri("wrap://ens/ethereum.polywrap.eth"),
          plugin: ethereumPlugin({
            networks: {
              mainnet: {
                provider:
                  "https://mainnet.infura.io/v3/b00b2c2cc09c487685e9fb061256d6a6",
              },
            },
          }),
        },
        {
          uri: new Uri("wrap://ens/http.polywrap.eth"),
          plugin: httpPlugin({}),
        },
        {
          uri: new Uri("wrap://ens/js-logger.polywrap.eth"),
          plugin: loggerPlugin({}),
        },
        {
          uri: new Uri("wrap://ens/uts46.polywrap.eth"),
          plugin: uts46Plugin({}),
        },
        {
          uri: new Uri("wrap://ens/sha3.polywrap.eth"),
          plugin: sha3Plugin({}),
        },
        {
          uri: new Uri("wrap://ens/graph-node.polywrap.eth"),
          plugin: graphNodePlugin({
            provider: "https://api.thegraph.com",
          }),
        },
        {
          uri: new Uri("wrap://ens/fs.polywrap.eth"),
          plugin: filesystemPlugin({}),
        },
      ],
      interfaces: [
        {
          interface: coreInterfaceUris.uriResolver,
          implementations: [
            new Uri("wrap://ens/ipfs.polywrap.eth"),
            new Uri("wrap://ens/ens.polywrap.eth"),
            new Uri("wrap://ens/fs.polywrap.eth"),
          ],
        },
        {
          interface: coreInterfaceUris.logger,
          implementations: [new Uri("wrap://ens/js-logger.polywrap.eth")],
        },
      ],
      uriResolvers: [
        new RedirectsResolver(),
        new CacheResolver(),
        new PluginResolver(
          (
            uri: Uri,
            plugin: PluginPackage<unknown>,
            environment: Env<Uri> | undefined
          ) => new PluginWrapper(uri, plugin, environment)
        ),
        new ExtendableUriResolver(
          (
            uri: Uri,
            manifest: PolywrapManifest,
            uriResolver: string,
            environment: Env<Uri> | undefined
          ) => {
            return new WasmWrapper(uri, manifest, uriResolver, environment);
          }
        ),
      ],
    };
  }
);

export const defaultIpfsProviders = [
  "https://ipfs.wrappers.io",
  "https://ipfs.io",
];
