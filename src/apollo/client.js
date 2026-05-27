import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  split,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";
import { getMainDefinition } from "@apollo/client/utilities";
import { getStoredAccessToken } from "../utils/auth";

const httpUri = import.meta.env.VITE_GRAPHQL_HTTP_URL || "http://localhost:4100/graphql";
const wsUri = import.meta.env.VITE_GRAPHQL_WS_URL || "ws://localhost:4100/graphql";
const httpLink = new HttpLink({ uri: httpUri });

const authLink = setContext((_, { headers }) => {
  const token = getStoredAccessToken() || import.meta.env.VITE_GRAPHQL_TOKEN || "";
  return {
    headers: {
      ...headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  };
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: wsUri,
    lazy: true,
    retryAttempts: 20,
    connectionParams: () => {
      const token = getStoredAccessToken() || import.meta.env.VITE_GRAPHQL_TOKEN || "";
      return token ? { authorization: `Bearer ${token}` } : {};
    },
  })
);

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLink,
  authLink.concat(httpLink)
);

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
  connectToDevTools: true,
});
