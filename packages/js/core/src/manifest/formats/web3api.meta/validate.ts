/* eslint-disable */
/**
 * This file was automatically generated by scripts/manifest/validate-ts.mustache.
 * DO NOT MODIFY IT BY HAND. Instead, modify scripts/manifest/validate-ts.mustache,
 * and run node ./scripts/manifest/generateFormatTypes.js to regenerate this file.
 */
import {
  AnyMetaManifest,
  MetaManifestFormats
} from ".";
import * as Validators from "../../validators";
import schema_0_0_1_prealpha_1 from "@web3api/manifest-schemas/formats/web3api.meta/0.0.1-prealpha.1.json";
import { Tracer } from "@web3api/tracing-js"

import {
  Schema,
  Validator,
  ValidationError,
  ValidatorResult
} from "jsonschema";

type MetaManifestSchemas = {
  [key in MetaManifestFormats]: Schema | undefined
};

const schemas: MetaManifestSchemas = {
  "0.0.1-prealpha.1": schema_0_0_1_prealpha_1,
};

const validator = new Validator();

Validator.prototype.customFormats.websiteUrl = Validators.websiteUrl;
Validator.prototype.customFormats.imageFile = Validators.imageFile;
Validator.prototype.customFormats.graphqlFile = Validators.graphqlFile;
Validator.prototype.customFormats.jsonFile = Validators.jsonFile;

export const validateMetaManifest = Tracer.traceFunc(
  "core: validateMetaManifest",
  (
    manifest: AnyMetaManifest,
    extSchema: Schema | undefined = undefined
  ): void => {
    const schema = schemas[manifest.format as MetaManifestFormats];

    if (!schema) {
      throw Error(`Unrecognized MetaManifest schema format "${manifest.format}"`);
    }

    const throwIfErrors = (result: ValidatorResult) => {
      if (result.errors.length) {
        throw new Error([
          `Validation errors encountered while sanitizing MetaManifest format ${manifest.format}`,
          ...result.errors.map((error: ValidationError) => error.toString())
        ].join("\n"));
      }
    };

    throwIfErrors(validator.validate(manifest, schema));

    if (extSchema) {
      throwIfErrors(validator.validate(manifest, extSchema));
    }
  }
);
