const autocannon = require('autocannon');
const { report } = require('autocannon');

const write = {
    "operationName": "UpdateCategory",
    "variables": {
        "nodeId": "WyJjYXRlZ29yaWVzIiwzXQ==",
        "description": "hoaddxxuu"
    },
    "query": "mutation UpdateCategory($nodeId: ID!, $description: String!) {\n  updateCategory(\n    input: {nodeId: $nodeId, categoryPatch: {description: $description}}\n  ) {\n    category {\n      nodeId\n      __typename\n    }\n    __typename\n  }\n}"
};

const read = {
    "operationName": "GetCategories",
    "variables": {},
    "query": "query GetCategories {\n  allCategories {\n    nodes {\n      nodeId\n      id\n      description\n      __typename\n    }\n    __typename\n  }\n}"
}

const headers = {
  'Content-Type': 'application/json',
  // If your GraphQL server requires authentication, add your auth headers here
  // 'Authorization': 'Bearer YOUR_TOKEN',
};

autocannon({
  url: 'http://localhost:8090/graphql',
  method: 'POST',
  headers: headers,
  body: JSON.stringify(read),
  connections: 100, // The number of simultaneous connections
  duration: 10, // The duration of the test in seconds
}, (err, results) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  console.log('Finished benchmarking');
  console.log(results)
  // If you want to print the full report, uncomment the line below
  // console.log(report(results, {
  //   outputStream: process.stdout,
  //   renderProgressBar: true,
  //   renderLatencyTable: true,
  //   renderResultsTable: true
  // }));
});