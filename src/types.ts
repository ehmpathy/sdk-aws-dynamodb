import type { SdkAwsDynamodb } from './dynamodb';

export type LogMethod = (message: string, metadata: any) => void;

/**
 * context type for simple-dynamodb-client operations.
 *
 * @example
 * ```ts
 * import * as sdkDynamodbClient from '@aws-sdk/client-dynamodb';
 * import * as sdkDynamodbDocumentClient from '@aws-sdk/lib-dynamodb';
 * import { NodeHttpHandler } from '@smithy/node-http-handler';
 *
 * const context: SimpleDynamodbContext = {
 *   aws: {
 *     dynamodb: {
 *       sdk: {
 *         ...sdkDynamodbClient,
 *         ...sdkDynamodbDocumentClient,
 *         NodeHttpHandler,
 *       },
 *     },
 *   },
 * };
 * ```
 */
export interface SimpleDynamodbContext {
  aws: {
    dynamodb: {
      sdk: SdkAwsDynamodb;
    };
  };
}

/**
 * An array of strings containing the list of attributes to retrieve from the table.
 *
 * For example, const `name,age,height` will return objects with the shape `{ name, age, height }`
 *
 * Amazon defines this property as the "ProjectionExpression" in their docs:
 * > A string that identifies one or more attributes to retrieve from the table. These attributes can include scalars, sets, or elements of a JSON document. The attributes in the expression must be separated by commas. If no attribute names are specified, then all attributes will be returned. If any of the requested attributes are not found, they will not appear in the result. For more information, see Accessing Item Attributes in the Amazon DynamoDB Developer Guide.
 *
 * The `query` method normalizes both these keys and the query inputs with a `#` to ensure that no collisions occur - abstracting that step away from the user completely.
 */
export type AttributesToRetrieveInQuery = string[];
