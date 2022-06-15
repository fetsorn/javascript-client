/* eslint-disable */
/**
 * This file was automatically generated by scripts/manifest/deserialize-ts.mustache.
 * DO NOT MODIFY IT BY HAND. Instead, modify scripts/manifest/deserialize-ts.mustache,
 * and run node ./scripts/manifest/generateFormatTypes.js to regenerate this file.
 */

import {
  Web3ApiManifest,
  AnyWeb3ApiManifest,
  migrateWeb3ApiManifest,
  validateWeb3ApiManifest,
  latestWeb3ApiManifestFormat,
} from ".";
import { DeserializeManifestOptions } from "../../";

import { compare } from "semver";
import YAML from "js-yaml";
import { Tracer } from "@polywrap/tracing-js";

export const deserializeWeb3ApiManifest = Tracer.traceFunc(
  "core: deserializeWeb3ApiManifest",
  (manifest: string, options?: DeserializeManifestOptions): Web3ApiManifest => {
    let anyWeb3ApiManifest: AnyWeb3ApiManifest | undefined;
    try {
      anyWeb3ApiManifest = JSON.parse(manifest) as AnyWeb3ApiManifest;
    } catch (e) {
      anyWeb3ApiManifest = YAML.safeLoad(manifest) as
      | AnyWeb3ApiManifest
      | undefined;
    }

    if (!anyWeb3ApiManifest) {
      throw Error(`Unable to parse Web3ApiManifest: ${manifest}`);
    }

    if (!options || !options.noValidate) {
      validateWeb3ApiManifest(anyWeb3ApiManifest, options?.extSchema);
    }

    anyWeb3ApiManifest.__type = "Web3ApiManifest";

    const versionCompare = compare(
      anyWeb3ApiManifest.format,
      latestWeb3ApiManifestFormat
    );

    if (versionCompare === -1) {
      // Upgrade
      return migrateWeb3ApiManifest(anyWeb3ApiManifest, latestWeb3ApiManifestFormat);
    } else if (versionCompare === 1) {
      // Downgrade
      throw Error(
        `Cannot downgrade Web3API version ${anyWeb3ApiManifest.format}, please upgrade your PolywrapClient package.`
      );
    } else {
      // Latest
      return anyWeb3ApiManifest as Web3ApiManifest;
    }
  }
);
