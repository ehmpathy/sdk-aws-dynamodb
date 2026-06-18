import { TransactionCanceledException } from '@aws-sdk/client-dynamodb';
import type { TransactWriteCommandOutput } from '@aws-sdk/lib-dynamodb';

import { getDocumentClient } from './client';
import type { SdkAwsDynamodb } from './SdkAwsDynamodb';

export interface RelevantTransactWriteDeleteItemInput {
  /**
   * The primary key of the item to be deleted. Each element consists of an attribute name and a value for that attribute.
   */
  Key: Record<string, unknown>;
  /**
   * Name of the table in which the item to be deleted resides.
   */
  TableName: string;
  /**
   * A condition that must be satisfied in order for a conditional delete to succeed.
   */
  ConditionExpression?: string;
  /**
   * One or more values that can be substituted in an expression.
   */
  ExpressionAttributeValues?: Record<string, unknown>;
}
export interface RelevantTransactWritePutItemInput {
  /**
   * A map of attribute name to attribute values, which represent the primary key of the item to be written by PutItem. All of the table's primary key attributes must be specified, and their data types must match those of the table's key schema. If any attributes are present in the item that are part of an index key schema for the table, their types must match the index key schema.
   */
  Item: Record<string, unknown>;
  /**
   * Name of the table in which to write the item.
   */
  TableName: string;
  /**
   * A condition that must be satisfied in order for a conditional update to succeed.
   */
  ConditionExpression?: string;
  /**
   * One or more values that can be substituted in an expression.
   */
  ExpressionAttributeValues?: Record<string, unknown>;
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

export const transactWrite = async (
  {
    input,
  }: {
    input: RelevantTransactWriteInput;
  },
  context: { aws: { dynamodb: { sdk: SdkAwsDynamodb } } },
): Promise<TransactWriteCommandOutput> => {
  const { TransactWriteCommand } = context.aws.dynamodb.sdk;
  const dynamodbClient = getDocumentClient(context);

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
    // in v3, TransactionCanceledException includes CancellationReasons directly
    if (error instanceof TransactionCanceledException) {
      const cancellationReasons = error.CancellationReasons;
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
