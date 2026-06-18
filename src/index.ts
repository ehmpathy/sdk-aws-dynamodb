import { del } from './delete';
import { get } from './get';
import { put } from './put';
import { query } from './query';
import { startTransaction } from './startTransaction';

export type { SimpleDynamodbDeleteConditions } from './delete';
export type { SdkAwsDynamodb } from './dynamodb';
export {
  HelpfulDynamodbError,
  SimpleDynamodbOperation,
} from './HelpfulDynamodbError';
export type { SimpleDynamodbPutConditions } from './put';
export type { SimpleDynamodbQueryConditions } from './query';
export type { SimpleDynamodbTransaction } from './startTransaction';
export type {
  AttributesToRetrieveInQuery,
  LogMethod,
  SimpleDynamodbContext,
} from './types';

export const simpleDynamodbClient = {
  get,
  query,
  put,
  delete: del,
  startTransaction,
};
