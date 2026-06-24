import { del } from './delete';
import { deleteItem } from './dynamodb/delete';
import { HelpfulDynamodbError } from './HelpfulDynamodbError';

jest.mock('./dynamodb/delete');
const deleteItemMock = deleteItem as jest.Mock;
deleteItemMock.mockReturnValue({ ConsumedCapacity: '__CONSUMED_CAPACITY__' });

describe('delete', () => {
  beforeEach(() => jest.clearAllMocks());
  it('should be possible to delete an item', async () => {
    const spaceship = {
      registrationNumber: '821-128-821',
      name: 'space-boi',
      maxWeight: 821,
      maxPassengers: 821,
    };
    await del({
      tableName: 'spaceship',
      logDebug: jest.fn(),
      key: { p: spaceship.registrationNumber },
    });

    // check we called aws sdk correctly
    expect(deleteItemMock).toHaveBeenCalledWith({
      input: {
        TableName: 'spaceship',
        Key: { p: spaceship.registrationNumber },
        ConditionExpression: undefined,
        ExpressionAttributeValues: undefined,
      },
    });
  });
  it('should throw a helpful error when an error occurs', async () => {
    deleteItemMock.mockRejectedValueOnce(
      new Error('The conditional request failed'),
    );
    try {
      await del({
        tableName: 'spaceship',
        logDebug: jest.fn(),
        key: { p: 'number' },
      });
      throw new Error('should not reach here');
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      expect(error).toBeInstanceOf(HelpfulDynamodbError);
      expect(error.message).toContain('Error: The conditional request failed');
    }
  });
});
