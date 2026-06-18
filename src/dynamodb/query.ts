import { getDocumentClient } from './client';
import type { SdkAwsDynamodb } from './SdkAwsDynamodb';

export class DynamodbQueryError extends Error {
  constructor({
    input,
    errorMessage,
  }: {
    input: RelevantQueryInput;
    errorMessage: string;
  }) {
    super(
      `
Encountered error when trying to execute a dynamodb query against table '${
        input.TableName
      }': ${errorMessage}

Input:
${JSON.stringify(input, null, 2)}
    `.trim(),
    );
  }
}

export interface RelevantQueryInput {
  /**
   * The name of the table.
   */
  TableName: string;
  /**
   * The name of an index to query. This index can be any local secondary index or global secondary index on the table.
   */
  IndexName?: string;
  /**
   * The maximum number of items to evaluate (not necessarily the number of items returned). If DynamoDB processes the number of items up to the limit while processing the results, it stops the operation and returns the results up to that point, and a key in LastEvaluatedKey to apply in a subsequent operation, so that you can pick up where you left off. Also, if the processed data set size exceeds 1 MB before DynamoDB reaches this limit, it stops the operation and returns the results up to the limit, and a key in LastEvaluatedKey to apply in a subsequent operation to continue the operation. For more information, see Query and Scan in the Amazon DynamoDB Developer Guide.
   */
  Limit?: number;
  /**
   * Determines the read consistency model: If set to true, then the operation uses strongly consistent reads; otherwise, the operation uses eventually consistent reads. Strongly consistent reads are not supported on global secondary indexes. If you query a global secondary index with ConsistentRead set to true, you will receive a ValidationException.
   */
  ConsistentRead?: boolean;
  /**
   * Specifies the order for index traversal: If true (default), the traversal is performed in ascending order; if false, the traversal is performed in descending order. Items with the same partition key value are stored in sorted order by sort key. If the sort key data type is Number, the results are stored in numeric order. For type String, the results are stored in order of UTF-8 bytes. For type Binary, DynamoDB treats each byte of the binary data as unsigned. If ScanIndexForward is true, DynamoDB returns the results in the order in which they are stored (by sort key value). This is the default behavior. If ScanIndexForward is false, DynamoDB reads the results in reverse order by sort key value, and then returns the results to the client.
   */
  ScanIndexForward?: boolean;
  /**
   * The primary key of the first item that this operation will evaluate. Use the value that was returned for LastEvaluatedKey in the previous operation. The data type for ExclusiveStartKey must be String, Number or Binary. No set data types are allowed.
   */
  ExclusiveStartKey?: Record<string, unknown>;
  /**
   * A string that identifies one or more attributes to retrieve from the table. These attributes can include scalars, sets, or elements of a JSON document. The attributes in the expression must be separated by commas. If no attribute names are specified, then all attributes will be returned. If any of the requested attributes are not found, they will not appear in the result. For more information, see Item Attributes in the Amazon DynamoDB Developer Guide.
   */
  ProjectionExpression?: string;
  /**
   * A string that contains conditions that DynamoDB applies after the Query operation, but before the data is returned to you. Items that do not satisfy the FilterExpression criteria are not returned. A FilterExpression does not allow key attributes. You cannot define a filter expression based on a partition key or a sort key. A FilterExpression is applied after the items have already been read; the process of this does not consume any additional read capacity units. For more information, see Filter Expressions in the Amazon DynamoDB Developer Guide.
   */
  FilterExpression?: string;
  /**
   * The condition that specifies the key value(s) for items to be retrieved by the Query action. The condition must perform an equality test on a single partition key value. The condition can optionally perform one of several comparison tests on a single sort key value. This allows Query to retrieve one item with a given partition key value and sort key value, or several items that have the same partition key value but different sort key values. The partition key equality test is required, and must be specified in the format: partitionKeyName = :partitionkeyval If you also want to provide a condition for the sort key, it must be combined with AND with the condition for the sort key. For example: partitionKeyName = :partitionkeyval AND sortKeyName = :sortkeyval Valid comparisons for the sort key condition are as follows: sortKeyName = :sortkeyval - true if the sort key value is equal to :sortkeyval. sortKeyName < :sortkeyval - true if the sort key value is less than :sortkeyval. sortKeyName <= :sortkeyval - true if the sort key value is less than or equal to :sortkeyval. sortKeyName > :sortkeyval - true if the sort key value is greater than :sortkeyval. sortKeyName >= :sortkeyval - true if the sort key value is greater than or equal to :sortkeyval. sortKeyName BETWEEN :sortkeyval1 AND :sortkeyval2 - true if the sort key value is greater than or equal to :sortkeyval1, and less than or equal to :sortkeyval2. begins_with ( sortKeyName, :sortkeyval ) - true if the sort key value begins with a particular operand. (You cannot use this function with a sort key that is of type Number.) Note that the function name begins_with is case-sensitive. Use the ExpressionAttributeValues parameter to replace tokens such as :partitionval and :sortval with actual values at runtime.
   */
  KeyConditionExpression?: string;
  /**
   * One or more substitution tokens for attribute names in an expression. Use the # character in an expression to dereference an attribute name. For example, consider the attribute name Percentile. The name of this attribute conflicts with a reserved word, so it cannot be used directly in an expression. To work around this, you could specify the ExpressionAttributeNames as {"#P":"Percentile"}. You could then use this substitution in an expression, as in this example: #P = :val Tokens that begin with the : character are expression attribute values, which are placeholders for the actual value at runtime. For more information on expression attribute names, see Item Attributes in the Amazon DynamoDB Developer Guide.
   */
  ExpressionAttributeNames?: Record<string, string>;
  /**
   * One or more values that can be substituted in an expression. Use the : (colon) character in an expression to dereference an attribute value. For example, suppose that you wanted to check whether the value of the ProductStatus attribute was one of the items: Available | Backordered | Discontinued You would first need to specify ExpressionAttributeValues as: { ":avail": "Available", ":back": "Backordered", ":disc": "Discontinued" } You could then use these values in an expression, such as this: ProductStatus IN (:avail, :back, :disc) For more information on expression attribute values, see Conditions in the Amazon DynamoDB Developer Guide.
   */
  ExpressionAttributeValues?: Record<string, unknown>;
}
export const query = async (
  { input }: { input: RelevantQueryInput },
  context: { aws: { dynamodb: { sdk: SdkAwsDynamodb } } },
) => {
  const { QueryCommand } = context.aws.dynamodb.sdk;
  const dynamodbClient = getDocumentClient(context);
  try {
    return await dynamodbClient.send(
      new QueryCommand({
        // return consumed capacity by default
        ReturnConsumedCapacity: 'TOTAL',

        // where, limit, etc
        ...input,
      }),
    );
  } catch (error) {
    if (!(error instanceof Error)) throw error;
    throw new DynamodbQueryError({ input, errorMessage: error.message });
  }
};
