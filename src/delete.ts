import { dynamodb } from './dynamodb';
import {
  HelpfulDynamodbError,
  SimpleDynamodbOperation,
} from './HelpfulDynamodbError';
import type { LogMethod, SimpleDynamodbContext } from './types';

export interface SimpleDynamodbDeleteConditions {
  ConditionExpression?: string;
  ExpressionAttributeValues?: Record<string, unknown>;
}

// note: we use the name "del" here because "delete" is a reserved keyword
export const del = async (
  {
    tableName,
    logDebug,
    key,
    deleteConditions,
  }: {
    tableName: string;
    logDebug: LogMethod;
    key: Record<string, unknown>;
    deleteConditions?: SimpleDynamodbDeleteConditions;
  },
  context: SimpleDynamodbContext,
) => {
  try {
    logDebug(`${tableName}.delete.input`, {
      tableName,
      key,
      conditions: deleteConditions,
    });
    const response = await dynamodb.delete(
      {
        input: {
          TableName: tableName,
          Key: key, // primary key of item to delete
          ConditionExpression: deleteConditions?.ConditionExpression,
          ExpressionAttributeValues:
            deleteConditions?.ExpressionAttributeValues,
        },
      },
      context,
    );
    logDebug(`${tableName}.delete.output`, {
      success: true,
      tableName,
      key,
      conditions: deleteConditions,
      stats: {
        consumedCapacity: response.ConsumedCapacity,
      },
    });
  } catch (error) {
    if (!(error instanceof Error)) throw error;
    throw new HelpfulDynamodbError({
      operation: SimpleDynamodbOperation.DELETE,
      error,
      input: { tableName, key, deleteConditions },
    });
  }
};
