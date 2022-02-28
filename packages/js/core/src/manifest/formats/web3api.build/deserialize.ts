/* eslint-disable */
/**
 * This file was automatically generated by scripts/manifest/deserialize-ts.mustache.
 * DO NOT MODIFY IT BY HAND. Instead, modify scripts/manifest/deserialize-ts.mustache,
 * and run node ./scripts/manifest/generateFormatTypes.js to regenerate this file.
 */

import {
  BuildManifest,
  AnyBuildManifest,
  migrateBuildManifest,
  validateBuildManifest,
  latestBuildManifestFormat,
} from ".";
import { DeserializeManifestOptions } from "../../";

import { compare } from "semver";
import YAML from "js-yaml";
import { Tracer } from "@web3api/tracing-js";

export const deserializeBuildManifest = Tracer.traceFunc(
  "core: deserializeBuildManifest",
  (manifest: string, options?: DeserializeManifestOptions): BuildManifest => {
    let anyBuildManifest: AnyBuildManifest | undefined;
    try {
      anyBuildManifest = JSON.parse(manifest) as AnyBuildManifest;
    } catch (e) {
      anyBuildManifest = YAML.safeLoad(manifest) as
      | AnyBuildManifest
      | undefined;
    }

    if (!anyBuildManifest) {
      throw Error(`Unable to parse BuildManifest: ${manifest}`);
    }

    if (!options || !options.noValidate) {
      validateBuildManifest(anyBuildManifest, options?.extSchema);
    }

    anyBuildManifest.__type = "BuildManifest";

    const versionCompare = compare(
      anyBuildManifest.format,
      latestBuildManifestFormat
    );

    if (versionCompare === -1) {
      // Upgrade
      return migrateBuildManifest(anyBuildManifest, latestBuildManifestFormat);
    } else if (versionCompare === 1) {
      // Downgrade
      throw Error(
        `Cannot downgrade Web3API version ${anyBuildManifest.format}, please upgrade your Web3ApiClient package.`
      );
    } else {
      // Latest
      return anyBuildManifest as BuildManifest;
    }
  }
);
