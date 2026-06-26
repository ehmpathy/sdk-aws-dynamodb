import { DeleteCommand, type DeleteCommandInput } from '@aws-sdk/lib-dynamodb';

import { getDocumentClient } from './client';

export interface RelevantDeleteInput {
  /**
   * The name of the table from which to delete the item.
   */
  TableName: DeleteCommandInput['TableName'];
  /**
   * A map of attribute names to AttributeValue objects, representing the primary key of the item to delete. For the primary key, you must provide all of the attributes. For example, with a simple primary key, you only need to provide a value for the partition key. For a composite primary key, you must provide values for both the partition key and the sort key.
   */
  Key: DeleteCommandInput['Key'];
  /**
   * A condition that must be satisfied in order for a conditional DeleteItem to succeed. An expression can contain any of the following:   Functions: attribute_exists | attribute_not_exists | attribute_type | contains | begins_with | size  These function names are case-sensitive.   Comparison operators: = | &lt;&gt; | &lt; | &gt; | &lt;= | &gt;= | BETWEEN | IN      Logical operators: AND | OR | NOT    For more information about condition expressions, see Condition Expressions in the Amazon DynamoDB Developer Guide.
   */
  ConditionExpression?: DeleteCommandInput['ConditionExpression'];
  /**
   * One or more values that can be substituted in an expression. Use the : (colon) character in an expression to dereference an attribute value. For example, suppose that you wanted to check whether the value of the ProductStatus attribute was one of the following:   Available | Backordered | Discontinued  You would first need to specify ExpressionAttributeValues as follows:  { ":avail":{"S":"Available"}, ":back":{"S":"Backordered"}, ":disc":{"S":"Discontinued"} }  You could then use these values in an expression, such as this:  ProductStatus IN (:avail, :back, :disc)  For more information on expression attribute values, see Condition Expressions in the Amazon DynamoDB Developer Guide.
   */
  ExpressionAttributeValues?: DeleteCommandInput['ExpressionAttributeValues'];
}

export const deleteItem = async ({ input }: { input: RelevantDeleteInput }) => {
  const dynamodbClient = getDocumentClient();
  return dynamodbClient.send(
    new DeleteCommand({
      // return consumed capacity by default
      ReturnConsumedCapacity: 'TOTAL',

      // where, limit, etc
      ...input,
    }),
  );
};
