import { APIRequestContext } from '@playwright/test';
import { assertResponseStatus } from '../../utils/api.utils';
import { sendLoginRequest, captureAccessToken } from './login-api.actions';
import { LoginRequestBody } from './login-api.data';

export async function generateAccessToken(request: APIRequestContext, body: LoginRequestBody): Promise<string> {
  const response = await sendLoginRequest(request, body);
  assertResponseStatus(response, 201);
  return captureAccessToken(response);
}
