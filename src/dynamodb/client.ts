import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import https from 'https';

// support specifying a custom dynamodb endpoint
const CUSTOM_DYNAMO_DB_ENDPOINT =
  process.env.USE_CUSTOM_DYNAMODB_ENDPOINT || undefined;

// define an http agent which keeps the connections alive per aws example: https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/node-reusing-connections.html
const agent = new https.Agent({
  keepAlive: true,
});

// cache the client globally in memory; client reuse is a best practice
let cachedDocumentClient: DynamoDBDocumentClient | null = null;

/**
 * fetches a document client with best practices:
 * - share the client for all requests made in the same execution context
 *   - i.e., the client is cached in memory after first creation
 *   - https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.Lambda.BestPracticesWithDynamoDB.html
 * - reuse tcp connections
 *   - https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/node-reusing-connections.html
 *   - > By default, the default Node.js HTTP/HTTPS agent creates a new TCP connection for every new request. To avoid the cost of establishing a new connection, you can reuse an existing connection.
 *   - > For short-lived operations, such as DynamoDB queries, the latency overhead of setting up a TCP connection might be greater than the operation itself. Additionally, since DynamoDB encryption at rest is integrated with AWS KMS, you may experience latencies from the database having to re-establish new AWS KMS cache entries for each operation.
 *   - we've seen duration drop from 40ms to 5ms just from this change on high volume queries/gets
 */
export const getDocumentClient = (): DynamoDBDocumentClient => {
  if (cachedDocumentClient) return cachedDocumentClient;

  // create the base dynamodb client
  const useHttpsAgent =
    !CUSTOM_DYNAMO_DB_ENDPOINT ||
    !CUSTOM_DYNAMO_DB_ENDPOINT.startsWith('http://');
  const dynamodbClient = new DynamoDBClient({
    requestHandler: useHttpsAgent
      ? new NodeHttpHandler({ httpsAgent: agent })
      : undefined,
    endpoint: CUSTOM_DYNAMO_DB_ENDPOINT,
  });

  // wrap with document client for simplified document operations
  const documentClient = DynamoDBDocumentClient.from(dynamodbClient, {
    marshallOptions: {
      removeUndefinedValues: true,
    },
  });

  cachedDocumentClient = documentClient;
  return documentClient;
};
