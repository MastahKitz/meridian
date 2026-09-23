import { test } from '@playwright/test';
import { withHookRequestContext } from '../utils/api.utils';
import { generateAccessToken } from '../auth/login/login-api.flow';
import { getTenantId } from '../utils/seed.utils';
import { ownerLoginBody } from '../auth/login/login-api.data';
import { sendGetTenantRequest } from './tenant-get-api.actions';
import {
  assertInvalidTokenError,
  assertMissingTokenError,
  assertMissingTenantIdError,
  assertNotMemberOfTenantError,
} from './tenant-get-api.assertions';

test.describe('tenant api - get errors', { tag: ['@tenant', '@api', '@error'] }, () => {
  let ownerToken: string;

  test.beforeAll(async ({ playwright }) => {
    await withHookRequestContext(playwright, async (request) => {
      ownerToken = await generateAccessToken(request, ownerLoginBody);
    });
  });

  test('validate tenant settings cannot be viewed with an invalid access token', async ({ request }) => {
    const response = await sendGetTenantRequest(request, 'not-a-real-token', getTenantId('acme'));
    await assertInvalidTokenError(response);
  });

  test('validate tenant settings cannot be viewed without an access token', async ({ request }) => {
    const response = await sendGetTenantRequest(request, undefined, getTenantId('acme'));
    await assertMissingTokenError(response);
  });

  test('validate tenant settings cannot be viewed without a tenant id', async ({ request }) => {
    const response = await sendGetTenantRequest(request, ownerToken);
    await assertMissingTenantIdError(response);
  });

  test('validate a user cannot view a tenant they are not a member of', async ({ request }) => {
    const response = await sendGetTenantRequest(request, ownerToken, getTenantId('northwind'));
    await assertNotMemberOfTenantError(response);
  });

});
