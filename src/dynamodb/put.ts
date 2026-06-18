import { getDocumentClient } from './client';
import type { SdkAwsDynamodb } from './SdkAwsDynamodb';

export interface RelevantPutInput {
  /**
   * The name of the table to contain the item.
   */
  TableName: string;
  /**
   * A map of attribute name/value pairs, one for each attribute. Only the primary key attributes are required; you can optionally provide other attribute name-value pairs for the item. You must provide all of the attributes for the primary key. For example, with a simple primary key, you only need to provide a value for the partition key. For a composite primary key, you must provide both values for both the partition key and the sort key. If you specify any attributes that are part of an index key, then the data types for those attributes must match those of the schema in the table's attribute definition. Empty String and Binary attribute values are allowed. Attribute values of type String and Binary must have a length greater than zero if the attribute is used as a key attribute for a table or index. For more information about primary keys, see Primary Key in the Amazon DynamoDB Developer Guide. Each element in the Item map is an AttributeValue object.
   */
  Item: Record<string, unknown>;
  /**
   * A condition that must be satisfied in order for a conditional PutItem operation to succeed. An expression can contain any of the following:   Functions: attribute_exists | attribute_not_exists | attribute_type | contains | begins_with | size  These function names are case-sensitive.   Comparison operators: = | &lt;&gt; | &lt; | &gt; | &lt;= | &gt;= | BETWEEN | IN      Logical operators: AND | OR | NOT    For more information on condition expressions, see Condition Expressions in the Amazon DynamoDB Developer Guide.
   */
  ConditionExpression?: string;
  /**
   * One or more values that can be substituted in an expression. Use the : (colon) character in an expression to dereference an attribute value. For example, suppose that you wanted to check whether the value of the ProductStatus attribute was one of the following:   Available | Backordered | Discontinued  You would first need to specify ExpressionAttributeValues as follows:  { ":avail":{"S":"Available"}, ":back":{"S":"Backordered"}, ":disc":{"S":"Discontinued"} }  You could then use these values in an expression, such as this:  ProductStatus IN (:avail, :back, :disc)  For more information on expression attribute values, see Condition Expressions in the Amazon DynamoDB Developer Guide.
   */
  ExpressionAttributeValues?: Record<string, unknown>;
}

export const putItem = async (
  { input }: { input: RelevantPutInput },
  context: { aws: { dynamodb: { sdk: SdkAwsDynamodb } } },
) => {
  const { PutCommand } = context.aws.dynamodb.sdk;
  const dynamodbClient = getDocumentClient(context);
  return dynamodbClient.send(
    new PutCommand({
      // return consumed capacity by default
      ReturnConsumedCapacity: 'TOTAL',

      // where, limit, etc
      ...input,
    }),
  );
};
