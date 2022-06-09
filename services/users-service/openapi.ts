import { writeFileSync } from 'fs';
import { buildApi } from './src/api/routes';

export const OpenApiSpec = buildApi(null as any, null as any).toOpenApi(
  {
    title: 'Users Service API',
    version: '1.0.0'
  },
  '${FUNCTION_ARN}',
  undefined,
  {
    'lambda-auth': {
      type: 'apiKey',
      in: 'header',
      name: 'Authorization',
      'x-amazon-apigateway-authtype': 'custom',
      'x-amazon-apigateway-authorizer': {
        type: 'token',
        enableSimpleResponses: true,
        authorizerPayloadFormatVersion: '2.0',
        authorizerResultTtlInSeconds: 300,
        authorizerUri: '${AUTHORIZER_FUNCTION_URI}',
        authorizerCredentials: '${ROLE_ARN}'
      }
    }
  }
);

const fileLocation = process.argv[2] || './openapi.json';
writeFileSync(fileLocation, JSON.stringify(OpenApiSpec, null, 2));
