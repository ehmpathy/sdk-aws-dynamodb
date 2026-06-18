import { getItem } from './dynamodb/get';
import { get } from './get';
import type { SimpleDynamodbContext } from './types';

jest.mock('./dynamodb/get');
const getItemMock = getItem as jest.Mock;

const mockContext: SimpleDynamodbContext = {
  aws: {
    dynamodb: { sdk: {} as SimpleDynamodbContext['aws']['dynamodb']['sdk'] },
  },
};

describe('get', () => {
  beforeEach(() => jest.clearAllMocks());
  it('should be possible to do a simple lookup', async () => {
    // mock the dynamodb response
    const exampleSavedSpaceship = {
      u: '__REG_NUMBER_FOUND__',
      registration_number: '__REG_NUMBER_FOUND__',
      name: '__NAME_FOUND__',
      max_weight: '__WEIGHT_FOUND__',
      max_passengers: '__PASSENGERS_FOUND__',
    };
    getItemMock.mockResolvedValueOnce({
      Item: exampleSavedSpaceship,
      ConsumedCapacity: { TableName: 'spaceship', CapacityUnits: 1 },
    });

    // init the client and run the get
    const spaceship = await get(
      {
        tableName: 'spaceship',
        logDebug: () => {},
        key: { u: '__REG_NUMBER_FOUND__' },
        attributesToRetrieveInQuery: [
          'u',
          'registration_number',
          'name',
          'max_weight',
          'max_passengers',
        ],
      },
      mockContext,
    );

    // check we called dynamodb correctly
    expect(getItemMock).toHaveBeenCalledWith(
      {
        input: {
          TableName: 'spaceship',
          ProjectionExpression:
            '#u,#registration_number,#name,#max_weight,#max_passengers',
          Key: { u: '__REG_NUMBER_FOUND__' },
          ExpressionAttributeNames: {
            // map each to ensure no naming conflicts
            '#max_passengers': 'max_passengers',
            '#max_weight': 'max_weight',
            '#name': 'name',
            '#registration_number': 'registration_number',
            '#u': 'u',
          },
        },
      },
      mockContext,
    );

    // check that the returned value was accurate
    expect(spaceship).not.toEqual(null);
    expect(spaceship).toEqual(exampleSavedSpaceship);
  });
});
