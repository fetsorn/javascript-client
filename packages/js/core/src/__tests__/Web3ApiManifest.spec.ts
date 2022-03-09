import { deserializeWeb3ApiManifest } from "../manifest";

import fs from "fs";

describe("Web3API Manifest Validation", () => {
  it("Should throw file string does not exist error", async () => {
    const manifestPath = __dirname + "/manifest/web3api/file-string-malformed/web3api.yaml";
    const manifest = fs.readFileSync(manifestPath, "utf-8");

    expect(() => deserializeWeb3ApiManifest(manifest)).toThrowError(/instance.mutation.schema.file does not conform to the "file" format/);
  });
  it("Should throw incorrect version format error", async () => {
    const manifestPath = __dirname + "/manifest/web3api/incorrect-version-format/web3api.yaml";
    const manifest = fs.readFileSync(manifestPath, "utf-8");

    expect(() => deserializeWeb3ApiManifest(manifest)).toThrowError(/Unrecognized Web3ApiManifest schema format/);
  });
  it("Should throw not accepted field error", async () => {
    const manifestPath = __dirname + "/manifest/web3api/not-accepted-field/web3api.yaml";
    const manifest = fs.readFileSync(manifestPath, "utf-8");

    expect(() => deserializeWeb3ApiManifest(manifest)).toThrowError(/not allowed to have the additional property "not_accepted_field"/);
  });
  it("Should throw required field missing error", async () => {
    const manifestPath = __dirname + "/manifest/web3api/required-field-missing/web3api.yaml";
    const manifest = fs.readFileSync(manifestPath, "utf-8");
    expect(() => deserializeWeb3ApiManifest(manifest)).toThrowError(/instance.mutation.module requires property "file"/);
  });
  it("Should throw wrong type error", async () => {
    const manifestPath = __dirname + "/manifest/web3api/wrong-type/web3api.yaml";
    const manifest = fs.readFileSync(manifestPath, "utf-8");

    expect(() => deserializeWeb3ApiManifest(manifest)).toThrowError(/instance.mutation.schema.file is not of a type\(s\) string/);
  });
});
