import type { del } from './delete';
import {
  type RelevantTransactWriteItemInput,
  transactWrite,
} from './dynamodb/transactWrite';
import {
  HelpfulDynamodbError,
  SimpleDynamodbOperation,
} from './HelpfulDynamodbError';
import type { put } from './put';
import type { LogMethod, SimpleDynamodbContext } from './types';

type PutRequestArgs = Parameters<typeof put>[0];
type DeleteRequestArgs = Parameters<typeof del>[0];

export interface SimpleDynamodbTransaction {
  /**
   * queue a write item for the transaction
   */
  queue: {
    put: (args: PutRequestArgs) => void;
    delete: (args: DeleteRequestArgs) => void;
  };
  /**
   * executes the queued write items in a transaction
   */
  execute: (
    { logDebug }: { logDebug: LogMethod },
    context: SimpleDynamodbContext,
  ) => Promise<void>;
  /**
   * a readonly, ISO timestamp for when the transaction was started
   */
  startTimestamp: string;
}

export const startTransaction = (): SimpleDynamodbTransaction => {
  // const queuedReadItems: RelevantTransactReadItemInput[] = []; -> eventually we can support read items too, and just throw an error if someone tries to use same transaction for both read and wrtie
  const queuedWriteItems: RelevantTransactWriteItemInput[] = [];
  const startTimestamp = new Date().toISOString();
  return Object.freeze({
    queue: {
      put: (args: PutRequestArgs) =>
        queuedWriteItems.push({
          Put: {
            TableName: args.tableName,
            Item: args.item,
            ConditionExpression: args.putConditions?.ConditionExpression,
            ExpressionAttributeValues:
              args.putConditions?.ExpressionAttributeValues,
          },
        }),
      delete: (args: DeleteRequestArgs) =>
        queuedWriteItems.push({
          Delete: {
            TableName: args.tableName,
            Key: args.key,
            ConditionExpression: args.deleteConditions?.ConditionExpression,
            ExpressionAttributeValues:
              args.deleteConditions?.ExpressionAttributeValues,
          },
        }),
    },
    execute: async (
      { logDebug }: { logDebug: LogMethod },
      context: SimpleDynamodbContext,
    ) => {
      try {
        logDebug(`writeTransaction.execute.input`, {
          writeItems: queuedWriteItems,
        });
        const response = await transactWrite(
          {
            input: {
              TransactItems: queuedWriteItems,
            },
          },
          context,
        );
        logDebug(`writeTransaction.execute.output`, {
          success: true,
          writeItems: queuedWriteItems,
          consumedCapacity: response.ConsumedCapacity,
        });
      } catch (error) {
        if (!(error instanceof Error)) throw error;
        throw new HelpfulDynamodbError({
          operation: SimpleDynamodbOperation.WRITE_TRANSACTION,
          error,
          input: { writeItems: queuedWriteItems },
        }); // make error more helpful when thrown
      }
    },
    startTimestamp,
  });
};
