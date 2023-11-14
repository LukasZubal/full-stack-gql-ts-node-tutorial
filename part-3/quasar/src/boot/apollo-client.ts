import { boot } from 'quasar/wrappers';
import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client/core';
import { getMainDefinition } from '@apollo/client/utilities';
import { provideApolloClient } from '@vue/apollo-composable';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';

// declare module '@vue/runtime-core' {
//   interface ComponentCustomProperties {
//     $apollo: ApolloClient<NormalizedCacheObject>;
//   }
// }
console.log('bb')

const wsLink = new GraphQLWsLink(
  createClient({
    url: 'ws://localhost:8090/graphql',
  })
);

// HTTP connection to the API
const httpLink = new HttpLink({
  // You should use an absolute URL here
  uri: 'http://localhost:8090/graphql',
});

// using the ability to split links, you can send data to each link
// depending on what kind of operation is being sent
const link = split(
  // split based on operation type
  ({ query }) => {
    const definition = getMainDefinition(query)
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    )
  },
  wsLink,
  httpLink
)

// Cache implementation
const cache = new InMemoryCache();

// Create the apollo client with cache implementation.
const apolloClient = new ApolloClient({
  link,
  cache,
});

export default boot(() => {
  // app.config.globalProperties.$apollo = apolloClient;
  console.log('boot')
  provideApolloClient(apolloClient);
});

export { apolloClient };
