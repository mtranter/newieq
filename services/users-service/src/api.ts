import { DynamoDB } from 'aws-sdk';
import XRay from 'aws-xray-sdk-core';

import { buildDynamoUserRepo } from './services/dynamo-user-repo';
import { buildUserService } from './domain/user-service';
import { buildApi } from './api/routes';
import { buildJwt } from './api/jwt';
import { envOrThrow } from './env';

export const handler = buildApi(
  buildUserService(
    buildDynamoUserRepo(envOrThrow('DYNAMODB_TABLE_NAME'), XRay.captureAWSClient(new DynamoDB())),
    envOrThrow('USEREVENTS_TOPIC_ARN')
  ),
  buildJwt(envOrThrow('JWT_SECRET'))
);
