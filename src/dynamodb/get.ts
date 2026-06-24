import { GetCommand, type GetCommandInput } from '@aws-sdk/lib-dynamodb';

import { getDocumentClient } from './client';

export interface RelevantGetInput {
  /**
   * The name of the table containing the requested items.
   */
  TableName: GetCommandInput['TableName'];
  /**
   * Determines the read consistency model: If set to true, then the operation uses strongly consistent reads; otherwise, the operation uses eventually consistent reads. Strongly consistent reads are not supported on global secondary indexes. If you query a global secondary index with ConsistentRead set to true, you will receive a ValidationException.
   */
  ConsistentRead?: GetCommandInput['ConsistentRead'];
  /**
   * A map of attribute names to AttributeValue objects, representing the primary key of the item to retrieve. For the primary key, you must provide all of the attributes. For example, with a simple primary key, you only need to provide a value for the partition key. For a composite primary key, you must provide values for both the partition key and the sort key.
   */
  Key: GetCommandInput['Key'];
  /**
   * A string that identifies one or more attributes to retrieve from the table. These attributes can include scalars, sets, or elements of a JSON document. The attributes in the expression must be separated by commas. If no attribute names are specified, then all attributes will be returned. If any of the requested attributes are not found, they will not appear in the result. For more information, see Accessing Item Attributes in the Amazon DynamoDB Developer Guide.
   */
  ProjectionExpression?: GetCommandInput['ProjectionExpression'];
  /**
   * One or more substitution tokens for attribute names in an expression. The following are some use cases for using ExpressionAttributeNames:   To access an attribute whose name conflicts with a DynamoDB reserved word.   To create a placeholder for repeating occurrences of an attribute name in an expression.   To prevent special characters in an attribute name from being misinterpreted in an expression.   Use the # character in an expression to dereference an attribute name. For example, consider the following attribute name:    Percentile    The name of this attribute conflicts with a reserved word, so it cannot be used directly in an expression. (For the complete list of reserved words, see Reserved Words in the Amazon DynamoDB Developer Guide). To work around this, you could specify the following for ExpressionAttributeNames:    {"#P":"Percentile"}    You could then use this substitution in an expression, as in this example:    #P = :val     Tokens that begin with the : character are expression attribute values, which are placeholders for the actual value at runtime.  For more information on expression attribute names, see Accessing Item Attributes in the Amazon DynamoDB Developer Guide.
   */
  ExpressionAttributeNames?: GetCommandInput['ExpressionAttributeNames'];
}
export const getItem = async ({ input }: { input: RelevantGetInput }) => {
  const dynamodbClient = getDocumentClient();
  return dynamodbClient.send(
    new GetCommand({
      // return consumed capacity by default
      ReturnConsumedCapacity: 'TOTAL',

      // where, limit, etc
      ...input,
    }),
  );
};
