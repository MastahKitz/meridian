import { test } from '@playwright/test';
import { withHookRequestContext } from '../utils/api.utils';
import { generateAccessToken } from '../auth/login/login-api.flow';
import { getTenantId } from '../utils/seed.utils';
import { ownerLoginBody } from '../auth/login/login-api.data';
import { sendMembershipsListRequest } from './memberships-api.actions';
import {
  assertInvalidTokenError,
  assertMissingTokenError,
  assertMissingTenantIdError,
  assertNotMemberOfTenantError,
} from '../auth/auth-api.assertions';

test.describe('memberships api - list errors', { tag: ['@memberships', '@api', '@error'] }, () => {
  let ownerToken: string;

  test.beforeAll(async ({ playwright }) => {
    await withHookRequestContext(playwright, async (request) => {
      ownerToken = await generateAccessToken(request, ownerLoginBody);
    });
  });

  test('validate members cannot be listed with an invalid access token', async ({ request }) => {
    const response = await sendMembershipsListRequest(request, 'not-a-real-token', getTenantId('acme'));
    await assertInvalidTokenError(response);
  });

  test('validate a user cannot list members of a tenant they are not a member of', async ({ request }) => {
    const response = await sendMembershipsListRequest(request, ownerToken, getTenantId('northwind'));
    await assertNotMemberOfTenantError(response);
  });

  test('validate members cannot be listed without an access token', async ({ request }) => {
    const response = await sendMembershipsListRequest(request, undefined, getTenantId('acme'));
    await assertMissingTokenError(response);
  });

  test('validate members cannot be listed without a tenant id', async ({ request }) => {
    const response = await sendMembershipsListRequest(request, ownerToken);
    await assertMissingTenantIdError(response);
  });

});
