import { APIResponse } from '@playwright/test';
import { assertResponseStatus, assertResponseBody } from '../../utils/api.utils';
import { LogoutErrorResponseBody, LogoutResponseBody } from './logout-api.data';

export async function assertLogoutSuccess(response: APIResponse) {
  assertResponseStatus(response, 201);
  const body: LogoutResponseBody = await response.json();
  assertResponseBody(body, { ok: true }, { exact: true });
}

export async function assertRefreshTokenRequiredError(response: APIResponse) {
  assertResponseStatus(response, 400);
  const body: LogoutErrorResponseBody = await response.json();
  assertResponseBody(body, {
    message: 'refreshToken required',
    error: 'Bad Request',
    statusCode: 400,
  }, { exact: true });
}
