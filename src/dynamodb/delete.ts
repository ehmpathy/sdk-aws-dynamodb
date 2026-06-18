import { getDocumentClient } from './client';
import type { SdkAwsDynamodb } from './SdkAwsDynamodb';

export interface RelevantDeleteInput {
  /**
   * The name of the table from which to delete the item.
   */
  TableName: string;
  /**
   * A map of attribute names to AttributeValue objects, which represent the primary key of the item to delete. For the primary key, you must provide all of the attributes. For example, with a simple primary key, you only need to provide a value for the partition key. For a composite primary key, you must provide values for both the partition key and the sort key.
   */
  Key: Record<string, unknown>;
  /**
   * A condition that must be satisfied in order for a conditional DeleteItem to succeed. An expression can contain any of the items: Functions: attribute_exists | attribute_not_exists | attribute_type | contains | begins_with | size These function names are case-sensitive. Comparison operators: = | <> | < | > | <= | >= | BETWEEN | IN Logical operators: AND | OR | NOT For more information about condition expressions, see Condition Expressions in the Amazon DynamoDB Developer Guide.
   */
  ConditionExpression?: string;
  /**
   * One or more values that can be substituted in an expression. Use the : (colon) character in an expression to dereference an attribute value. For example, suppose that you wanted to check whether the value of the ProductStatus attribute was one of the items: Available | Backordered | Discontinued You would first need to specify ExpressionAttributeValues as: { ":avail":{"S":"Available"}, ":back":{"S":"Backordered"}, ":disc":{"S":"Discontinued"} } You could then use these values in an expression, such as this: ProductStatus IN (:avail, :back, :disc) For more information on expression attribute values, see Condition Expressions in the Amazon DynamoDB Developer Guide.
   */
  ExpressionAttributeValues?: Record<string, unknown>;
}

export const deleteItem = async (
  { input }: { input: RelevantDeleteInput },
  context: { aws: { dynamodb: { sdk: SdkAwsDynamodb } } },
) => {
  const { DeleteCommand } = context.aws.dynamodb.sdk;
  const dynamodbClient = getDocumentClient(context);
  return dynamodbClient.send(
    new DeleteCommand({
      // return consumed capacity by default
      ReturnConsumedCapacity: 'TOTAL',

      // where, limit, etc
      ...input,
    }),
  );
};
