import type { TransactWriteItemsCommandOutput } from '@aws-sdk/client-dynamodb';
import {
  type DeleteCommandInput,
  type PutCommandInput,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';

import { getDocumentClient } from './client';

export interface RelevantTransactWriteDeleteItemInput {
  /**
   * The primary key of the item to be deleted. Each element consists of an attribute name and a value for that attribute.
   */
  Key: DeleteCommandInput['Key'];
  /**
   * Name of the table in which the item to be deleted resides.
   */
  TableName: DeleteCommandInput['TableName'];
  /**
   * A condition that must be satisfied in order for a conditional delete to succeed.
   */
  ConditionExpression?: DeleteCommandInput['ConditionExpression'];
  /**
   * One or more values that can be substituted in an expression.
   */
  ExpressionAttributeValues?: DeleteCommandInput['ExpressionAttributeValues'];
}
export interface RelevantTransactWritePutItemInput {
  /**
   * A map of attribute name to attribute values, representing the primary key of the item to be written by PutItem. All of the table's primary key attributes must be specified, and their data types must match those of the table's key schema. If any attributes are present in the item that are part of an index key schema for the table, their types must match the index key schema.
   */
  Item: PutCommandInput['Item'];
  /**
   * Name of the table in which to write the item.
   */
  TableName: PutCommandInput['TableName'];
  /**
   * A condition that must be satisfied in order for a conditional update to succeed.
   */
  ConditionExpression?: PutCommandInput['ConditionExpression'];
  /**
   * One or more values that can be substituted in an expression.
   */
  ExpressionAttributeValues?: PutCommandInput['ExpressionAttributeValues'];
}

export type RelevantTransactWriteItemInput =
  | { Put: RelevantTransactWritePutItemInput }
  | { Delete: RelevantTransactWriteDeleteItemInput };

export interface RelevantTransactWriteInput {
  /**
   * An ordered array of up to 25 TransactWriteItem objects, each of which contains a ConditionCheck, Put, Update, or Delete object. These can operate on items in different tables, but the tables must reside in the same AWS account and Region, and no two of them can operate on the same item.
   */
  TransactItems: RelevantTransactWriteItemInput[];

  /**
   * Determines whether consumed capacity information is returned;
   */
  ReturnConsumedCapacity?: 'INDEXES' | 'TOTAL' | 'NONE';
}

export const transactWrite = async ({
  input,
}: {
  input: RelevantTransactWriteInput;
}): Promise<TransactWriteItemsCommandOutput> => {
  const dynamodbClient = getDocumentClient();

  try {
    return await dynamodbClient.send(
      new TransactWriteCommand({
        // return consumed capacity by default
        ReturnConsumedCapacity: 'TOTAL',

        // where, limit, etc
        ...input,
      }),
    );
  } catch (error) {
    // extract cancellation reasons from the error if available
    if (error instanceof Error && 'CancellationReasons' in error) {
      const cancellationReasons = (error as any).CancellationReasons;
      const errorMessage = cancellationReasons
        ? [
            error.message,
            '',
            'Cancellation reasons:',
            JSON.stringify(cancellationReasons, null, 2),
          ].join('\n')
        : error.message;
      const enhancedError = new Error(errorMessage);
      enhancedError.name = 'TransactionCanceledException';
      throw enhancedError;
    }
    throw error;
  }
};
