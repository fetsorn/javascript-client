import { generateName } from "./generate-name";

import path from "path";
import spawn from "spawn-command";
import axios from "axios";
import fs from "fs";
import yaml from "js-yaml";
import { deserializeWeb3ApiManifest, Uri } from "@web3api/core-js";
import { Web3ApiClient } from "@web3api/client-js";
import { ethereumPlugin } from "@web3api/ethereum-plugin-js";

interface TestEnvironment {
  ipfs: string;
  ethereum: string;
  ensAddress: string;
  registrarAddress: string;
  reverseAddress: string;
  resolverAddress: string;
}

const monorepoCli = `${__dirname}/../../../cli/bin/w3`;
const npmCli = `${__dirname}/../../cli/bin/w3`;

export const initTestEnvironment = async (
  cli?: string
): Promise<TestEnvironment> => {
  // Start the test environment
  const { exitCode, stderr, stdout } = await runCLI({
    args: ["test-env", "up"],
    cli,
  });

  if (exitCode) {
    throw Error(
      `initTestEnvironment failed to start test environment.\nExit Code: ${exitCode}\nStdErr: ${stderr}\nStdOut: ${stdout}`
    );
  }

  try {
    // fetch providers from dev server
    const { data: providers } = await axios.get(
      "http://localhost:4040/providers"
    );

    const ipfs = providers.ipfs;
    const ethereum = providers.ethereum;

    // re-deploy ENS
    const { data: ensAddresses } = await axios.get(
      "http://localhost:4040/deploy-ens"
    );
    return {
      ipfs,
      ethereum,
      ...ensAddresses,
    };
  } catch (e) {
    throw Error(`Dev server must be running at port 4040\n${e}`);
  }
};

export const stopTestEnvironment = async (cli?: string): Promise<void> => {
  // Stop the test environment
  const { exitCode, stderr } = await runCLI({
    args: ["test-env", "down"],
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
    const child = spawn(command, { cwd: options.cwd });

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

export async function buildAndDeployApi({
  apiAbsPath,
  ipfsProvider,
  ensRegistryAddress,
  ensRegistrarAddress,
  ensResolverAddress,
  ethereumProvider,
  ensName,
}: {
  apiAbsPath: string;
  ipfsProvider: string;
  ensRegistryAddress: string;
  ensRegistrarAddress: string;
  ensResolverAddress: string;
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

  // build API
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
    module: "query",
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

  const { data: registerData } = await client.invoke<{ hash: string }>({
    method: "registerDomainAndSubdomainsRecursively",
    module: "mutation",
    uri: ensWrapperUri,
    input: {
      domain: apiEns,
      owner: signerAddress,
      resolverAddress: ensResolverAddress,
      ttl: "0",
      registrarAddress: ensRegistrarAddress,
      registryAddress: ensRegistryAddress,
      connection: {
        networkNameOrChainId: "testnet",
      },
    },
  });

  if (!registerData) {
    throw new Error(`Could not register domain '${apiEns}'`);
  }

  await client.invoke({
    method: "awaitTransaction",
    module: "query",
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
      format: "0.0.1-prealpha.8",
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
            ensRegistryAddress,
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
