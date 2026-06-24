import { get } from './get';

const getMock = jest.fn();

jest.mock('./dynamodb/client', () => ({
  getDocumentClient: jest.fn(() => ({
    send: getMock,
  })),
}));

describe('get', () => {
  beforeEach(() => jest.clearAllMocks());
  it('should be possible to do a simple lookup', async () => {
    // mock the aws-sdk response items
    const exampleSavedSpaceship = {
      u: '__REG_NUMBER_FOUND__',
      registration_number: '__REG_NUMBER_FOUND__',
      name: '__NAME_FOUND__',
      max_weight: '__WEIGHT_FOUND__',
      max_passengers: '__PASSENGERS_FOUND__',
    };
    getMock.mockResolvedValueOnce({
      Item: exampleSavedSpaceship,
    });

    // init the client and run the get
    const spaceship = await get({
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
    });

    // check we called aws sdk correctly
    expect(getMock).toHaveBeenCalledWith(
      expect.objectContaining({
        input: {
          TableName: 'spaceship',
          ProjectionExpression:
            '#u,#registration_number,#name,#max_weight,#max_passengers',
          ReturnConsumedCapacity: 'TOTAL',
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
      }),
    );

    // check that the returned value was accurate
    expect(spaceship).not.toEqual(null);
    expect(spaceship).toEqual(exampleSavedSpaceship);
  });
});
