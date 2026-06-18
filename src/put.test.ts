import { putItem } from './dynamodb/put';
import { HelpfulDynamodbError } from './HelpfulDynamodbError';
import { put } from './put';
import type { SimpleDynamodbContext } from './types';

jest.mock('./dynamodb/put');
const putItemMock = putItem as jest.Mock;
putItemMock.mockReturnValue({ ConsumedCapacity: '__CONSUMED_CAPACITY__' });

const mockContext: SimpleDynamodbContext = {
  aws: {
    dynamodb: { sdk: {} as SimpleDynamodbContext['aws']['dynamodb']['sdk'] },
  },
};

describe('put', () => {
  beforeEach(() => jest.clearAllMocks());
  it('should be possible to put an item', async () => {
    const spaceship = {
      registrationNumber: '821-128-821',
      name: 'space-boi',
      maxWeight: 821,
      maxPassengers: 821,
    };
    await put(
      {
        tableName: 'spaceship',
        logDebug: jest.fn(),
        item: spaceship,
      },
      mockContext,
    );

    // check we called aws sdk correctly
    expect(putItemMock).toHaveBeenCalledWith(
      {
        input: {
          TableName: 'spaceship',
          Item: spaceship,
          ConditionExpression: undefined,
          ExpressionAttributeValues: undefined,
        },
      },
      mockContext,
    );
  });
  it('should throw a helpful error when an error occurs', async () => {
    putItemMock.mockRejectedValueOnce(
      new Error('The conditional request failed'),
    );
    try {
      await put(
        {
          tableName: 'spaceship',
          logDebug: jest.fn(),
          item: { a: true },
        },
        mockContext,
      );
      throw new Error('should not reach here');
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      expect(error).toBeInstanceOf(HelpfulDynamodbError);
      expect(error.message).toContain('Error: The conditional request failed');
    }
  });
});
