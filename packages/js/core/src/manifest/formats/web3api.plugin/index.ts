/* eslint-disable */
/**
 * This file was automatically generated by scripts/manifest/index-ts.mustache.
 * DO NOT MODIFY IT BY HAND. Instead, modify scripts/manifest/index-ts.mustache,
 * and run node ./scripts/manifest/generateFormatTypes.js to regenerate this file.
 */

import {
  PluginManifest as PluginManifest0_0_1_prealpha_1
} from "./0.0.1-prealpha.1";
import {
  PluginManifest as PluginManifest0_0_1_prealpha_2
} from "./0.0.1-prealpha.2";

export {
  PluginManifest0_0_1_prealpha_1,
  PluginManifest0_0_1_prealpha_2,
};

export enum PluginManifestFormats {
  "0.0.1-prealpha.1" = "0.0.1-prealpha.1",
  "0.0.1-prealpha.2" = "0.0.1-prealpha.2",
}

export type AnyPluginManifest =
  | PluginManifest0_0_1_prealpha_1
  | PluginManifest0_0_1_prealpha_2

export type PluginManifest = PluginManifest0_0_1_prealpha_2;

export const latestPluginManifestFormat = PluginManifestFormats["0.0.1-prealpha.2"]

export { migratePluginManifest } from "./migrate";

export { deserializePluginManifest } from "./deserialize";

export { validatePluginManifest } from "./validate";
