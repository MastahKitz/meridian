import { test } from '@playwright/test';
import { withHookRequestContext } from '../utils/api.utils';
import { generateAccessToken } from '../auth/login/login-api.flow';
import { getTenantId } from '../utils/seed.utils';
import {
  ownerLoginBody,
  adminLoginBody,
  memberLoginBody,
  viewerLoginBody,
  billingLoginBody,
} from '../auth/login/login-api.data';
import { sendCreateMembershipRequest } from './memberships-api.actions';
import { randomEmail } from './memberships-api.data';
import {
  assertEmailRequiredError,
  assertInvalidRoleError,
  assertRequiresOwnerOrAdminError,
  assertCannotGrantHigherRoleError,
} from './memberships-api.assertions';
import {
  assertInvalidTokenError,
  assertMissingTokenError,
  assertMissingTenantIdError,
  assertNotMemberOfTenantError,
} from '../auth/auth-api.assertions';

test.describe('memberships api - create errors', { tag: ['@memberships', '@api', '@error', '@mutating'] }, () => {
  let ownerToken: string;
  let adminToken: string;
  let memberToken: string;
  let viewerToken: string;
  let billingToken: string;

  test.beforeAll(async ({ playwright }) => {
    await withHookRequestContext(playwright, async (request) => {
      ownerToken = await generateAccessToken(request, ownerLoginBody);
      adminToken = await generateAccessToken(request, adminLoginBody);
      memberToken = await generateAccessToken(request, memberLoginBody);
      viewerToken = await generateAccessToken(request, viewerLoginBody);
      billingToken = await generateAccessToken(request, billingLoginBody);
    });
  });

  test('validate a new member cannot be invited with an invalid access token', async ({ request }) => {
    const response = await sendCreateMembershipRequest(request, 'not-a-real-token', getTenantId('acme'), { email: randomEmail() });
    await assertInvalidTokenError(response);
  });

  test('validate a new member cannot be invited to a tenant the actor is not a member of', async ({ request }) => {
    const response = await sendCreateMembershipRequest(request, ownerToken, getTenantId('northwind'), { email: randomEmail() });
    await assertNotMemberOfTenantError(response);
  });

  test('validate a new member cannot be invited without an access token', async ({ request }) => {
    const response = await sendCreateMembershipRequest(request, undefined, getTenantId('acme'), { email: randomEmail() });
    await assertMissingTokenError(response);
  });

  test('validate a new member cannot be invited without a tenant id', async ({ request }) => {
    const response = await sendCreateMembershipRequest(request, ownerToken, undefined, { email: randomEmail() });
    await assertMissingTenantIdError(response);
  });

  // docs/rbac-matrix.md: "Invite members" is OWNER/ADMIN only.
  test('validate member user cannot invite a new member', async ({ request }) => {
    const response = await sendCreateMembershipRequest(request, memberToken, getTenantId('acme'), { email: randomEmail() });
    await assertRequiresOwnerOrAdminError(response);
  });

  test('validate viewer user cannot invite a new member', async ({ request }) => {
    const response = await sendCreateMembershipRequest(request, viewerToken, getTenantId('acme'), { email: randomEmail() });
    await assertRequiresOwnerOrAdminError(response);
  });

  test('validate billing user cannot invite a new member', async ({ request }) => {
    const response = await sendCreateMembershipRequest(request, billingToken, getTenantId('acme'), { email: randomEmail() });
    await assertRequiresOwnerOrAdminError(response);
  });

  test('validate a new member cannot be invited with an invalid role', async ({ request }) => {
    const response = await sendCreateMembershipRequest(request, ownerToken, getTenantId('acme'), {
      email: randomEmail(),
      role: 'SUPERADMIN',
    });
    await assertInvalidRoleError(response);
  });

  test('validate a new member cannot be invited with a blank email', async ({ request }) => {
    const response = await sendCreateMembershipRequest(request, ownerToken, getTenantId('acme'), { email: '' });
    await assertEmailRequiredError(response);
  });

  // ASSUMPTION — see assertCannotGrantHigherRoleError's comment: this encodes
  // docs/rbac-matrix.md's escalation rule (an ADMIN may not grant a role
  // higher than their own) and is expected to currently FAIL, since invite()
  // doesn't enforce it despite rbac.ts's ROLE_RANK/atLeast existing for
  // exactly this purpose. Kept as a documented, known-failing assumption.
  test('validate admin user cannot invite a new member as owner', async ({ request }) => {
    const response = await sendCreateMembershipRequest(request, adminToken, getTenantId('acme'), {
      email: randomEmail(),
      role: 'OWNER',
    });
    await assertCannotGrantHigherRoleError(response);
  });

});
