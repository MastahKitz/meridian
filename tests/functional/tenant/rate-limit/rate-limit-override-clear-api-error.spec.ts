import { test } from '@playwright/test';
import { withHookRequestContext } from '../../utils/api.utils';
import { generateAccessToken } from '../../auth/login/login-api.flow';
import { getTenantId } from '../../utils/seed.utils';
import {
  rateLimitMutatingOwnerLoginBody,
  rateLimitMutatingAdminLoginBody,
  rateLimitMutatingMemberLoginBody,
  rateLimitMutatingViewerLoginBody,
  rateLimitMutatingBillingLoginBody,
} from '../../auth/login/login-api.data';
import { sendRateLimitOverrideClearRequest } from './rate-limit-api.actions';
import { assertRequiresOwnerError } from './rate-limit-api.assertions';
import {
  assertInvalidTokenError,
  assertMissingTokenError,
  assertMissingTenantIdError,
  assertNotMemberOfTenantError,
} from '../../auth/auth-api.assertions';

test.describe('rate limit override clear api - errors', { tag: ['@tenant', '@rate-limit', '@api', '@error'] }, () => {
  let ownerToken: string;
  let adminToken: string;
  let memberToken: string;
  let viewerToken: string;
  let billingToken: string;

  test.beforeAll(async ({ playwright }) => {
    await withHookRequestContext(playwright, async (request) => {
      ownerToken = await generateAccessToken(request, rateLimitMutatingOwnerLoginBody);
      adminToken = await generateAccessToken(request, rateLimitMutatingAdminLoginBody);
      memberToken = await generateAccessToken(request, rateLimitMutatingMemberLoginBody);
      viewerToken = await generateAccessToken(request, rateLimitMutatingViewerLoginBody);
      billingToken = await generateAccessToken(request, rateLimitMutatingBillingLoginBody);
    });
  });

  test('validate a rate limit override cannot be cleared with an invalid access token', async ({ request }) => {
    const response = await sendRateLimitOverrideClearRequest(request, 'not-a-real-token', getTenantId('rate-limit-mutating-clear-free'));
    await assertInvalidTokenError(response);
  });

  test('validate a rate limit override cannot be cleared for a tenant the actor is not a member of', async ({ request }) => {
    const response = await sendRateLimitOverrideClearRequest(request, ownerToken, getTenantId('northwind'));
    await assertNotMemberOfTenantError(response);
  });

  test('validate a rate limit override cannot be cleared without an access token', async ({ request }) => {
    const response = await sendRateLimitOverrideClearRequest(request, undefined, getTenantId('rate-limit-mutating-clear-free'));
    await assertMissingTokenError(response);
  });

  test('validate a rate limit override cannot be cleared without a tenant id', async ({ request }) => {
    const response = await sendRateLimitOverrideClearRequest(request, ownerToken, undefined);
    await assertMissingTenantIdError(response);
  });

  test('validate admin user cannot clear a rate limit override', async ({ request }) => {
    const response = await sendRateLimitOverrideClearRequest(request, adminToken, getTenantId('rate-limit-mutating-clear-free'));
    await assertRequiresOwnerError(response);
  });

  test('validate member user cannot clear a rate limit override', async ({ request }) => {
    const response = await sendRateLimitOverrideClearRequest(request, memberToken, getTenantId('rate-limit-mutating-clear-free'));
    await assertRequiresOwnerError(response);
  });

  test('validate viewer user cannot clear a rate limit override', async ({ request }) => {
    const response = await sendRateLimitOverrideClearRequest(request, viewerToken, getTenantId('rate-limit-mutating-clear-free'));
    await assertRequiresOwnerError(response);
  });

  test('validate billing user cannot clear a rate limit override', async ({ request }) => {
    const response = await sendRateLimitOverrideClearRequest(request, billingToken, getTenantId('rate-limit-mutating-clear-free'));
    await assertRequiresOwnerError(response);
  });

});
