// eslint-disable-next-line import/no-extraneous-dependencies
import React from "react";
import { PolywrapClient, Web3ApiClientConfig } from "@polywrap/client-js";

type ClientContext = React.Context<PolywrapClient>

interface Web3ApiProviderState {
  ClientContext: ClientContext;
  client?: PolywrapClient;
}

interface Web3ApiProviderMap {
  [name: string]: Web3ApiProviderState;
}

export const PROVIDERS: Web3ApiProviderMap = {};

interface Web3ApiProviderProps extends Partial<Web3ApiClientConfig> { }

export type Web3ApiProviderFC = React.FC<Web3ApiProviderProps>;

export function createWeb3ApiProvider(
  name: string
): Web3ApiProviderFC {

  // Make sure the provider isn't already set
  if (!!PROVIDERS[name]) {
    throw new Error(`A Web3Api provider already exists with the name "${name}"`);
  }

  // Reserve the provider slot
  PROVIDERS[name] = {
    ClientContext: React.createContext({} as PolywrapClient)
  };

  return ({ envs, redirects, plugins, interfaces, children }) => {

    const [clientCreated, setClientCreated] = React.useState(false);

    React.useEffect(() => {

      // If the client has already been set for this provider
      if (PROVIDERS[name].client) {
        throw Error( 
          `Duplicate Web3ApiProvider detected. Please use "createWeb3ApiProvider("provider-name")".`
        );
      }

      // Instantiate the client
      PROVIDERS[name].client = new PolywrapClient({ redirects, plugins, interfaces, envs });

      setClientCreated(true);

      // Unset the client in the global state when
      // this provider is unmounted
      return function cleanup() {
        PROVIDERS[name].client = undefined;
      }
    });

    // Get the provider's context
    const ClientProvider = PROVIDERS[name].ClientContext.Provider;

    return clientCreated ? (
      <ClientProvider value={PROVIDERS[name].client as PolywrapClient}>
        {children}
      </ClientProvider>
    ) : null;
  };
}

export const PRIMARY_PROVIDER = "PRIMARY_PROVIDER";

export const Web3ApiProvider = createWeb3ApiProvider(PRIMARY_PROVIDER);
