import { test } from '@playwright/test';
import { sendLoginRequest } from './login-api.actions';
import { ownerLoginBody } from './login-api.data';
import {
  assertEmailAndPasswordRequiredError,
  assertInvalidCredentialsError,
} from './login-api.assertions';

test.describe('login api - errors', { tag: ['@auth', '@login', '@api', '@error'] }, () => {

  test('validate owner user cannot login with an invalid email', async ({ request }) => {
    const response = await sendLoginRequest(request, { ...ownerLoginBody, email: 'not-a-real-email' });
    await assertInvalidCredentialsError(response);
  });

  test('validate owner user cannot login with an invalid password', async ({ request }) => {
    const response = await sendLoginRequest(request, { ...ownerLoginBody, password: 'WrongPassword123!' });
    await assertInvalidCredentialsError(response);
  });

  test('validate owner user cannot login with a blank email', async ({ request }) => {
    const response = await sendLoginRequest(request, { ...ownerLoginBody, email: '' });
    await assertEmailAndPasswordRequiredError(response);
  });

  test('validate owner user cannot login with a blank password', async ({ request }) => {
    const response = await sendLoginRequest(request, { ...ownerLoginBody, password: '' });
    await assertEmailAndPasswordRequiredError(response);
  });

});
