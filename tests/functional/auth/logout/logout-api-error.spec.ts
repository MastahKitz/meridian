import { test } from '@playwright/test';
import { sendLogoutRequest } from './logout-api.actions';
import { assertRefreshTokenRequiredError } from './logout-api.assertions';

test.describe('logout api - errors', { tag: ['@auth', '@logout', '@api', '@error'] }, () => {

  test('validate logout cannot be called with a blank refresh token', async ({ request }) => {
    const response = await sendLogoutRequest(request, { refreshToken: '' });
    await assertRefreshTokenRequiredError(response);
  });

});
