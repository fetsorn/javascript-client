/* eslint-disable */
/**
 * This file was automatically generated by scripts/manifest/deserialize-ts.mustache.
 * DO NOT MODIFY IT BY HAND. Instead, modify scripts/manifest/deserialize-ts.mustache,
 * and run node ./scripts/manifest/generateFormatTypes.js to regenerate this file.
 */

import {
  DeployManifest,
  AnyDeployManifest,
  migrateDeployManifest,
  validateDeployManifest,
  latestDeployManifestFormat,
} from ".";
import { DeserializeManifestOptions } from "../../";

import { compare } from "semver";
import YAML from "js-yaml";
import { Tracer } from "@web3api/tracing-js";

export const deserializeDeployManifest = Tracer.traceFunc(
  "core: deserializeDeployManifest",
  (manifest: string, options?: DeserializeManifestOptions): DeployManifest => {
    let anyDeployManifest: AnyDeployManifest | undefined;
    try {
      anyDeployManifest = JSON.parse(manifest) as AnyDeployManifest;
    } catch (e) {
      anyDeployManifest = YAML.safeLoad(manifest) as
      | AnyDeployManifest
      | undefined;
    }

    if (!anyDeployManifest) {
      throw Error(`Unable to parse DeployManifest: ${manifest}`);
    }

    if (!options || !options.noValidate) {
      validateDeployManifest(anyDeployManifest, options?.extSchema);
    }

    anyDeployManifest.__type = "DeployManifest";

    const versionCompare = compare(
      anyDeployManifest.format,
      latestDeployManifestFormat
    );

    if (versionCompare === -1) {
      // Upgrade
      return migrateDeployManifest(anyDeployManifest, latestDeployManifestFormat);
    } else if (versionCompare === 1) {
      // Downgrade
      throw Error(
        `Cannot downgrade Web3API version ${anyDeployManifest.format}, please upgrade your Web3ApiClient package.`
      );
    } else {
      // Latest
      return anyDeployManifest as DeployManifest;
    }
  }
);
