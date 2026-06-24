import type {
  QueryCommandInput,
  QueryCommandOutput,
} from '@aws-sdk/lib-dynamodb';

import { dynamodb } from './dynamodb';
import type { AttributesToRetrieveInQuery, LogMethod } from './types';

/**
 * A subset of the QueryCommandInput interface.
 *
 * This set of keys removes the "legacy" keys, the keys that are already defined for you by this dao (e.g., TableName), and keys that may lead to shooting yourself in the foot (e.g., FilterExpression)
 */
export interface SimpleDynamodbQueryConditions {
  /**
   * The name of an index to query. This index can be any local secondary index or global secondary index on the table.
   */
  IndexName?: QueryCommandInput['IndexName'];
  /**
   * The maximum number of items to evaluate (not necessarily the number of matching items). If DynamoDB processes the number of items up to the limit while processing the results, it stops the operation and returns the matching values up to that point, and a key in LastEvaluatedKey to apply in a subsequent operation, so that you can pick up where you left off. Also, if the processed data set size exceeds 1 MB before DynamoDB reaches this limit, it stops the operation and returns the matching values up to the limit, and a key in LastEvaluatedKey to apply in a subsequent operation to continue the operation. For more information, see Query and Scan in the Amazon DynamoDB Developer Guide.
   */
  Limit?: QueryCommandInput['Limit'];
  /**
   * Determines the read consistency model: If set to true, then the operation uses strongly consistent reads; otherwise, the operation uses eventually consistent reads. Strongly consistent reads are not supported on global secondary indexes. If you query a global secondary index with ConsistentRead set to true, you will receive a ValidationException.
   */
  ConsistentRead?: QueryCommandInput['ConsistentRead'];
  /**
   * Specifies the order for index traversal: If true (default), the traversal is performed in ascending order; if false, the traversal is performed in descending order.  Items with the same partition key value are stored in sorted order by sort key. If the sort key data type is Number, the results are stored in numeric order. For type String, the results are stored in order of UTF-8 bytes. For type Binary, DynamoDB treats each byte of the binary data as unsigned. If ScanIndexForward is true, DynamoDB returns the results in the order in which they are stored (by sort key value). This is the default behavior. If ScanIndexForward is false, DynamoDB reads the results in reverse order by sort key value, and then returns the results to the client.
   */
  ScanIndexForward?: QueryCommandInput['ScanIndexForward'];
  /**
   * The primary key of the first item that this operation will evaluate. Use the value that was returned for LastEvaluatedKey in the previous operation. The data type for ExclusiveStartKey must be String, Number or Binary. No set data types are allowed.
   */
  ExclusiveStartKey?: QueryCommandInput['ExclusiveStartKey'];
  /**
   * The condition that specifies the key value(s) for items to be retrieved by the Query action. The condition must perform an equality test on a single partition key value. The condition can optionally perform one of several comparison tests on a single sort key value. This allows Query to retrieve one item with a given partition key value and sort key value, or several items that have the same partition key value but different sort key values. The partition key equality test is required, and must be specified in the following format:  partitionKeyName = :partitionkeyval  If you also want to provide a condition for the sort key, it must be combined using AND with the condition for the sort key. Following is an example, using the = comparison operator for the sort key:  partitionKeyName = :partitionkeyval AND sortKeyName = :sortkeyval  Valid comparisons for the sort key condition are as follows:    sortKeyName = :sortkeyval - true if the sort key value is equal to :sortkeyval.    sortKeyName &lt; :sortkeyval - true if the sort key value is less than :sortkeyval.    sortKeyName &lt;= :sortkeyval - true if the sort key value is less than or equal to :sortkeyval.    sortKeyName &gt; :sortkeyval - true if the sort key value is greater than :sortkeyval.    sortKeyName &gt;=  :sortkeyval - true if the sort key value is greater than or equal to :sortkeyval.    sortKeyName BETWEEN :sortkeyval1 AND :sortkeyval2 - true if the sort key value is greater than or equal to :sortkeyval1, and less than or equal to :sortkeyval2.    begins_with ( sortKeyName, :sortkeyval ) - true if the sort key value begins with a particular operand. (You cannot use this function with a sort key that is of type Number.) Note that the function name begins_with is case-sensitive.   Use the ExpressionAttributeValues parameter to replace tokens such as :partitionval and :sortval with actual values at runtime. You can optionally use the ExpressionAttributeNames parameter to replace the names of the partition key and sort key with placeholder tokens. This option might be necessary if an attribute name conflicts with a DynamoDB reserved word. For example, the following KeyConditionExpression parameter causes an error because Size is a reserved word:    Size = :myval    To work around this, define a placeholder (such a #S) to represent the attribute name Size. KeyConditionExpression then is as follows:    #S = :myval    For a list of reserved words, see Reserved Words in the Amazon DynamoDB Developer Guide. For more information on ExpressionAttributeNames and ExpressionAttributeValues, see Using Placeholders for Attribute Names and Values in the Amazon DynamoDB Developer Guide.
   */
  KeyConditionExpression?: QueryCommandInput['KeyConditionExpression'];
  /**
   * One or more values that can be substituted in an expression. Use the : (colon) character in an expression to dereference an attribute value. For example, suppose that you wanted to check whether the value of the ProductStatus attribute was one of the following:   Available | Backordered | Discontinued  You would first need to specify ExpressionAttributeValues as follows:  { ":avail": "Available", ":back": "Backordered", ":disc": "Discontinued" }  You could then use these values in an expression, such as this:  ProductStatus IN (:avail, :back, :disc)  For more information on expression attribute values, see Specifying Conditions in the Amazon DynamoDB Developer Guide.
   */
  ExpressionAttributeValues?: QueryCommandInput['ExpressionAttributeValues'];
}

export const query = async ({
  tableName,
  logDebug,
  attributesToRetrieveInQuery,
  queryConditions,
}: {
  tableName: string;
  logDebug: LogMethod;
  attributesToRetrieveInQuery: AttributesToRetrieveInQuery;
  queryConditions: SimpleDynamodbQueryConditions;
}): Promise<Record<string, any>[]> => {
  // 0. prefix all "attributesToRetrieveInQueries" with "#" to ensure no collisions exist and build up name mapping map
  const prefixedAttributesToRetrieveInQueries = attributesToRetrieveInQuery
    .map((attr) => `#${attr}`)
    .join(',');
  const attributesToPrefixedAttributesMap = attributesToRetrieveInQuery.reduce(
    (map, thisAttr) => ({ ...map, [`#${thisAttr}`]: thisAttr }),
    {} as { [index: string]: string },
  );

  // define the stop condition for the loop
  const results: QueryCommandOutput[] = [];
  const canStop = ({
    lastEvaluatedKey,
  }: {
    lastEvaluatedKey?: QueryCommandOutput['LastEvaluatedKey'];
  }) => {
    // determine whether there is more to evaluate
    const hasMoreToEvaluate = !!lastEvaluatedKey; // if there is a last evaluated key, we could continue

    // when the limit is defined, we can stop if we've reached the limit
    if (queryConditions.Limit) {
      const itemsAll = results.flatMap((result) => result.Items ?? []);
      if (itemsAll.length >= queryConditions.Limit) return { canStopNow: true }; // if we've reached the limit, we can stop here
    }

    // if there is no more to evaluate, we can stop
    if (!hasMoreToEvaluate) return { canStopNow: true };

    // otherwise, we must keep going
    return { canStopNow: false };
  };

  // begin the loop to collect all items
  logDebug(`${tableName}.query.input`, {
    tableName,
    conditions: queryConditions,
  });
  let lastEvaluatedKey: QueryCommandOutput['LastEvaluatedKey'] =
    queryConditions.ExclusiveStartKey; // the last evaluated key should be considered the exclusive start key
  while (true) {
    // execute the query
    const result = await dynamodb.query({
      input: {
        TableName: tableName,
        ...queryConditions, // user defined conditions
        ExclusiveStartKey: lastEvaluatedKey, // the last evaluated key from the previous iteration
        ProjectionExpression: prefixedAttributesToRetrieveInQueries, // plus the prefixed projection expression
        ExpressionAttributeNames: attributesToPrefixedAttributesMap, // plus the map to ensure no reserved keyword collisions from dynamo
      },
    });

    // update the last evaluated key, append this result, and evaluate whether we can now stop
    lastEvaluatedKey = result.LastEvaluatedKey;
    results.push(result);
    const { canStopNow } = canStop({ lastEvaluatedKey });

    // log the progress
    logDebug(`${tableName}.query.progress`, {
      success: true,
      tableName,
      conditions: queryConditions,
      stats: {
        itemCount: result.Count,
        scannedCount: result.ScannedCount, // this will always be equal to item count, as we don't allow filtering as an input
        consumedCapacity: result.ConsumedCapacity,
        lastEvaluatedKey: result.LastEvaluatedKey,
      },
      canStopNow,
    });

    // break out of the loop if we can stop now
    if (canStopNow) break;
  }

  // extract the items from the results
  const itemsAll = results.flatMap((result) => result.Items ?? []);

  // log that we've completed the queries
  logDebug(`${tableName}.query.output`, {
    success: true,
    tableName,
    conditions: queryConditions,
    iterations: results.length,
    items: itemsAll.length,
    stats: results.map((result) => ({
      itemCount: result.Count,
      scannedCount: result.ScannedCount, // this will always be equal to item count, as we don't allow filtering as an input
      consumedCapacity: result.ConsumedCapacity,
      lastEvaluatedKey: result.LastEvaluatedKey,
    })),
  });

  // return the items
  return itemsAll;
};
