import { APIResponse, expect } from '@playwright/test';
import { assertResponseStatus, assertResponseBody } from '../../utils/api.utils';
import { RefreshErrorResponseBody, RefreshResponseBody } from './refresh-api.data';

// Only shape is asserted, not inequality against the token used to log in — jwt.sign
// includes a whole-second `iat`, so two calls within the same second produce a
// byte-identical token (same payload, same secret, same expiresIn). Asserting the two
// tokens differ would be flaky, not incorrect-when-it-fails.
export async function assertRefreshSuccess(response: APIResponse) {
  assertResponseStatus(response, 201);
  const body: RefreshResponseBody = await response.json();
  assertResponseBody(body, {
    accessToken: expect.stringMatching(/^[\w-]+\.[\w-]+\.[\w-]+$/),
  }, { exact: true });
}

export async function assertRefreshTokenRequiredError(response: APIResponse) {
  assertResponseStatus(response, 400);
  const body: RefreshErrorResponseBody = await response.json();
  assertResponseBody(body, {
    message: 'refreshToken required',
    error: 'Bad Request',
    statusCode: 400,
  }, { exact: true });
}

export async function assertInvalidRefreshTokenError(response: APIResponse) {
  assertResponseStatus(response, 401);
  const body: RefreshErrorResponseBody = await response.json();
  assertResponseBody(body, {
    message: 'Invalid refresh token',
    error: 'Unauthorized',
    statusCode: 401,
  }, { exact: true });
}
