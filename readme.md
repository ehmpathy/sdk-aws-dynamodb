# sdk-aws-dynamodb

![ci_on_commit](https://github.com/ehmpathy/sdk-aws-dynamodb/workflows/ci_on_commit/badge.svg)
![deploy_on_tag](https://github.com/ehmpathy/sdk-aws-dynamodb/workflows/deploy_on_tag/badge.svg)

a pit-of-success sdk for aws dynamodb. simple, practiced, and helpful.

simple:

- removes "deprecated" and redundant params
- adds intellisense comments to type definitions on params
- normalizes input keys to ensure that no reserved key errors are thrown from dynamo api

practiced:

- stress tested through mature production critical paths
- follows established dynamodb best practices, not adhoc workarounds
- reuses tcp connections across dynamodb queries, a performance best practice [recommended by aws](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/node-reusing-connections.html)

helpful:

- simplifies contracts to eliminate friction and hazards
- enforces standard input and output logs, which is important to debug live systems
- throws contextual errors that include the operation and input, to speed up diagnostics

# Install

```sh
npm install --save sdk-aws-dynamodb
```

# Example

### write

```ts
import { sdkAwsDynamodb } from 'sdk-aws-dynamodb';

// ... your other imports ...

export const record = async ({ user }: { user: User }) => {
  const config = await promiseConfig();
  const item = castFromModelToDynamodbItem({ user });
  await sdkAwsDynamodb.put({
    tableName: config.dynamodb.userTable,
    logDebug: log.debug,
    item,
  });
};
```

### read

#### get

```ts
import { sdkAwsDynamodb } from 'sdk-aws-dynamodb';

// ... your other imports ...

export const findByUuid = async ({ uuid }: { uuid: string }) => {
  const config = await getConfig();
  const item = await sdkAwsDynamodb.get({
    tableName: config.dynamodb.userTable,
    logDebug: log.debug,
    attributesToRetrieveInQuery: ['o'], // i.e., we only care about the "o" key, in this example
    key: {
      p: getPartitionKey({ uuid }), // i.e., partition key is made from uuid, in this example
    }
  });
  if (!item) return null;
  return castFromDynamodbToDomain({ item });
};
```

#### query

secondary index example

```ts
import { sdkAwsDynamodb } from 'sdk-aws-dynamodb';

// ... your other imports ...

export const findAllForUser = async ({ userUuid, effectiveAt }: { userUuid: string, effectiveAt: string }) => {
  const config = await getConfig();
  const items = await sdkAwsDynamodb.query({
    tableName: config.dynamodb.userFavoritesTable,
    logDebug: log.debug,
    attributesToRetrieveInQuery: ['o'], // i.e., we only care about the "o" key, in this example
    queryConditions: {
      KeyConditionExpression: 'q = :q',
      ExpressionAttributeValues: {
        ':q': userUuid, // i.e., secondary index key is made from userUuid and called 'q', in this example
      },
    },
  });
  return items.map(item => castFromDynamodbToDomain({ item }))
};
```

temporal database design pattern, to find state of an object at a time in the past:

```ts
import { sdkAwsDynamodb } from 'sdk-aws-dynamodb';

// ... your other imports ...

export const findByUuid = async ({ uuid, effectiveAt }: { uuid: string, effectiveAt: string }) => {
  const config = await getConfig();
  const items = await sdkAwsDynamodb.query({
    tableName: config.dynamodb.userTable,
    logDebug: log.debug,
    attributesToRetrieveInQuery: ['o'], // i.e., we only care about the "o" key, in this example
    queryConditions: {
      KeyConditionExpression: 'p = :p and s <= :s',
      ExpressionAttributeValues: {
        ':p': getPartitionKey({ uuid }), // i.e., partition key is made from uuid, in this example
        ':s': effectiveAt, // i.e., in this case the sort key is the timestamp of the time the version became "effective" (temporal database design pattern)
      },
      ScanIndexForward: false,
      Limit: 1,
    },
  });
  if (!items.length) return null;
  if (items.length > 1) throw new Error('more than one user found by uuid');
  return castFromDynamodbToDomain({ item: items[0] });
};
```

### transaction

```ts
import { sdkAwsDynamodb } from 'sdk-aws-dynamodb';

const transaction = sdkAwsDynamodb.startTransaction();
transaction.queue.put(...) // note: Parameters<typeof transaction.queue.put> === Parameters<typeof sdkAwsDynamodb.put>
transaction.queue.delete(...) // note: Parameters<typeof transaction.queue.delete> === Parameters<typeof sdkAwsDynamodb.delete>
await transaction.execute({ logDebug: log.debug });
```

### custom endpoint

If you want to use a custom dynamodb endpoint, you can do so easily with an environmental variable. This is particularly helpful for [tests against a local dynamodb instance](https://medium.com/platform-engineer/running-aws-dynamodb-local-with-docker-compose-6f75850aba1e).

for example
```sh
export USE_CUSTOM_DYNAMODB_ENDPOINT=http://localhost:8000
```

# Tips

## terraform

we recommend you provision your dynamodb tables with terraform. example:

```hcl
resource "aws_dynamodb_table" "table_user" {
  name = "${local.service}-${var.environment}-table-user"

  billing_mode = "PAY_PER_REQUEST"

  hash_key = "p" # partition key

  attribute {
    name = "p"
    type = "S"
  }

  tags = local.tags
}
```

## casts

we recommend you define explicit cast functions (as you will have seen in the examples above).

a `getPartitionKey` is a useful function because it explicitly declares how to get the partition key in one place:

```ts
export const getPartitionKey = ({ user }: { user: User }) => user.uuid;
```

a `castFromModelToDynamodbItem` function allows you to declare in one place how to cast from the way your code talks about this data into the way that dynamo will represent the data:

```ts
import { getPartitionKey } from './getPartitionKey';

export const castFromModelToDynamodbItem = ({ user }: { user: User }) => {
  return {
    p: getPartitionKey(user}), // the partition key, upon which we will overwrite data
    recorded_at: new Date().toISOString(), // to debug the last time the cache for this was updated
    user, // i.e., just store the whole object in one column, for simplicity
    user_name: user.name, // but also store the users name in a separate column for easier visual debug
  };
};
```

and a `castFromDynamodbItemToModel` function allows you to declare in one place how to do the reverse, and cast from the way that dynamodb talks about your data back to how your code prefers to talk about it:

```ts
export const castFromDynamodbItemToModel = ({ item }: { item: any }) => {
  return new User(item.user); // we expect that the whole "user" object is stored on `item.user`; this is reflected in the `castFromModelToDynamodbItem` function
};
```
