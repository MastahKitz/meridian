import { APIRequestContext } from '@playwright/test';
import { assertResponseStatus } from '../../utils/api.utils';
import { sendLoginRequest, captureAccessToken, captureRefreshToken } from './login-api.actions';
import { assertLoginSuccess } from './login-api.assertions';
import { ExpectedTenantMembership, LoginRequestBody } from './login-api.data';

export async function generateAccessToken(request: APIRequestContext, body: LoginRequestBody): Promise<string> {
  const response = await sendLoginRequest(request, body);
  assertResponseStatus(response, 201);
  return captureAccessToken(response);
}

export async function generateRefreshToken(request: APIRequestContext, body: LoginRequestBody): Promise<string> {
  const response = await sendLoginRequest(request, body);
  assertResponseStatus(response, 201);
  return captureRefreshToken(response);
}

export async function assertCanLogin(
  request: APIRequestContext,
  body: LoginRequestBody,
  tenants: ExpectedTenantMembership[],
): Promise<void> {
  const response = await sendLoginRequest(request, body);
  await assertLoginSuccess(response, { email: body.email, tenants });
}
