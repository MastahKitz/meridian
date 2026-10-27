import { APIRequestContext } from '@playwright/test';
import { assertResponseStatus } from '../../utils/api.utils';
import { sendKeyRotateRequest } from './rotate-api.actions';
import { getGeneratedKey } from '../keys-api.actions';
import { RotateKeyRequestBody } from './rotate-api.data';
import { CreateKeyResponseBody } from '../keys-api.data';

export async function rotateKey(
  request: APIRequestContext,
  accessToken: string,
  tenantId: string,
  keyId: string,
  body: RotateKeyRequestBody,
): Promise<CreateKeyResponseBody> {
  const response = await sendKeyRotateRequest(request, accessToken, tenantId, keyId, body);
  assertResponseStatus(response, 201);
  return getGeneratedKey(response);
}
