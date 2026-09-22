import { test } from '@playwright/test';
import { generateRefreshToken } from '../login/login-api.flow';
import { ownerLoginBody } from '../login/login-api.data';
import { sendLogoutRequest } from './logout-api.actions';
import { assertLogoutSuccess } from './logout-api.assertions';

test.describe('logout api', { tag: ['@auth', '@logout', '@api'] }, () => {

  test('validate owner user can logout', async ({ request }) => {
    const refreshToken = await generateRefreshToken(request, ownerLoginBody);

    const response = await sendLogoutRequest(request, { refreshToken });
    await assertLogoutSuccess(response);
  });

  // logout() has no existence check — it's an unconditional UPDATE ... WHERE
  // refresh_token = $1, so a token that was never real still gets a 201/{ok:true}.
  // Documented as accepted behavior, not a bug: a no-op logout is harmless.
  test('validate logout with an unknown refresh token still succeeds', async ({ request }) => {
    const response = await sendLogoutRequest(request, { refreshToken: 'totally-made-up-token-xyz' });
    await assertLogoutSuccess(response);
  });

});
