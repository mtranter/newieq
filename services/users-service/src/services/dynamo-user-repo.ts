import { DynamoDB } from 'aws-sdk';
import { tableBuilder } from 'funamots';
import { Event, User, UserRepo } from '../domain/user-service';

type Dto = {
  hash: string;
  range: string;
  gsi1Hash?: string;
  gsi2Hash?: string;
  isEvent: boolean;
  topicArn?: string;
  data: User | Omit<Event, 'topicArn'>;
};

const userHashKey = (id: string) => `USER#${id}`;
const userRangeKey = () => `#USER#`;
const userKey = (userId: string): Pick<Dto, 'hash' | 'range'> => ({
  hash: userHashKey(userId),
  range: userRangeKey()
});
const userDto = (user: User): Dto => ({
  ...userKey(user.username),
  gsi2Hash: user.username,
  data: user,
  isEvent: false
});

const eventDto = (e: Event): Dto => {
  const { topicArn, ...event } = e;
  return {
    hash: `EVENT#${e.eventId}`,
    range: 'EVENT',
    data: event,
    isEvent: true,
    topicArn
  };
};

export const buildDynamoUserRepo = (tableName: string, client: DynamoDB): UserRepo => {
  const table = tableBuilder<Dto>(tableName)
    .withKey('hash', 'range')
    .withGlobalIndex('gsi1', 'gsi1Hash', 'range')
    .withGlobalIndex('gsi2', 'gsi2Hash', 'range')
    .build({ client });
  return {
    transactionally: async (handler) => {
      const dtos: Dto[] = [];
      await handler({
        putEvent: (e) => dtos.push(eventDto(e)),
        putUser: (u) => dtos.push(userDto(u))
      });
      await table.transactPut(
        dtos.map((d) => ({
          item: d
        }))
      );
    },
    getUser: (id) => table.get(userKey(id)).then((r) => r?.data as User)
  };
};
