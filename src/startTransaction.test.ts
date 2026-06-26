import { del } from './delete';
import { deleteItem } from './dynamodb/delete';
import { putItem } from './dynamodb/put';
import { transactWrite } from './dynamodb/transactWrite';
import { HelpfulDynamodbError } from './HelpfulDynamodbError';
import { put } from './put';
import { startTransaction } from './startTransaction';

const logDebug = () => jest.fn();

jest.mock('./dynamodb/put');
const putItemMock = putItem as jest.Mock;
putItemMock.mockReturnValue({ ConsumedCapacity: '__CONSUMED_CAPACITY__' });
jest.mock('./dynamodb/delete');
const deleteItemMock = deleteItem as jest.Mock;
deleteItemMock.mockReturnValue({ ConsumedCapacity: '__CONSUMED_CAPACITY__' });
jest.mock('./dynamodb/transactWrite');
const transactWriteMock = transactWrite as jest.Mock;
transactWriteMock.mockReturnValue({
  ConsumedCapacity: '__CONSUMED_CAPACITY__',
});

describe('beginWriteTransaction', () => {
  it('should be possible to queue a put', async () => {
    const transaction = startTransaction();
    transaction.queue.put({
      tableName: 'spaceships',
      item: { fuel: 9000 },
      logDebug,
    });
  });
  it('should be possible to interchange queue.put and normal put', async () => {
    const input = { tableName: 'spaceships', item: { fuel: 9000 }, logDebug };

    // input works for normal request
    await put(input);

    // input works for transaction too
    const transaction = startTransaction();
    transaction.queue.put(input);
  });

  it('should be possible to queue a delete', async () => {
    const transaction = startTransaction();
    transaction.queue.delete({
      tableName: 'spaceships',
      key: { p: 'uuid' },
      logDebug,
    });
  });
  it('should be possible to interchange queue.put and normal put', async () => {
    const input = { tableName: 'spaceships', key: { p: 'uuid' }, logDebug };

    // input works for normal request
    await del(input);

    // input works for transaction too
    const transaction = startTransaction();
    transaction.queue.delete(input);
  });

  it('should accurately execute a transaction', async () => {
    const transaction = startTransaction();
    transaction.queue.put({
      tableName: 'spaceships',
      item: { id: 821, fuel: 9000 },
      logDebug,
    });
    transaction.queue.put({
      tableName: 'spaceport',
      item: { spaceships: [{ id: 821 }] },
      logDebug,
    });
    transaction.queue.delete({
      tableName: 'cargo-to-spaceship',
      key: { p: 'SOIL', s: 821 },
      logDebug,
    });
    transaction.queue.put({
      tableName: 'cargo-to-spaceship',
      item: { p: 'SOIL', s: 721, quantity: 7 },
      logDebug,
    });
    await transaction.execute({ logDebug });
    expect(transactWriteMock).toHaveBeenCalledTimes(1);
    expect(transactWriteMock).toHaveBeenCalledWith({
      input: {
        TransactItems: [
          {
            Put: {
              TableName: 'spaceships',
              Item: { id: 821, fuel: 9000 },
              ConditionExpression: undefined,
              ExpressionAttributeValues: undefined,
            },
          },
          {
            Put: {
              TableName: 'spaceport',
              Item: { spaceships: [{ id: 821 }] },
              ConditionExpression: undefined,
              ExpressionAttributeValues: undefined,
            },
          },
          {
            Delete: {
              TableName: 'cargo-to-spaceship',
              Key: {
                p: 'SOIL',
                s: 821,
              },
              ConditionExpression: undefined,
              ExpressionAttributeValues: undefined,
            },
          },
          {
            Put: {
              TableName: 'cargo-to-spaceship',
              Item: {
                p: 'SOIL',
                s: 721,
                quantity: 7,
              },
              ConditionExpression: undefined,
              ExpressionAttributeValues: undefined,
            },
          },
        ],
      },
    });
  });
  it('should throw a helpful error if the transaction failed', async () => {
    transactWriteMock.mockRejectedValueOnce(
      new Error(
        'Transaction cancelled, please refer cancellation reasons for specific reasons [None, ConditionalCheckFailed]',
      ), // typical example message
    );
    const transaction = startTransaction();
    transaction.queue.put({
      tableName: 'spaceships',
      item: { id: 821, fuel: 9000 },
      logDebug,
    });
    transaction.queue.delete({
      tableName: 'cargo-to-spaceship',
      key: { p: 'SOIL', s: 821 },
      logDebug,
    });
    try {
      await transaction.execute({ logDebug });
      throw new Error('should not reach here');
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      expect(error).toBeInstanceOf(HelpfulDynamodbError);
      expect(error.message).toContain(
        'Error: Transaction cancelled, please refer cancellation reasons for specific reasons [None, ConditionalCheckFailed]',
      );
      expect(error.message).toContain('"Put": {');
      expect(error.message).toContain('"Delete": {');
      expect(error.message).toMatchSnapshot(); // save an example for docs
    }
  });
  it('should be possible to get a static, synced timestamp to use for writes in the transaction', async () => {
    const transaction = startTransaction();
    transaction.queue.put({
      tableName: 'nature-preserve',
      item: {
        name: 'the great preserve',
        effectiveAt: transaction.startTimestamp,
      },
      logDebug,
    });
    transaction.queue.put({
      tableName: 'species',
      item: {
        kingdom: 'animal',
        class: 'mammals',
        family: 'foxes',
        species: 'silver fox',
      },
      logDebug,
    });
    transaction.queue.put({
      tableName: 'funding',
      item: {
        grant: 1000000,
        remaining: 50000,
        effectiveAt: transaction.startTimestamp,
      },
      logDebug,
    });
    await transaction.execute({ logDebug });
  });
});
