import { test } from '@playwright/test';
import { withHookRequestContext } from '../utils/api.utils';
import { generateAccessToken } from '../auth/login/login-api.flow';
import { getTenantId } from '../utils/seed.utils';
import {
  keysMutatingOwnerLoginBody,
  keysMutatingViewerLoginBody,
  keysMutatingBillingLoginBody,
} from '../auth/login/login-api.data';
import { sendKeyCreateRequest } from './keys-api.actions';
import { assertInvalidScopeError, assertRequiresOwnerAdminOrMemberError } from './keys-api.assertions';
import {
  assertInvalidTokenError,
  assertMissingTokenError,
  assertMissingTenantIdError,
  assertNotMemberOfTenantError,
} from '../auth/auth-api.assertions';

test.describe('keys api - create errors', { tag: ['@keys', '@api', '@error', '@mutating'] }, () => {
  let ownerToken: string;
  let viewerToken: string;
  let billingToken: string;

  test.beforeAll(async ({ playwright }) => {
    await withHookRequestContext(playwright, async (request) => {
      ownerToken = await generateAccessToken(request, keysMutatingOwnerLoginBody);
      viewerToken = await generateAccessToken(request, keysMutatingViewerLoginBody);
      billingToken = await generateAccessToken(request, keysMutatingBillingLoginBody);
    });
  });

  test('validate a key cannot be created with an invalid access token', async ({ request }) => {
    const response = await sendKeyCreateRequest(request, 'not-a-real-token', getTenantId('keys-mutating'), { name: 'Bad token' });
    await assertInvalidTokenError(response);
  });

  test('validate a key cannot be created for a tenant the actor is not a member of', async ({ request }) => {
    const response = await sendKeyCreateRequest(request, ownerToken, getTenantId('northwind'), { name: 'Wrong tenant' });
    await assertNotMemberOfTenantError(response);
  });

  test('validate a key cannot be created without an access token', async ({ request }) => {
    const response = await sendKeyCreateRequest(request, undefined, getTenantId('keys-mutating'), { name: 'No token' });
    await assertMissingTokenError(response);
  });

  test('validate a key cannot be created without a tenant id', async ({ request }) => {
    const response = await sendKeyCreateRequest(request, ownerToken, undefined, { name: 'No tenant' });
    await assertMissingTenantIdError(response);
  });

  test('validate viewer user cannot create a key', async ({ request }) => {
    const response = await sendKeyCreateRequest(request, viewerToken, getTenantId('keys-mutating'), { name: 'Viewer attempt' });
    await assertRequiresOwnerAdminOrMemberError(response);
  });

  test('validate billing user cannot create a key', async ({ request }) => {
    const response = await sendKeyCreateRequest(request, billingToken, getTenantId('keys-mutating'), { name: 'Billing attempt' });
    await assertRequiresOwnerAdminOrMemberError(response);
  });

  test('validate a key cannot be created with an invalid scope value', async ({ request }) => {
    const response = await sendKeyCreateRequest(request, ownerToken, getTenantId('keys-mutating'), { name: 'Bad scope', scopes: ['invalid'] });
    await assertInvalidScopeError(response);
  });

});
