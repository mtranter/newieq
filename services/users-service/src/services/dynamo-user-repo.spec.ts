import { DynamoDB } from 'aws-sdk';
import { User } from '../domain/user-service';
import { buildDynamoUserRepo } from './dynamo-user-repo';

describe('DynamoDB Repo', () => {
  const dynamoDbClient = new DynamoDB({
    endpoint: 'localhost:8000',
    sslEnabled: false,
    region: 'local-env',
    credentials: {
      accessKeyId: 'fakeMyKeyId',
      secretAccessKey: 'fakeSecretAccessKey'
    }
  });
  const sut = buildDynamoUserRepo('UserService', dynamoDbClient);
  describe('User CRUD', () => {
    it('should put and get RRP', async () => {
      const user: User = {
        username: 'jsmith',
        passwordHash: '#'
      };
      await sut.transactionally(async (tx) => tx.putUser(user));
      const userById = await sut.getUser(user.username);
      expect(userById).toEqual(user);
    });
  });
});
