import { APIGatewayAuthorizerEvent, APIGatewayAuthorizerHandler, APIGatewayTokenAuthorizerEvent } from 'aws-lambda';
import { JwtPayload } from 'jsonwebtoken';
import { buildJwt } from './api/jwt';
import { envOrThrow } from './env';

const isTokenEvent = (e: APIGatewayAuthorizerEvent): e is APIGatewayTokenAuthorizerEvent => e.type === 'TOKEN';

export const index: APIGatewayAuthorizerHandler = (e) => {
  const jwt = buildJwt(envOrThrow('JWT_SECRET'));
  const authHeaderValue = isTokenEvent(e) ? e.authorizationToken : e.headers?.['authorization'];
  try {
    const header = authHeaderValue?.substring('token '.length);
    const token = jwt.verify(header!) as JwtPayload;
    const apiId = e.methodArn.split('/')[0];
    return Promise.resolve({
      principalId: token.username!,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: `${apiId}/*/*/*`
          }
        ]
      },
      context: {
        username: token.username!
      }
    });
  } catch {
    return Promise.resolve({
      principalId: 'unknown',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: e.methodArn
          }
        ]
      }
    });
  }
};
