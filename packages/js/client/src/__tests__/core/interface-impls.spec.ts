import {
  coreInterfaceUris,
  createWeb3ApiClient,
  getDefaultClientConfig,
  Uri,
  PluginModule,
  Web3ApiClient,
  Web3ApiClientConfig,
} from "../..";

jest.setTimeout(200000);

describe("interface-impls", () => {
  const getClient = async (config?: Partial<Web3ApiClientConfig>) => {
    const client = await createWeb3ApiClient(
      {},
      config
    );

    return client;
  };
  it("should register interface implementations successfully", () => {
    const interfaceUri = "w3://ens/some-interface1.eth";
    const implementation1Uri = "w3://ens/some-implementation1.eth";
    const implementation2Uri = "w3://ens/some-implementation2.eth";

    const client = new Web3ApiClient({
      interfaces: [
        {
          interface: interfaceUri,
          implementations: [implementation1Uri, implementation2Uri],
        },
      ],
    });

    const interfaces = client.getInterfaces();

    const defaultClientConfig = getDefaultClientConfig();

    expect(interfaces).toEqual(
      [
        {
          interface: new Uri(interfaceUri),
          implementations: [
            new Uri(implementation1Uri),
            new Uri(implementation2Uri),
          ],
        },
      ].concat(defaultClientConfig.interfaces ?? [])
    );

    const implementations = client.getImplementations(interfaceUri);

    expect(implementations).toEqual([implementation1Uri, implementation2Uri]);
  });

  it("should get all implementations of interface", async () => {
    const interface1Uri = "w3://ens/some-interface1.eth";
    const interface2Uri = "w3://ens/some-interface2.eth";
    const interface3Uri = "w3://ens/some-interface3.eth";

    const implementation1Uri = "w3://ens/some-implementation.eth";
    const implementation2Uri = "w3://ens/some-implementation2.eth";
    const implementation3Uri = "w3://ens/some-implementation3.eth";
    const implementation4Uri = "w3://ens/some-implementation4.eth";

    const client = await getClient({
      redirects: [
        {
          from: interface1Uri,
          to: interface2Uri,
        },
        {
          from: implementation1Uri,
          to: implementation2Uri,
        },
        {
          from: implementation2Uri,
          to: implementation3Uri,
        },
      ],
      plugins: [
        {
          uri: implementation4Uri,
          plugin: {
            factory: () => ({} as PluginModule),
            manifest: {
              schema: "",
              implements: [],
            },
          },
        },
      ],
      interfaces: [
        {
          interface: interface1Uri,
          implementations: [implementation1Uri, implementation2Uri],
        },
        {
          interface: interface2Uri,
          implementations: [implementation3Uri],
        },
        {
          interface: interface3Uri,
          implementations: [implementation3Uri, implementation4Uri],
        },
      ],
    });

    const implementations1 = client.getImplementations(interface1Uri, {
      applyRedirects: true,
    });
    const implementations2 = client.getImplementations(interface2Uri, {
      applyRedirects: true,
    });
    const implementations3 = client.getImplementations(interface3Uri, {
      applyRedirects: true,
    });

    expect(implementations1).toEqual([
      implementation1Uri,
      implementation2Uri,
      implementation3Uri,
    ]);

    expect(implementations2).toEqual([
      implementation1Uri,
      implementation2Uri,
      implementation3Uri,
    ]);

    expect(implementations3).toEqual([implementation3Uri, implementation4Uri]);
  });

  it("should not register plugins with an interface uri (without default plugins)", () => {
    const interface1Uri = "w3://ens/some-interface1.eth";
    const interface2Uri = "w3://ens/some-interface2.eth";
    const interface3Uri = "w3://ens/some-interface3.eth";

    const implementationUri = "w3://ens/some-implementation.eth";

    expect(() => {
      new Web3ApiClient({
        plugins: [
          {
            uri: interface1Uri,
            plugin: {
              factory: () => ({} as PluginModule),
              manifest: {
                schema: "",
                implements: [],
              },
            },
          },
          {
            uri: interface2Uri,
            plugin: {
              factory: () => ({} as PluginModule),
              manifest: {
                schema: "",
                implements: [],
              },
            },
          },
        ],
        interfaces: [
          {
            interface: interface1Uri,
            implementations: [implementationUri],
          },
          {
            interface: interface2Uri,
            implementations: [implementationUri],
          },
          {
            interface: interface3Uri,
            implementations: [implementationUri],
          },
        ],
      });
    }).toThrow(
      `Plugins can't use interfaces for their URI. Invalid plugins: ${[
        interface1Uri,
        interface2Uri,
      ]}`
    );
  });

  it("should not register plugins with an interface uri (with default plugins)", async () => {
    const interfaceUri = "w3://ens/some-interface.eth";

    const implementationUri = "w3://ens/some-implementation.eth";

    await expect(async () => {
      await getClient({
        plugins: [
          {
            uri: interfaceUri,
            plugin: {
              factory: () => ({} as PluginModule),
              manifest: {
                schema: "",
                implements: [],
              },
            },
          },
        ],
        interfaces: [
          {
            interface: interfaceUri,
            implementations: [implementationUri],
          },
        ],
      });
    }).rejects.toThrow(
      `Plugins can't use interfaces for their URI. Invalid plugins: ${[
        interfaceUri,
      ]}`
    );
  });

  it("should merge user-defined interface implementations with each other", async () => {
    const interfaceUri = "w3://ens/interface.eth";
    const implementationUri1 = "w3://ens/implementation1.eth";
    const implementationUri2 = "w3://ens/implementation2.eth";

    const client = new Web3ApiClient({
      interfaces: [
        {
          interface: interfaceUri,
          implementations: [implementationUri1],
        },
        {
          interface: interfaceUri,
          implementations: [implementationUri2],
        },
      ],
    });

    const interfaces = client
      .getInterfaces()
      .filter((x) => x.interface.uri === interfaceUri);
    expect(interfaces.length).toEqual(1);

    const implementationUris = interfaces[0].implementations;

    expect(implementationUris).toEqual([
      new Uri(implementationUri1),
      new Uri(implementationUri2),
    ]);
  });

  it("should merge user-defined interface implementations with defaults", async () => {
    const interfaceUri = coreInterfaceUris.uriResolver.uri;
    const implementationUri1 = "w3://ens/implementation1.eth";
    const implementationUri2 = "w3://ens/implementation2.eth";

    const client = new Web3ApiClient({
      interfaces: [
        {
          interface: interfaceUri,
          implementations: [implementationUri1],
        },
        {
          interface: interfaceUri,
          implementations: [implementationUri2],
        },
      ],
    });

    const interfaces = client
      .getInterfaces()
      .filter((x) => x.interface.uri === interfaceUri);
    expect(interfaces.length).toEqual(1);

    const implementationUris = interfaces[0].implementations;

    expect(implementationUris).toEqual([
      new Uri(implementationUri1),
      new Uri(implementationUri2),
      ...getDefaultClientConfig().interfaces.find(
        (x) => x.interface.uri === interfaceUri
      )!.implementations,
    ]);
  });

  test("get implementations - do not return plugins that are not explicitly registered", () => {
    const interfaceUri = "w3://ens/some-interface.eth";

    const implementation1Uri = "w3://ens/some-implementation1.eth";
    const implementation2Uri = "w3://ens/some-implementation2.eth";

    const client = new Web3ApiClient({
      plugins: [
        {
          uri: implementation1Uri,
          plugin: {
            factory: () => ({} as PluginModule),
            manifest: {
              schema: "",
              implements: [new Uri(interfaceUri)],
            },
          },
        },
      ],
      interfaces: [
        {
          interface: interfaceUri,
          implementations: [implementation2Uri],
        },
      ],
    });

    const getImplementationsResult = client.getImplementations(
      new Uri(interfaceUri),
      { applyRedirects: true }
    );

    expect(getImplementationsResult).toEqual([new Uri(implementation2Uri)]);
  });

  test("get implementations - return implementations for plugins which don't have interface stated in manifest", () => {
    const interfaceUri = "w3://ens/some-interface.eth";

    const implementation1Uri = "w3://ens/some-implementation1.eth";
    const implementation2Uri = "w3://ens/some-implementation2.eth";

    const client = new Web3ApiClient({
      plugins: [
        {
          uri: implementation1Uri,
          plugin: {
            factory: () => ({} as PluginModule),
            manifest: {
              schema: "",
              implements: [],
            },
          },
        },
      ],
      interfaces: [
        {
          interface: interfaceUri,
          implementations: [implementation1Uri, implementation2Uri],
        },
      ],
    });

    const getImplementationsResult = client.getImplementations(
      new Uri(interfaceUri),
      { applyRedirects: true }
    );

    expect(getImplementationsResult).toEqual([
      new Uri(implementation1Uri),
      new Uri(implementation2Uri),
    ]);
  });

  test("getImplementations - pass string or Uri", async () => {
    const oldInterfaceUri = "ens/old.eth";
    const newInterfaceUri = "ens/new.eth";

    const implementation1Uri = "w3://ens/some-implementation1.eth";
    const implementation2Uri = "w3://ens/some-implementation2.eth";

    const client = new Web3ApiClient({
      redirects: [
        {
          from: oldInterfaceUri,
          to: newInterfaceUri,
        },
      ],
      interfaces: [
        {
          interface: oldInterfaceUri,
          implementations: [implementation1Uri],
        },
        {
          interface: newInterfaceUri,
          implementations: [implementation2Uri],
        },
      ],
    });

    let result = client.getImplementations(oldInterfaceUri);
    expect(result).toEqual([implementation1Uri]);

    result = client.getImplementations(oldInterfaceUri, {
      applyRedirects: true,
    });
    expect(result).toEqual([implementation1Uri, implementation2Uri]);

    let result2 = client.getImplementations(new Uri(oldInterfaceUri));
    expect(result2).toEqual([new Uri(implementation1Uri)]);

    result2 = client.getImplementations(new Uri(oldInterfaceUri), {
      applyRedirects: true,
    });
    expect(result2).toEqual([
      new Uri(implementation1Uri),
      new Uri(implementation2Uri),
    ]);
  });
});
