import { Web3ApiClient } from "../";

export const runAsyncifyTest = async (
  client: Web3ApiClient,
  api: {
    ensDomain: string,
    ipfsCid: string,
  }
) => {
    const ensUri = `ens/testnet/${api.ensDomain}`;
    const ipfsUri = `ipfs/${api.ipfsCid}`;

    const deploy = await client.query<{
      deployContract: string;
    }>({
      uri: ensUri,
      query: `
        mutation {
          deployContract(
            connection: {
              networkNameOrChainId: "testnet"
            }
          )
        }
      `,
    });

    expect(deploy.errors).toBeFalsy();
    expect(deploy.data).toBeTruthy();
    expect(deploy.data?.deployContract.indexOf("0x")).toBeGreaterThan(-1);

    if (!deploy.data) {
      return;
    }

    const address = deploy.data.deployContract;

    const subsequentInvokes = await client.query<{
      subsequentInvokes: string;
    }>({
      uri: ipfsUri,
      query: `
        mutation {
          subsequentInvokes(
            address: "${address}"
            numberOfTimes: 40
            connection: {
              networkNameOrChainId: "testnet"
            }
          )
        }
      `,
    });

    const expected = Array.from(new Array(40), (_, index) => index.toString());

    expect(subsequentInvokes.errors).toBeFalsy();
    expect(subsequentInvokes.data).toBeTruthy();
    expect(subsequentInvokes.data?.subsequentInvokes).toEqual(expected);

    const localVarMethod = await client.query<{
      localVarMethod: boolean;
    }>({
      uri: ipfsUri,
      query: `
        mutation {
          localVarMethod(
            address: "${address}"
            connection: {
              networkNameOrChainId: "testnet"
            }
          )
        }
      `,
    });

    expect(localVarMethod.errors).toBeFalsy();
    expect(localVarMethod.data).toBeTruthy();
    expect(localVarMethod.data?.localVarMethod).toEqual(true);

    const globalVarMethod = await client.query<{
      globalVarMethod: boolean;
    }>({
      uri: ipfsUri,
      query: `
        mutation {
          globalVarMethod(
            address: "${address}"
            connection: {
              networkNameOrChainId: "testnet"
            }
          )
        }
      `,
    });

    expect(globalVarMethod.errors).toBeFalsy();
    expect(globalVarMethod.data).toBeTruthy();
    expect(globalVarMethod.data?.globalVarMethod).toEqual(true);

    const largeStr = new Array(10000).join("web3api ");

    const setDataWithLargeArgs = await client.query<{
      setDataWithLargeArgs: string;
    }>({
      uri: ipfsUri,
      query: `
        mutation {
          setDataWithLargeArgs(
            address: "${address}"
            value: $largeStr
            connection: {
              networkNameOrChainId: "testnet"
            }
          )
        }
      `,
      variables: {
        largeStr,
      },
    });

    expect(setDataWithLargeArgs.errors).toBeFalsy();
    expect(setDataWithLargeArgs.data).toBeTruthy();
    expect(setDataWithLargeArgs.data?.setDataWithLargeArgs).toEqual(largeStr);

    const setDataWithManyArgs = await client.query<{
      setDataWithManyArgs: string;
    }>({
      uri: ipfsUri,
      query: `
        mutation {
          setDataWithManyArgs(
            address: "${address}"
            valueA: $valueA
            valueB: $valueB
            valueC: $valueC
            valueD: $valueD
            valueE: $valueE
            valueF: $valueF
            valueG: $valueG
            valueH: $valueH
            valueI: $valueI
            valueJ: $valueJ
            valueK: $valueK
            valueL: $valueL
            connection: {
              networkNameOrChainId: "testnet"
            }
          )
        }
      `,
      variables: {
        valueA: "web3api a",
        valueB: "web3api b",
        valueC: "web3api c",
        valueD: "web3api d",
        valueE: "web3api e",
        valueF: "web3api f",
        valueG: "web3api g",
        valueH: "web3api h",
        valueI: "web3api i",
        valueJ: "web3api j",
        valueK: "web3api k",
        valueL: "web3api l",
      },
    });

    expect(setDataWithManyArgs.errors).toBeFalsy();
    expect(setDataWithManyArgs.data).toBeTruthy();
    expect(setDataWithManyArgs.data?.setDataWithManyArgs).toEqual(
      "web3api aweb3api bweb3api cweb3api dweb3api eweb3api fweb3api gweb3api hweb3api iweb3api jweb3api kweb3api l"
    );

    const createObj = (i: number) => {
      return {
        propA: `a-${i}`,
        propB: `b-${i}`,
        propC: `c-${i}`,
        propD: `d-${i}`,
        propE: `e-${i}`,
        propF: `f-${i}`,
        propG: `g-${i}`,
        propH: `h-${i}`,
        propI: `i-${i}`,
        propJ: `j-${i}`,
        propK: `k-${i}`,
        propL: `l-${i}`,
      };
    };

    const setDataWithManyStructuredArgs = await client.query<{
      setDataWithManyStructuredArgs: string;
    }>({
      uri: ipfsUri,
      query: `
        mutation {
          setDataWithManyStructuredArgs(
            address: "${address}"
            valueA: $valueA
            valueB: $valueB
            valueC: $valueC
            valueD: $valueD
            valueE: $valueE
            valueF: $valueF
            valueG: $valueG
            valueH: $valueH
            valueI: $valueI
            valueJ: $valueJ
            valueK: $valueK
            valueL: $valueL
            connection: {
              networkNameOrChainId: "testnet"
            }
          )
        }
      `,
      variables: {
        valueA: createObj(1),
        valueB: createObj(2),
        valueC: createObj(3),
        valueD: createObj(4),
        valueE: createObj(5),
        valueF: createObj(6),
        valueG: createObj(7),
        valueH: createObj(8),
        valueI: createObj(9),
        valueJ: createObj(10),
        valueK: createObj(11),
        valueL: createObj(12),
      },
    });

    expect(setDataWithManyStructuredArgs.errors).toBeFalsy();
    expect(setDataWithManyStructuredArgs.data).toBeTruthy();
    expect(
      setDataWithManyStructuredArgs.data?.setDataWithManyStructuredArgs
    ).toBe(true);
};


export const runBigIntTypeTest = async (
  client: Web3ApiClient,
  uri: string
) => {
  {
    const response = await client.query<{
      method: string;
    }>({
      uri,
      query: `query {
        method(
          arg1: "123456789123456789"
          obj: {
            prop1: "987654321987654321"
          }
        )
      }`,
    });

    const result =
      BigInt("123456789123456789") * BigInt("987654321987654321");

    expect(response.errors).toBeFalsy();
    expect(response.data).toBeTruthy();
    expect(response.data).toMatchObject({
      method: result.toString(),
    });
  }

  {
    const response = await client.query<{
      method: string;
    }>({
      uri,
      query: `query {
        method(
          arg1: "123456789123456789"
          arg2: "123456789123456789123456789123456789"
          obj: {
            prop1: "987654321987654321"
            prop2: "987654321987654321987654321987654321"
          }
        )
      }`,
    });

    const result =
      BigInt("123456789123456789") *
      BigInt("123456789123456789123456789123456789") *
      BigInt("987654321987654321") *
      BigInt("987654321987654321987654321987654321");

    expect(response.errors).toBeFalsy();
    expect(response.data).toBeTruthy();
    expect(response.data).toMatchObject({
      method: result.toString(),
    });
  }
};

export const runBytesTypeTest = async (
  client: Web3ApiClient,
  uri: string
) => {

  const response = await client.query<{
    bytesMethod: Buffer;
  }>({
    uri,
    query: `
      query {
        bytesMethod(
          arg: {
            prop: $buffer
          }
        )
      }
    `,
    variables: {
      buffer: Buffer.from("Argument Value"),
    },
  });

  expect(response.errors).toBeFalsy();
  expect(response.data).toBeTruthy();
  expect(response.data).toMatchObject({
    bytesMethod: Buffer.from("Argument Value Sanity!").buffer,
  });
};

export const runEnumTypesTest = async (
  client: Web3ApiClient,
  uri: string
) => {
  const method1a = await client.query<any>({
    uri,
    query: `
      query {
        method1(
          en: 5
        )
      }
    `,
  });

  expect(method1a.errors).toBeTruthy();
  expect((method1a.errors as Error[])[0].message).toMatch(
    /__w3_abort: Invalid value for enum 'SanityEnum': 5/gm
  );

  const method1b = await client.query<any>({
    uri,
    query: `
      query {
        method1(
          en: 2
          optEnum: 1
        )
      }
    `,
  });

  expect(method1b.errors).toBeFalsy();
  expect(method1b.data).toBeTruthy();
  expect(method1b.data).toMatchObject({
    method1: 2,
  });

  const method1c = await client.query<any>({
    uri,
    query: `
      query {
        method1(
          en: 1
          optEnum: INVALID
        )
      }
    `,
  });

  expect(method1c.errors).toBeTruthy();
  // @ts-ignore
  expect(method1c.errors[0].message).toMatch(
    /__w3_abort: Invalid key for enum 'SanityEnum': INVALID/gm
  );

  const method2a = await client.query<any>({
    uri,
    query: `
      query {
        method2(
          enumArray: [OPTION1, 0, OPTION3]
        )
      }
    `,
  });

  expect(method2a.errors).toBeFalsy();
  expect(method2a.data).toBeTruthy();
  expect(method2a.data).toMatchObject({
    method2: [0, 0, 2],
  });
};

export const runImplementationsTest = async (
  client: Web3ApiClient,
  interfaceUri: string,
  implementationUri: string
) => {
  expect(client.getImplementations(interfaceUri))
    .toEqual([implementationUri]);

  const query = await client.query<{
    queryMethod: string;
    abstractQueryMethod: string;
  }>({
    uri: implementationUri,
    query: `
      query {
        queryMethod(
          arg: $argument1
        )
        abstractQueryMethod(
          arg: $argument2
        )
      }
    `,
    variables: {
      argument1: {
        uint8: 1,
        str: "Test String 1",
      },
      argument2: {
        str: "Test String 2",
      },
    },
  });

  expect(query.errors).toBeFalsy();
  expect(query.data).toBeTruthy();
  expect(query.data?.queryMethod).toEqual({
    uint8: 1,
    str: "Test String 1",
  });

  expect(query.data?.abstractQueryMethod).toBe("Test String 2");

  const mutation = await client.query<{
    mutationMethod: string;
    abstractMutationMethod: string;
  }>({
    uri: implementationUri,
    query: `
    mutation {
        mutationMethod(
          arg: $argument1
        )
        abstractMutationMethod(
          arg: $argument2
        )
      }
    `,
    variables: {
      argument1: 1,
      argument2: 2,
    },
  });

  expect(mutation.errors).toBeFalsy();
  expect(mutation.data).toBeTruthy();
  expect(mutation.data?.mutationMethod).toBe(1);
  expect(mutation.data?.abstractMutationMethod).toBe(2);
};

export const runGetImplementationsTest = async (
  client: Web3ApiClient,
  interfaceUri: string,
  implementationUri: string
) => {
  expect(client.getImplementations(interfaceUri))
    .toEqual([implementationUri]);

  const query = await client.query<{
    queryMethod: string;
    abstractQueryMethod: string;
  }>({
    uri: implementationUri,
    query: `
      query {
        queryImplementations
      }
    `,
    variables: {},
  });

  expect(query.errors).toBeFalsy();
  expect(query.data).toBeTruthy();
  expect((query.data as any).queryImplementations).toEqual([implementationUri]);
};

export const runInvalidTypesTest = async (
  client: Web3ApiClient,
  uri: string
) => {
  const invalidBoolIntSent = await client.query({
    uri,
    query: `
      query {
        boolMethod(
          arg: $integer
        )
      }
    `,
    variables: {
      integer: 10,
    },
  });
  expect(invalidBoolIntSent.errors).toBeTruthy();
  expect(invalidBoolIntSent.errors?.[0].message).toMatch(
    /Property must be of type 'bool'. Found 'int'./
  );

  const invalidIntBoolSent = await client.query({
    uri,
    query: `
    query {
      intMethod(
        arg: $bool
      )
    }
  `,
    variables: {
      bool: true,
    },
  });
  expect(invalidIntBoolSent.errors).toBeTruthy();
  expect(invalidIntBoolSent.errors?.[0].message).toMatch(
    /Property must be of type 'int'. Found 'bool'./
  );

  const invalidUIntArraySent = await client.query({
    uri,
    query: `
    query {
      uIntMethod(
        arg: $array
      )
    }
  `,
    variables: {
      array: [10],
    },
  });
  expect(invalidUIntArraySent.errors).toBeTruthy();
  expect(invalidUIntArraySent.errors?.[0].message).toMatch(
    /Property must be of type 'uint'. Found 'array'./
  );

  const invalidBytesFloatSent = await client.query({
    uri,
    query: `
    query {
      bytesMethod(
        arg: $float
      )
    }
  `,
    variables: {
      float: 10.15,
    },
  });
  expect(invalidBytesFloatSent.errors).toBeTruthy();
  expect(invalidBytesFloatSent.errors?.[0].message).toMatch(
    /Property must be of type 'bytes'. Found 'float64'./
  );

  const invalidArrayMapSent = await client.query({
    uri,
    query: `
    query {
      arrayMethod(
        arg: $object
      )
    }
  `,
    variables: {
      object: {
        prop: "prop",
      },
    },
  });
  expect(invalidArrayMapSent.errors).toBeTruthy();
  expect(invalidArrayMapSent.errors?.[0].message).toMatch(
    /Property must be of type 'array'. Found 'map'./
  );
};

export const runJsonTypeTest = async (
  client: Web3ApiClient,
  uri: string
) => {
  type Json = string;

  const value = { foo: "bar", bar: "baz" };
  const parseResponse = await client.query<{
    parse: Json;
  }>({
    uri,
    query: `query {
      parse(value: $value)
    }`,
    variables: {
      value: JSON.stringify(value),
    },
  });

  expect(parseResponse.data?.parse).toEqual(JSON.stringify(value));

  const values = [
    JSON.stringify({ bar: "foo" }),
    JSON.stringify({ baz: "fuz" })
  ]
  const stringifyResponse = await client.query<{
    stringify: Json;
  }>({
    uri,
    query: `query {
      stringify(
        values: $values
      )
    }`,
    variables: {
      values,
    },
  });

  expect(stringifyResponse.data?.stringify).toEqual(values.join(""));

  const object = {
    jsonA: JSON.stringify({ foo: "bar" }),
    jsonB: JSON.stringify({ fuz: "baz" }),
  };
  const stringifyObjectResponse = await client.query<{
    stringifyObject: string;
  }>({
    uri,
    query: `query {
      stringifyObject(
        object: $object
      )
    }`,
    variables: {
      object,
    },
  });

  expect(stringifyObjectResponse.data?.stringifyObject).toEqual(
    object.jsonA + object.jsonB
  );

  const methodJSONResponse = await client.query<{
    methodJSON: Json;
  }>({
    uri,
    query: `query {
      methodJSON(valueA: 5, valueB: "foo", valueC: true)
    }`,
  });

  const methodJSONResult = JSON.stringify({
    valueA: 5,
    valueB: "foo",
    valueC: true,
  });
  expect(methodJSONResponse.data?.methodJSON).toEqual(methodJSONResult);
};

export const runLargeTypesTest = async (
  client: Web3ApiClient,
  uri: string
) => {
  const largeStr = new Array(10000).join("web3api ");
  const largeBytes = new Uint8Array(Buffer.from(largeStr));
  const largeStrArray = [];
  const largeBytesArray = [];

  for (let i = 0; i < 100; i++) {
    largeStrArray.push(largeStr);
    largeBytesArray.push(largeBytes);
  }

  const largeTypesMethodCall = await client.query<any>({
    uri,
    query: `
      query {
        method(
          largeCollection: {
            largeStr: $largeStr
            largeBytes: $largeBytes
            largeStrArray: $largeStrArray
            largeBytesArray: $largeBytesArray
          }
        )
      }
    `,
    variables: {
      largeStr: largeStr,
      largeBytes: largeBytes,
      largeStrArray: largeStrArray,
      largeBytesArray: largeBytesArray,
    },
  });

  expect(largeTypesMethodCall.data).toBeTruthy();
  expect(largeTypesMethodCall.data).toEqual({
    method: {
      largeStr: largeStr,
      largeBytes: largeBytes,
      largeStrArray: largeStrArray,
      largeBytesArray: largeBytesArray,
    },
  });
};

export const runNumberTypesTest = async (
  client: Web3ApiClient,
  uri: string
) => {
  const i8Underflow = await client.query<{
    i8Method: number;
  }>({
    uri,
    query: `
    query {
      i8Method(
        first: $firstInt
        second: $secondInt
      )
    }
  `,
    variables: {
      firstInt: -129, // min i8 = -128
      secondInt: 10,
    },
  });
  expect(i8Underflow.errors).toBeTruthy();
  expect(i8Underflow.errors?.[0].message).toMatch(
    /integer overflow: value = -129; bits = 8/
  );
  expect(i8Underflow.data?.i8Method).toBeUndefined();

  const u8Overflow = await client.query<{
    u8Method: number;
  }>({
    uri,
    query: `
      query {
        u8Method(
          first: $firstInt
          second: $secondInt
        )
      }
    `,
    variables: {
      firstInt: 256, // max u8 = 255
      secondInt: 10,
    },
  });
  expect(u8Overflow.errors).toBeTruthy();
  expect(u8Overflow.errors?.[0].message).toMatch(
    /unsigned integer overflow: value = 256; bits = 8/
  );
  expect(u8Overflow.data?.u8Method).toBeUndefined();

  const i16Underflow = await client.query<{
    i16Method: number;
  }>({
    uri,
    query: `
    query {
      i16Method(
        first: $firstInt
        second: $secondInt
      )
    }
  `,
    variables: {
      firstInt: -32769, // min i16 = -32768
      secondInt: 10,
    },
  });
  expect(i16Underflow.errors).toBeTruthy();
  expect(i16Underflow.errors?.[0].message).toMatch(
    /integer overflow: value = -32769; bits = 16/
  );
  expect(i16Underflow.data?.i16Method).toBeUndefined();

  const u16Overflow = await client.query<{
    u16Method: number;
  }>({
    uri,
    query: `
      query {
        u16Method(
          first: $firstInt
          second: $secondInt
        )
      }
    `,
    variables: {
      firstInt: 65536, // max u16 = 65535
      secondInt: 10,
    },
  });
  expect(u16Overflow.errors).toBeTruthy();
  expect(u16Overflow.errors?.[0].message).toMatch(
    /unsigned integer overflow: value = 65536; bits = 16/
  );
  expect(u16Overflow.data?.u16Method).toBeUndefined();

  const i32Underflow = await client.query<{
    i32Method: number;
  }>({
    uri,
    query: `
    query {
      i32Method(
        first: $firstInt
        second: $secondInt
      )
    }
  `,
    variables: {
      firstInt: -2147483649, // min i32 = -2147483648
      secondInt: 10,
    },
  });
  expect(i32Underflow.errors).toBeTruthy();
  expect(i32Underflow.errors?.[0].message).toMatch(
    /integer overflow: value = -2147483649; bits = 32/
  );
  expect(i32Underflow.data?.i32Method).toBeUndefined();

  const u32Overflow = await client.query<{
    u32Method: number;
  }>({
    uri,
    query: `
      query {
        u32Method(
          first: $firstInt
          second: $secondInt
        )
      }
    `,
    variables: {
      firstInt: 4294967296, // max u32 = 4294967295
      secondInt: 10,
    },
  });
  expect(u32Overflow.errors).toBeTruthy();
  expect(u32Overflow.errors?.[0].message).toMatch(
    /unsigned integer overflow: value = 4294967296; bits = 32/
  );
  expect(u32Overflow.data?.u32Method).toBeUndefined();
};

export const runObjectTypesTest = async (
  client: Web3ApiClient,
  uri: string
) => {
  const method1a = await client.query<{
    method1: {
      prop: string;
      nested: {
        prop: string;
      };
    }[];
  }>({
    uri,
    query: `
      query {
        method1(
          arg1: {
            prop: "arg1 prop"
            nested: {
              prop: "arg1 nested prop"
            }
          }
        )
      }
    `,
  });

  expect(method1a.errors).toBeFalsy();
  expect(method1a.data).toBeTruthy();
  expect(method1a.data).toMatchObject({
    method1: [
      {
        prop: "arg1 prop",
        nested: {
          prop: "arg1 nested prop",
        },
      },
      {
        prop: "",
        nested: {
          prop: "",
        },
      },
    ],
  });

  const method1b = await client.query<{
    method1: {
      prop: string;
      nested: {
        prop: string;
      };
    }[];
  }>({
    uri,
    query: `
      query {
        method1(
          arg1: {
            prop: "arg1 prop"
            nested: {
              prop: "arg1 nested prop"
            }
          }
          arg2: {
            prop: "arg2 prop"
            circular: {
              prop: "arg2 circular prop"
            }
          }
        )
      }
    `,
  });

  expect(method1b.errors).toBeFalsy();
  expect(method1b.data).toBeTruthy();
  expect(method1b.data).toMatchObject({
    method1: [
      {
        prop: "arg1 prop",
        nested: {
          prop: "arg1 nested prop",
        },
      },
      {
        prop: "arg2 prop",
        nested: {
          prop: "arg2 circular prop",
        },
      },
    ],
  });

  const method2a = await client.query<{
    method2: {
      prop: string;
      nested: {
        prop: string;
      };
    } | null;
  }>({
    uri,
    query: `
      query {
        method2(
          arg: {
            prop: "arg prop"
            nested: {
              prop: "arg nested prop"
            }
          }
        )
      }
    `,
  });

  expect(method2a.errors).toBeFalsy();
  expect(method2a.data).toBeTruthy();
  expect(method2a.data).toMatchObject({
    method2: {
      prop: "arg prop",
      nested: {
        prop: "arg nested prop",
      },
    },
  });

  const method2b = await client.query<{
    method2: {
      prop: string;
      nested: {
        prop: string;
      };
    } | null;
  }>({
    uri,
    query: `
      query {
        method2(
          arg: {
            prop: "null"
            nested: {
              prop: "arg nested prop"
            }
          }
        )
      }
    `,
  });

  expect(method2b.errors).toBeFalsy();
  expect(method2b.data).toBeTruthy();
  expect(method2b.data).toMatchObject({
    method2: null,
  });

  const method3 = await client.query<{
    method3: ({
      prop: string;
      nested: {
        prop: string;
      };
    } | null)[];
  }>({
    uri,
    query: `
      query {
        method3(
          arg: {
            prop: "arg prop"
            nested: {
              prop: "arg nested prop"
            }
          }
        )
      }
    `,
  });

  expect(method3.errors).toBeFalsy();
  expect(method3.data).toBeTruthy();
  expect(method3.data).toMatchObject({
    method3: [
      null,
      {
        prop: "arg prop",
        nested: {
          prop: "arg nested prop",
        },
      },
    ],
  });

  const method5 = await client.query<{
    method5: {
      prop: string;
      nested: {
        prop: string;
      };
    };
  }>({
    uri,
    query: `
      query {
        method5(
          arg: {
            prop: [49, 50, 51, 52]
          }
        )
      }
    `,
  });

  expect(method5.errors).toBeFalsy();
  expect(method5.data).toBeTruthy();
  expect(method5.data).toMatchObject({
    method5: {
      prop: "1234",
      nested: {
        prop: "nested prop",
      },
    },
  });
};

export const runSimpleStorageTest = async (
  client: Web3ApiClient,
  api: {
    ensDomain: string,
    ipfsCid: string,
  }
) => {
    const ensUri = `ens/testnet/${api.ensDomain}`;
    const ipfsUri = `ipfs/${api.ipfsCid}`;

    const deploy = await client.query<{
      deployContract: string;
    }>({
      uri: ensUri,
      query: `
        mutation {
          deployContract(
            connection: {
              networkNameOrChainId: "testnet"
            }
          )
        }
      `,
    });

    expect(deploy.errors).toBeFalsy();
    expect(deploy.data).toBeTruthy();
    expect(deploy.data?.deployContract.indexOf("0x")).toBeGreaterThan(-1);

    if (!deploy.data) {
      return;
    }

    const address = deploy.data.deployContract;
    const set = await client.query<{
      setData: string;
    }>({
      uri: ipfsUri,
      query: `
        mutation {
          setData(
            address: "${address}"
            value: $value
            connection: {
              networkNameOrChainId: "testnet"
            }
          )
        }
      `,
      variables: {
        value: 55,
      },
    });

    expect(set.errors).toBeFalsy();
    expect(set.data).toBeTruthy();
    expect(set.data?.setData.indexOf("0x")).toBeGreaterThan(-1);

    const getWithStringType = await client.query<{
      getData: number;
      secondGetData: number;
      thirdGetData: number;
    }>({
      uri: ensUri,
      query: `
        query {
          getData(
            address: "${address}"
            connection: {
              networkNameOrChainId: "testnet"
            }
          )
          secondGetData: getData(
            address: "${address}"
            connection: {
              networkNameOrChainId: "testnet"
            }
          )
          thirdGetData: getData(
            address: "${address}"
            connection: {
              networkNameOrChainId: "testnet"
            }
          )
        }
      `,
    });

    expect(getWithStringType.errors).toBeFalsy();
    expect(getWithStringType.data).toBeTruthy();
    expect(getWithStringType.data?.getData).toBe(55);
    expect(getWithStringType.data?.secondGetData).toBe(55);
    expect(getWithStringType.data?.thirdGetData).toBe(55);

    const getWithUriType = await client.query<{
      getData: number;
      secondGetData: number;
      thirdGetData: number;
    }>({
      uri: ensUri,
      query: `
        query {
          getData(
            address: "${address}"
            connection: {
              networkNameOrChainId: "testnet"
            }
          )
          secondGetData: getData(
            address: "${address}"
            connection: {
              networkNameOrChainId: "testnet"
            }
          )
          thirdGetData: getData(
            address: "${address}"
            connection: {
              networkNameOrChainId: "testnet"
            }
          )
        }
      `,
    });

    expect(getWithUriType.errors).toBeFalsy();
    expect(getWithUriType.data).toBeTruthy();
    expect(getWithUriType.data?.getData).toBe(55);
    expect(getWithUriType.data?.secondGetData).toBe(55);
    expect(getWithUriType.data?.thirdGetData).toBe(55);
};
