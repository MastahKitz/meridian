import { test } from '@playwright/test';
import { generateRefreshToken } from '../login/login-api.flow';
import { ownerLoginBody } from '../login/login-api.data';
import { sendRefreshRequest } from './refresh-api.actions';
import { assertRefreshSuccess } from './refresh-api.assertions';

test.describe('refresh api', { tag: ['@auth', '@refresh', '@api'] }, () => {

  test('validate a valid refresh token returns a new access token', async ({ request }) => {
    const refreshToken = await generateRefreshToken(request, ownerLoginBody);

    const response = await sendRefreshRequest(request, { refreshToken });
    await assertRefreshSuccess(response);
  });

});
