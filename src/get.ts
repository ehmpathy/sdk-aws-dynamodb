import { dynamodb } from './dynamodb';
import type {
  AttributesToRetrieveInQuery,
  LogMethod,
  SimpleDynamodbContext,
} from './types';

/**
 * A subset of the DynamoDB.DocumentClient.GetItemInput interface.
 *
 * This set of keys removes the "legacy" keys, the keys that are already defined for you by this dao (e.g., TableName), and keys that may lead to issues (e.g., FilterExpression)
 */
export interface SimpleDynamodbGetConditions {
  /**
   * Determines the read consistency model: If set to true, then the operation uses strongly consistent reads; otherwise, the operation uses eventually consistent reads. Strongly consistent reads are not supported on global secondary indexes. If you query a global secondary index with ConsistentRead set to true, you will receive a ValidationException.
   */
  ConsistentRead?: boolean;
}

export const get = async (
  {
    tableName,
    logDebug,
    attributesToRetrieveInQuery,
    key,
    getConditions,
  }: {
    tableName: string;
    logDebug: LogMethod;
    attributesToRetrieveInQuery: AttributesToRetrieveInQuery;
    key: Record<string, unknown>;
    getConditions?: SimpleDynamodbGetConditions;
  },
  context: SimpleDynamodbContext,
): Promise<Record<string, any> | null> => {
  // 0. prefix all "attributesToRetrieveInQueries" with "#" to ensure no collisions exist and build up name map
  const prefixedAttributesToRetrieveInQueries = attributesToRetrieveInQuery
    .map((attr) => `#${attr}`)
    .join(',');
  const attributesToPrefixedAttributesMap = attributesToRetrieveInQuery.reduce(
    (map, thisAttr) => ({ ...map, [`#${thisAttr}`]: thisAttr }),
    {} as { [index: string]: string },
  );

  // 1. execute the query, log params and output
  logDebug(`${tableName}.get.input`, {
    tableName,
    key,
    conditions: getConditions,
  });
  const result = await dynamodb.get(
    {
      input: {
        TableName: tableName,
        ...getConditions, // user defined conditions
        Key: key,
        ProjectionExpression: prefixedAttributesToRetrieveInQueries, // plus the prefixed projection expression
        ExpressionAttributeNames: attributesToPrefixedAttributesMap, // plus the map to ensure no reserved keyword collisions from dynamo
      },
    },
    context,
  );
  logDebug(`${tableName}.get.output`, {
    success: true,
    tableName,
    key,
    conditions: getConditions,
    stats: {
      itemCount: result.Item ? 1 : 0,
      consumedCapacity: result.ConsumedCapacity,
    },
  });

  // 2. cast from database objects into service layer objects
  const databaseObject = result.Item ?? null;
  return databaseObject;
};
