import { test } from '@playwright/test';
import { generateRefreshToken } from '../login/login-api.flow';
import { ownerLoginBody } from '../login/login-api.data';
import { terminateRefreshToken } from '../logout/logout-api.flow';
import { sendRefreshRequest } from './refresh-api.actions';
import {
  assertInvalidRefreshTokenError,
  assertRefreshTokenRequiredError,
} from './refresh-api.assertions';

test.describe('refresh api - errors', { tag: ['@auth', '@refresh', '@api', '@error'] }, () => {

  test('validate refresh cannot be called with an invalid refresh token', async ({ request }) => {
    const response = await sendRefreshRequest(request, { refreshToken: 'totally-made-up-token-xyz' });
    await assertInvalidRefreshTokenError(response);
  });

  test('validate refresh cannot be called with a revoked refresh token', async ({ request }) => {
    const refreshToken = await generateRefreshToken(request, ownerLoginBody);
    await terminateRefreshToken(request, refreshToken);

    const response = await sendRefreshRequest(request, { refreshToken });
    await assertInvalidRefreshTokenError(response);
  });

  test('validate refresh cannot be called with a blank refresh token', async ({ request }) => {
    const response = await sendRefreshRequest(request, { refreshToken: '' });
    await assertRefreshTokenRequiredError(response);
  });

});
