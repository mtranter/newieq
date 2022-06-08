import { LoginRequest, RegisterRequest } from '../requests';
import { uuid } from 'uuidv4';
import bcrypt from 'bcryptjs';

export type User = {
  username: string;
  passwordHash: string;
};

export type EventPayload =
  | { type: 'UserCreated'; newUser: Omit<User, 'passwordHash'> }
  | {
      type: 'UserUpdated';
      newUser: Omit<User, 'passwordHash'>;
      oldUser: Omit<User, 'passwordHash'>;
    };

export type Event = {
  eventId: string;
  key: string;
  timestamp: string;
  value: EventPayload;
  topicArn: string;
};

export type UserRepo = {
  getUser: (id: string) => Promise<User | undefined>;
  transactionally: (
    handler: (tx: { putUser: (user: User) => void; putEvent: (event: Event) => void }) => Promise<void>
  ) => Promise<void>;
};

const hashPassword = (password: string): Promise<string> =>
  new Promise((res, rej) => bcrypt.hash(password, 10, (e, p) => (e ? rej(e) : res(p))));

const validatePassword = (attempt: string, hash: string): Promise<boolean> =>
  new Promise((res, rej) => bcrypt.compare(attempt, hash, (err, ok) => (err ? rej(err) : res(ok))));
export type UserService = {
  getUser: (userId: string) => Promise<User | undefined>;
  loginUser: (req: LoginRequest) => Promise<User | undefined>;
  registerUser: (req: RegisterRequest) => Promise<User | 'UserExists'>;
};

export const buildUserService = (repo: UserRepo, eventTopicArn: string): UserService => ({
  getUser: (id) => repo.getUser(id),
  loginUser: async (req) => {
    const user = await repo.getUser(req.username);
    if (!user) {
      return undefined;
    }
    const isValid = await validatePassword(req.password, user.passwordHash);
    return isValid ? user : undefined;
  },
  registerUser: async (req) => {
    const existingUser = await repo.getUser(req.username);
    if (existingUser) {
      return 'UserExists';
    }
    const { password, ...safeUser } = req;
    const passwordHash = await hashPassword(password);
    const user = { passwordHash, ...safeUser };
    await repo.transactionally(async (tx) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...safeUser } = user;
      tx.putUser(user);
      tx.putEvent({
        eventId: uuid(),
        timestamp: new Date().toISOString(),
        key: safeUser.username,
        value: { type: 'UserCreated', newUser: safeUser },
        topicArn: eventTopicArn
      });
    });
    return user;
  }
});
