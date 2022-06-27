import { PolywrapClient, defaultIpfsProviders } from "@polywrap/client-js";
import { GetPathToTestWrappers } from "@polywrap/test-cases";
import {
  initTestEnvironment,
  providers,
  ensAddresses,
  stopTestEnvironment,
  buildAndDeployWrapper,
} from "@polywrap/test-env-js";

import { ensResolverPlugin } from "..";
import { ipfsPlugin } from "@polywrap/ipfs-plugin-js";
import { ethereumPlugin } from "@polywrap/ethereum-plugin-js";

import fs from "fs";
import path from "path";

jest.setTimeout(300000);

describe("ENS Resolver Plugin", () => {
  let client: PolywrapClient;
  let wrapperEnsDomain: string;

  const wrapperAbsPath = `${GetPathToTestWrappers()}/wasm-as/simple-storage`;

  beforeAll(async () => {
    await initTestEnvironment();

    let { ensDomain } = await buildAndDeployWrapper({
      wrapperAbsPath: wrapperAbsPath,
      ipfsProvider: providers.ipfs,
      ethereumProvider: providers.ethereum,
      ensName: "simple-storage.eth",
    });

    wrapperEnsDomain = ensDomain;

    client = new PolywrapClient({
      plugins: [
        {
          uri: "wrap://ens/ipfs.polywrap.eth",
          plugin: ipfsPlugin({
            provider: providers.ipfs,
            fallbackProviders: defaultIpfsProviders,
          }),
        },
        {
          uri: "wrap://ens/ethereum.polywrap.eth",
          plugin: ethereumPlugin({
            networks: {
              testnet: {
                provider: providers.ethereum,
              },
            },
            defaultNetwork: "testnet",
          }),
        },
        {
          uri: "wrap://ens/ens-resolver.polywrap.eth",
          plugin: ensResolverPlugin({
            addresses: {
              testnet: ensAddresses.ensAddress,
            },
          }),
        },
      ],
    });
  });

  afterAll(async () => {
    await stopTestEnvironment();
  });

  it("Should successfully resolve a deployed wrapper - e2e", async () => {
    const wrapperUri = `ens/testnet/${wrapperEnsDomain}`;
    const resolution = await client.resolveUri(wrapperUri);

    expect(resolution.error).toBeFalsy();
    expect(resolution.wrapper).toBeTruthy();

    const expectedSchema = await fs.promises.readFile(
      path.resolve(wrapperAbsPath, "build/schema.graphql"),
      { encoding: "utf-8" }
    );

    const schema = await resolution.wrapper?.getSchema(client);

    expect(schema).toEqual(expectedSchema);

    const manifest = await resolution.wrapper?.getManifest(
      { type: "polywrap" },
      client
    );

    expect(manifest?.name).toBe("SimpleStorage");
  });
});
