import type { DeleteCommandInput } from '@aws-sdk/lib-dynamodb';

import { dynamodb } from './dynamodb';
import {
  HelpfulDynamodbError,
  SimpleDynamodbOperation,
} from './HelpfulDynamodbError';
import type { LogMethod } from './types';

export interface SimpleDynamodbDeleteConditions {
  ConditionExpression?: DeleteCommandInput['ConditionExpression'];
  ExpressionAttributeValues?: DeleteCommandInput['ExpressionAttributeValues'];
}

// note: we use the name "del" here because "delete" is a reserved keyword
export const del = async ({
  tableName,
  logDebug,
  key,
  deleteConditions,
}: {
  tableName: string;
  logDebug: LogMethod;
  key: NonNullable<DeleteCommandInput['Key']>;
  deleteConditions?: SimpleDynamodbDeleteConditions;
}) => {
  try {
    logDebug(`${tableName}.delete.input`, {
      tableName,
      key,
      conditions: deleteConditions,
    });
    const response = await dynamodb.delete({
      input: {
        TableName: tableName,
        Key: key, // primary key of item to delete
        ConditionExpression: deleteConditions?.ConditionExpression,
        ExpressionAttributeValues: deleteConditions?.ExpressionAttributeValues,
      },
    });
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
