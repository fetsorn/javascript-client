/* eslint-disable */
/**
 * This file was automatically generated by scripts/manifest/deserialize-ts.mustache.
 * DO NOT MODIFY IT BY HAND. Instead, modify scripts/manifest/deserialize-ts.mustache,
 * and run node ./scripts/manifest/generateFormatTypes.js to regenerate this file.
 */

import {
  MetaManifest,
  AnyMetaManifest,
  migrateMetaManifest,
  validateMetaManifest,
  latestMetaManifestFormat,
} from ".";
import { DeserializeManifestOptions } from "../../";

import { compare } from "semver";
import YAML from "js-yaml";
import { Tracer } from "@polywrap/tracing-js";

export const deserializeMetaManifest = Tracer.traceFunc(
  "core: deserializeMetaManifest",
  (manifest: string, options?: DeserializeManifestOptions): MetaManifest => {
    let anyMetaManifest: AnyMetaManifest | undefined;
    try {
      anyMetaManifest = JSON.parse(manifest) as AnyMetaManifest;
    } catch (e) {
      anyMetaManifest = YAML.safeLoad(manifest) as
      | AnyMetaManifest
      | undefined;
    }

    if (!anyMetaManifest) {
      throw Error(`Unable to parse MetaManifest: ${manifest}`);
    }

    if (!options || !options.noValidate) {
      validateMetaManifest(anyMetaManifest, options?.extSchema);
    }

    anyMetaManifest.__type = "MetaManifest";

    const versionCompare = compare(
      anyMetaManifest.format,
      latestMetaManifestFormat
    );

    if (versionCompare === -1) {
      // Upgrade
      return migrateMetaManifest(anyMetaManifest, latestMetaManifestFormat);
    } else if (versionCompare === 1) {
      // Downgrade
      throw Error(
        `Cannot downgrade Web3API version ${anyMetaManifest.format}, please upgrade your PolywrapClient package.`
      );
    } else {
      // Latest
      return anyMetaManifest as MetaManifest;
    }
  }
);
