import { query as queryDynamodb } from './dynamodb/query';
import { query } from './query';
import type { SimpleDynamodbContext } from './types';

jest.mock('./dynamodb/query');
const queryMock = queryDynamodb as jest.Mock;

const mockContext: SimpleDynamodbContext = {
  aws: {
    dynamodb: { sdk: {} as SimpleDynamodbContext['aws']['dynamodb']['sdk'] },
  },
};

describe('query', () => {
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
    queryMock.mockResolvedValueOnce({
      Items: [exampleSavedSpaceship],
      Count: 1,
      ScannedCount: 1,
      ConsumedCapacity: { TableName: 'spaceship', CapacityUnits: 1 },
    });

    // init the client and run the query
    const spaceships = await query(
      {
        tableName: 'spaceship',
        logDebug: () => {},
        queryConditions: {
          KeyConditionExpression: 'u = :registrationNumber',
          ExpressionAttributeValues: {
            ':registrationNumber': '__REGISTRATION_NUMBER__',
          },
        },
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
    expect(queryMock).toHaveBeenCalledWith(
      {
        input: {
          TableName: 'spaceship',
          ProjectionExpression:
            '#u,#registration_number,#name,#max_weight,#max_passengers',
          KeyConditionExpression: 'u = :registrationNumber',
          ExpressionAttributeValues: {
            ':registrationNumber': '__REGISTRATION_NUMBER__',
          },
          ExpressionAttributeNames: {
            // map each to ensure no name conflicts
            '#max_passengers': 'max_passengers',
            '#max_weight': 'max_weight',
            '#name': 'name',
            '#registration_number': 'registration_number',
            '#u': 'u',
          },
          ExclusiveStartKey: undefined,
        },
      },
      mockContext,
    );

    // check that the returned value was accurate
    expect(spaceships.length).toEqual(1);
    expect(spaceships[0]).toEqual(exampleSavedSpaceship);
  });
  it('should be possible to do a secondary index query', async () => {
    // mock the dynamodb response
    const exampleSavedSpaceship = {
      u: '__REG_NUMBER_FOUND__',
      registration_number: '__REG_NUMBER_FOUND__',
      name: '__NAME_FOUND__',
      max_weight: '__WEIGHT_FOUND__',
      max_passengers: '__PASSENGERS_FOUND__',
    };
    queryMock.mockResolvedValueOnce({
      Items: [exampleSavedSpaceship],
      Count: 1,
      ScannedCount: 1,
      ConsumedCapacity: { TableName: 'spaceship', CapacityUnits: 1 },
    });

    // init the dao and run the query
    const spaceships = await query(
      {
        tableName: 'spaceship',
        logDebug: () => {},
        queryConditions: {
          IndexName: 'max_weight_gsi',
          KeyConditionExpression: 'max_weight > :max_weight',
          ExpressionAttributeValues: {
            ':max_weight': '800',
          },
          Limit: 10,
        },
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
    expect(queryMock).toHaveBeenCalledWith(
      {
        input: {
          TableName: 'spaceship',
          ProjectionExpression:
            '#u,#registration_number,#name,#max_weight,#max_passengers',
          IndexName: 'max_weight_gsi',
          KeyConditionExpression: 'max_weight > :max_weight',
          ExpressionAttributeValues: {
            ':max_weight': '800',
          },
          ExpressionAttributeNames: {
            // map each to ensure no name conflicts
            '#max_passengers': 'max_passengers',
            '#max_weight': 'max_weight',
            '#name': 'name',
            '#registration_number': 'registration_number',
            '#u': 'u',
          },
          Limit: 10,
          ExclusiveStartKey: undefined,
        },
      },
      mockContext,
    );

    // check that the returned value was accurate
    expect(spaceships.length).toEqual(1);
    expect(spaceships[0]).toEqual(exampleSavedSpaceship);
  });
});
