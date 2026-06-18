import type { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import type {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import type { NodeHttpHandler } from '@smithy/node-http-handler';

/**
 * SDK type for AWS DynamoDB client.
 *
 * consumers provide this SDK via context.aws.dynamodb.sdk
 */
export type SdkAwsDynamodbClient = {
  DynamoDBClient: typeof DynamoDBClient;
  NodeHttpHandler: typeof NodeHttpHandler;
};

/**
 * SDK type for AWS DynamoDB document client (lib-dynamodb).
 *
 * consumers provide this SDK via context.aws.dynamodb.sdk
 */
export type SdkAwsDynamodbDocumentClient = {
  DynamoDBDocumentClient: typeof DynamoDBDocumentClient;
  GetCommand: typeof GetCommand;
  PutCommand: typeof PutCommand;
  QueryCommand: typeof QueryCommand;
  DeleteCommand: typeof DeleteCommand;
  TransactWriteCommand: typeof TransactWriteCommand;
};

/**
 * combined SDK type for all DynamoDB operations.
 *
 * consumers provide this SDK via context.aws.dynamodb.sdk
 *
 * @example
 * ```ts
 * import * as sdkDynamodbClient from '@aws-sdk/client-dynamodb';
 * import * as sdkDynamodbDocumentClient from '@aws-sdk/lib-dynamodb';
 * import { NodeHttpHandler } from '@smithy/node-http-handler';
 *
 * const sdk: SdkAwsDynamodb = {
 *   ...sdkDynamodbClient,
 *   ...sdkDynamodbDocumentClient,
 *   NodeHttpHandler,
 * };
 *
 * simpleDynamodbClient.get(
 *   { tableName, key, ... },
 *   { aws: { dynamodb: { sdk } } },
 * );
 * ```
 */
export type SdkAwsDynamodb = SdkAwsDynamodbClient &
  SdkAwsDynamodbDocumentClient;
