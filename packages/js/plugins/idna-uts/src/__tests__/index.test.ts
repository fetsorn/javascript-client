import { Uri } from "@web3api/core-js";
import { Web3ApiClient } from "@web3api/client-js";
import uts46 from "idna-uts46-hx";
import { UTS46Plugin } from "..";

const textToConvert = "xn-bb-eka.at";

describe("IDNA UTS #46", () => {
  let client: Web3ApiClient;

  beforeAll(() => {
    client = new Web3ApiClient({
      redirects: [
        {
          from: new Uri("w3://ens/uts46.web3api.eth"),
          to: {
            factory: () => new UTS46Plugin(),
            manifest: UTS46Plugin.manifest(),
          },
        },
      ],
    });
  });

  describe("Returned values match the plugin's", () => {
    it("ToAscii matches", async () => {
      const expected = uts46.toAscii(textToConvert);
      const response = await client.query<{ toAscii: string }>({
        uri: new Uri("w3://ens/uts46.web3api.eth"),
        query: `
          query {
            toAscii(value: "${textToConvert}")
          }
        `,
      });

      expect(response.data).toBeDefined();
      expect(response.errors).toBeUndefined();
      expect(response.data?.toAscii).toBe(expected);
    });

    it("ToUnicode matches", async () => {
      const expected = uts46.toUnicode(textToConvert);
      const response = await client.query<{ toUnicode: string }>({
        uri: new Uri("w3://ens/uts46.web3api.eth"),
        query: `
          query {
            toUnicode(value: "${textToConvert}")
          }
        `,
      });

      expect(response.data).toBeDefined();
      expect(response.errors).toBeUndefined();
      expect(response.data?.toUnicode).toBe(expected);
    });

    it("Convert matches", async () => {
      const expected = uts46.convert(textToConvert);
      const response = await client.query<{ convert: string }>({
        uri: new Uri("w3://ens/uts46.web3api.eth"),
        query: `
          query {
            convert(value: "${textToConvert}")
          }
        `,
      });

      expect(response.data).toBeDefined();
      expect(response.errors).toBeUndefined();
      expect(response.data?.convert).toEqual(expected);
    });
  });
});
