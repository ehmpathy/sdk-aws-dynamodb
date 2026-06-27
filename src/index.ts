import { del } from './delete';
import { get } from './get';
import { put } from './put';
import { query } from './query';
import { startTransaction } from './startTransaction';

export type { SimpleDynamodbDeleteConditions } from './delete';
export {
  HelpfulDynamodbError,
  SimpleDynamodbOperation,
} from './HelpfulDynamodbError';
export type { SimpleDynamodbPutConditions } from './put';
export type { SimpleDynamodbQueryConditions } from './query';
export type { SimpleDynamodbTransaction } from './startTransaction';
export type { AttributesToRetrieveInQuery, LogMethod } from './types';

export const sdkAwsDynamodb = {
  get,
  query,
  put,
  delete: del,
  startTransaction,
};
