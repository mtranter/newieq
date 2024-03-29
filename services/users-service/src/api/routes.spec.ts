/* eslint-disable @typescript-eslint/no-explicit-any */
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { buildApi } from './routes';
import { buildUserService } from '../domain';
import { buildJwt } from './jwt';
import { RegisterRequest } from '../requests';
import { JwtPayload } from 'jsonwebtoken';

describe('User API', () => {
  const transactionally = jest.fn();
  const getUser = jest.fn();
  const getUserByEmail = jest.fn();
  const getUserByUsername = jest.fn();
  const mockRepo = {
    transactionally,
    getUser,
    getUserByEmail,
    getUserByUsername
  };
  const svc = buildUserService(mockRepo, 'my-topic');
  const jwt = buildJwt('secret');

  const sut = buildApi(svc, jwt);
  const callApi = (r: Partial<APIGatewayProxyEvent>): Promise<APIGatewayProxyResult> => {
    const req = { ...r, headers: { 'content-type': 'application/json' } };
    return sut(
      req as APIGatewayProxyEvent,
      {} as unknown as Context,
      undefined as any
    ) as Promise<APIGatewayProxyResult>;
  };
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });
  describe('Register User', () => {
    const doRegister = (req: RegisterRequest) =>
      callApi({
        path: `/register`,
        httpMethod: 'POST',
        body: JSON.stringify(req)
      });
    describe('When no user with the same details exists', () => {
      beforeEach(() => {
        getUserByEmail.mockResolvedValue(undefined);
        getUserByUsername.mockResolvedValue(undefined);
      });
      const act = () =>
        doRegister({
          username: 'jsmith',
          password: 'p@55w0rd'
        });
      it('Should return 201', async () => {
        const result = await act();
        expect(result.statusCode).toEqual(201);
      });
      it('Should return a user', async () => {
        const result = await act();
        const response = JSON.parse(result.body);
        expect(response).toMatchObject({
          username: 'jsmith',
          token: expect.any(String)
        });
        const jot = jwt.verify(response.token) as JwtPayload;
        expect(jot.username).toEqual('jsmith');
      });
    });
  });
});
