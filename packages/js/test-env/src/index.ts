/* eslint-disable @typescript-eslint/naming-convention */
import { generateName } from "./generate-name";

import path from "path";
import spawn from "spawn-command";
import axios from "axios";
import fs from "fs";
import yaml from "js-yaml";
import { deserializeWeb3ApiManifest, Uri } from "@polywrap/core-js";
import { Web3ApiClient } from "@polywrap/client-js";
import { ethereumPlugin } from "@polywrap/ethereum-plugin-js";

export const ensAddresses = {
  ensAddress: "0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab",
  resolverAddress: "0x5b1869D9A4C187F2EAa108f3062412ecf0526b24",
  registrarAddress: "0xD833215cBcc3f914bD1C9ece3EE7BF8B14f841bb",
  reverseAddress: "0xe982E462b094850F12AF94d21D470e21bE9D0E9C",
} as const;

export const providers = {
  ipfs: "http://localhost:5001",
  ethereum: "http://localhost:8545",
};

const monorepoCli = `${__dirname}/../../../cli/bin/w3`;
const npmCli = `${__dirname}/../../cli/bin/w3`;

async function awaitResponse(
  url: string,
  expectedRes: string,
  getPost: "get" | "post",
  timeout: number,
  maxTimeout: number,
  data?: string
) {
  let time = 0;

  while (time < maxTimeout) {
    const request = getPost === "get" ? axios.get(url) : axios.post(url, data);
    const success = await request
      .then(function (response) {
        const responseData = JSON.stringify(response.data);
        return responseData.indexOf(expectedRes) > -1;
      })
      .catch(function () {
        return false;
      });

    if (success) {
      return true;
    }

    await new Promise<void>(function (resolve) {
      setTimeout(() => resolve(), timeout);
    });

    time += timeout;
  }

  return false;
}

export const initTestEnvironment = async (cli?: string): Promise<void> => {
  // Start the test environment
  const { exitCode, stderr, stdout } = await runCLI({
    args: ["infra", "up", "--modules=eth-ens-ipfs", "--verbose"],
    cli,
  });

  // Wait for all endpoints to become available
  let success = false;

  // IPFS
  success = await awaitResponse(
    `http://localhost:5001/api/v0/version`,
    '"Version":',
    "get",
    2000,
    20000
  );

  if (!success) {
    throw Error("test-env: IPFS failed to start");
  }

  // Ganache
  success = await awaitResponse(
    `http://localhost:8545`,
    '"jsonrpc":',
    "post",
    2000,
    20000,
    '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":83}'
  );

  if (!success) {
    throw Error("test-env: Ganache failed to start");
  }

  if (exitCode) {
    throw Error(
      `initTestEnvironment failed to start test environment.\nExit Code: ${exitCode}\nStdErr: ${stderr}\nStdOut: ${stdout}`
    );
  }

  // Wait an extra couple of seconds for the ens deployment to finish
  await new Promise((resolve) => setTimeout(resolve, 3000));
};

export const stopTestEnvironment = async (cli?: string): Promise<void> => {
  // Stop the test environment
  const { exitCode, stderr } = await runCLI({
    args: ["infra", "down", "--modules=eth-ens-ipfs"],
    cli,
  });

  if (exitCode) {
    throw Error(
      `stopTestEnvironment failed to stop test environment.\nExit Code: ${exitCode}\nStdErr: ${stderr}`
    );
  }

  return Promise.resolve();
};

export const runCLI = async (options: {
  args: string[];
  cwd?: string;
  cli?: string;
  env?: Record<string, string>;
}): Promise<{
  exitCode: number;
  stdout: string;
  stderr: string;
}> => {
  const [exitCode, stdout, stderr] = await new Promise((resolve, reject) => {
    if (!options.cwd) {
      // Make sure to set an absolute working directory
      const cwd = process.cwd();
      options.cwd = cwd[0] !== "/" ? path.resolve(__dirname, cwd) : cwd;
    }

    // Resolve the CLI
    if (!options.cli) {
      if (fs.existsSync(monorepoCli)) {
        options.cli = monorepoCli;
      } else if (fs.existsSync(npmCli)) {
        options.cli = npmCli;
      } else {
        throw Error(`runCli is missing a valid CLI path, please provide one`);
      }
    }

    const command = `node ${options.cli} ${options.args.join(" ")}`;
    const child = spawn(command, { cwd: options.cwd, env: options.env });

    let stdout = "";
    let stderr = "";

    child.on("error", (error: Error) => {
      reject(error);
    });

    child.stdout?.on("data", (data: string) => {
      stdout += data.toString();
    });

    child.stderr?.on("data", (data: string) => {
      stderr += data.toString();
    });

    child.on("exit", (exitCode: number) => {
      resolve([exitCode, stdout, stderr]);
    });
  });

  return {
    exitCode,
    stdout,
    stderr,
  };
};

export async function buildApi(apiAbsPath: string): Promise<void> {
  const manifestPath = `${apiAbsPath}/web3api.yaml`;
  const {
    exitCode: buildExitCode,
    stdout: buildStdout,
    stderr: buildStderr,
  } = await runCLI({
    args: [
      "build",
      "--manifest-file",
      manifestPath,
      "--output-dir",
      `${apiAbsPath}/build`,
    ],
  });

  if (buildExitCode !== 0) {
    console.error(`w3 exited with code: ${buildExitCode}`);
    console.log(`stderr:\n${buildStderr}`);
    console.log(`stdout:\n${buildStdout}`);
    throw Error("w3 CLI failed");
  }
}

export async function buildAndDeployApi({
  apiAbsPath,
  ipfsProvider,
  ethereumProvider,
  ensName,
}: {
  apiAbsPath: string;
  ipfsProvider: string;
  ethereumProvider: string;
  ensName?: string;
}): Promise<{
  ensDomain: string;
  ipfsCid: string;
}> {
  const manifestPath = `${apiAbsPath}/web3api.yaml`;
  const tempManifestFilename = `web3api-temp.yaml`;
  const tempDeployManifestFilename = `web3api.deploy-temp.yaml`;
  const tempManifestPath = path.join(apiAbsPath, tempManifestFilename);
  const tempDeployManifestPath = path.join(
    apiAbsPath,
    tempDeployManifestFilename
  );

  // create a new ENS domain
  const apiEns = ensName ?? `${generateName()}.eth`;

  await buildApi(apiAbsPath);

  // register ENS domain
  const ensWrapperUri = `fs/${__dirname}/wrappers/ens`;

  const ethereumPluginUri = "w3://ens/ethereum.web3api.eth";

  const client = new Web3ApiClient({
    plugins: [
      {
        uri: ethereumPluginUri,
        plugin: ethereumPlugin({
          networks: {
            testnet: {
              provider: ethereumProvider,
            },
          },
          defaultNetwork: "testnet",
        }),
      },
    ],
  });

  const { data: signerAddress } = await client.invoke<string>({
    method: "getSignerAddress",
    uri: ethereumPluginUri,
    input: {
      connection: {
        networkNameOrChainId: "testnet",
      },
    },
  });

  if (!signerAddress) {
    throw new Error("Could not get signer");
  }

  const { data: registerData, error } = await client.invoke<{ hash: string }>({
    method: "registerDomainAndSubdomainsRecursively",
    uri: ensWrapperUri,
    input: {
      domain: apiEns,
      owner: signerAddress,
      resolverAddress: ensAddresses.resolverAddress,
      ttl: "0",
      registrarAddress: ensAddresses.registrarAddress,
      registryAddress: ensAddresses.ensAddress,
      connection: {
        networkNameOrChainId: "testnet",
      },
    },
  });

  if (!registerData) {
    throw new Error(
      `Could not register domain '${apiEns}'` +
        (error ? `\nError: ${error.message}` : "")
    );
  }

  await client.invoke({
    method: "awaitTransaction",
    uri: ethereumPluginUri,
    input: {
      txHash: registerData.hash,
      confirmations: 1,
      timeout: 15000,
      connection: {
        networkNameOrChainId: "testnet",
      },
    },
  });

  // manually configure manifests

  const { __type, ...web3apiManifest } = deserializeWeb3ApiManifest(
    fs.readFileSync(manifestPath, "utf-8")
  );

  fs.writeFileSync(
    tempManifestPath,
    yaml.dump({
      ...web3apiManifest,
      deploy: `./${tempDeployManifestFilename}`,
    })
  );

  fs.writeFileSync(
    tempDeployManifestPath,
    yaml.dump({
      format: "0.0.1-prealpha.1",
      stages: {
        ipfsDeploy: {
          package: "ipfs",
          uri: `fs/${apiAbsPath}/build`,
          config: {
            gatewayUri: ipfsProvider,
          },
        },
        ensPublish: {
          package: "ens",
          // eslint-disable-next-line @typescript-eslint/naming-convention
          depends_on: "ipfsDeploy",
          config: {
            domainName: apiEns,
            provider: ethereumProvider,
            ensRegistryAddress: ensAddresses.ensAddress,
          },
        },
      },
    })
  );

  // deploy API

  const {
    exitCode: deployExitCode,
    stdout: deployStdout,
    stderr: deployStderr,
  } = await runCLI({
    args: ["deploy", "--manifest-file", tempManifestPath],
  });

  if (deployExitCode !== 0) {
    console.error(`w3 exited with code: ${deployExitCode}`);
    console.log(`stderr:\n${deployStderr}`);
    console.log(`stdout:\n${deployStdout}`);
    throw Error("w3 CLI failed");
  }

  // remove manually configured manifests

  fs.unlinkSync(tempManifestPath);
  fs.unlinkSync(tempDeployManifestPath);

  // get the IPFS CID of the published package
  const extractCID = /(w3:\/\/ipfs\/[A-Za-z0-9]+)/;
  const result = deployStdout.match(extractCID);

  if (!result) {
    throw Error(`W3 CLI output missing IPFS CID.\nOutput: ${deployStdout}`);
  }

  const apiCid = new Uri(result[1]).path;

  return {
    ensDomain: apiEns,
    ipfsCid: apiCid,
  };
}
