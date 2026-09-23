import { test } from '@playwright/test';
import { withHookRequestContext } from '../utils/api.utils';
import { generateAccessToken, assertCanLogin } from '../auth/login/login-api.flow';
import { getTenantId } from '../utils/seed.utils';
import { membershipsMutatingOwnerLoginBody, membershipsMutatingAdminLoginBody } from '../auth/login/login-api.data';
import { sendMembershipCreateRequest } from './memberships-api.actions';
import { assertMembershipCreateSuccess } from './memberships-api.assertions';
import { randomEmail, DEFAULT_INVITE_PASSWORD } from './memberships-api.data';

test.describe('memberships api - create', { tag: ['@memberships', '@api', '@mutating'] }, () => {
  let ownerToken: string;
  let adminToken: string;

  test.beforeAll(async ({ playwright }) => {
    await withHookRequestContext(playwright, async (request) => {
      ownerToken = await generateAccessToken(request, membershipsMutatingOwnerLoginBody);
      adminToken = await generateAccessToken(request, membershipsMutatingAdminLoginBody);
    });
  });

  // docs/rbac-matrix.md / rbac.ts's ROLE_RANK: OWNER outranks every role, so
  // an OWNER may grant any of the 5 roles, including another OWNER.
  test('validate owner user can create a new member with role owner', async ({ request }) => {
    const email = randomEmail();
    const response = await sendMembershipCreateRequest(request, ownerToken, getTenantId('memberships-mutating'), { email, role: 'OWNER' });
    await assertMembershipCreateSuccess(response, 'OWNER');

    await assertCanLogin(request, { email, password: DEFAULT_INVITE_PASSWORD }, [
      { name: 'memberships-mutating', slug: 'memberships-mutating', plan: 'FREE', role: 'OWNER' },
    ]);
  });

  test('validate owner user can create a new member with role admin', async ({ request }) => {
    const email = randomEmail();
    const response = await sendMembershipCreateRequest(request, ownerToken, getTenantId('memberships-mutating'), { email, role: 'ADMIN' });
    await assertMembershipCreateSuccess(response, 'ADMIN');

    await assertCanLogin(request, { email, password: DEFAULT_INVITE_PASSWORD }, [
      { name: 'memberships-mutating', slug: 'memberships-mutating', plan: 'FREE', role: 'ADMIN' },
    ]);
  });

  test('validate owner user can create a new member with role member', async ({ request }) => {
    const email = randomEmail();
    const response = await sendMembershipCreateRequest(request, ownerToken, getTenantId('memberships-mutating'), { email, role: 'MEMBER' });
    await assertMembershipCreateSuccess(response, 'MEMBER');

    await assertCanLogin(request, { email, password: DEFAULT_INVITE_PASSWORD }, [
      { name: 'memberships-mutating', slug: 'memberships-mutating', plan: 'FREE', role: 'MEMBER' },
    ]);
  });

  test('validate owner user can create a new member with role viewer', async ({ request }) => {
    const email = randomEmail();
    const response = await sendMembershipCreateRequest(request, ownerToken, getTenantId('memberships-mutating'), { email, role: 'VIEWER' });
    await assertMembershipCreateSuccess(response, 'VIEWER');

    await assertCanLogin(request, { email, password: DEFAULT_INVITE_PASSWORD }, [
      { name: 'memberships-mutating', slug: 'memberships-mutating', plan: 'FREE', role: 'VIEWER' },
    ]);
  });

  test('validate owner user can create a new member with role billing', async ({ request }) => {
    const email = randomEmail();
    const response = await sendMembershipCreateRequest(request, ownerToken, getTenantId('memberships-mutating'), { email, role: 'BILLING' });
    await assertMembershipCreateSuccess(response, 'BILLING');

    await assertCanLogin(request, { email, password: DEFAULT_INVITE_PASSWORD }, [
      { name: 'memberships-mutating', slug: 'memberships-mutating', plan: 'FREE', role: 'BILLING' },
    ]);
  });

  // ADMIN creating a new member as OWNER is the escalation case covered in
  // memberships-create-api-error.spec.ts (an assumption test, since it isn't
  // actually blocked today) — not repeated here.
  test('validate admin user can create a new member with role admin', async ({ request }) => {
    const email = randomEmail();
    const response = await sendMembershipCreateRequest(request, adminToken, getTenantId('memberships-mutating'), { email, role: 'ADMIN' });
    await assertMembershipCreateSuccess(response, 'ADMIN');

    await assertCanLogin(request, { email, password: DEFAULT_INVITE_PASSWORD }, [
      { name: 'memberships-mutating', slug: 'memberships-mutating', plan: 'FREE', role: 'ADMIN' },
    ]);
  });

  test('validate admin user can create a new member with role member', async ({ request }) => {
    const email = randomEmail();
    const response = await sendMembershipCreateRequest(request, adminToken, getTenantId('memberships-mutating'), { email, role: 'MEMBER' });
    await assertMembershipCreateSuccess(response, 'MEMBER');

    await assertCanLogin(request, { email, password: DEFAULT_INVITE_PASSWORD }, [
      { name: 'memberships-mutating', slug: 'memberships-mutating', plan: 'FREE', role: 'MEMBER' },
    ]);
  });

  test('validate admin user can create a new member with role viewer', async ({ request }) => {
    const email = randomEmail();
    const response = await sendMembershipCreateRequest(request, adminToken, getTenantId('memberships-mutating'), { email, role: 'VIEWER' });
    await assertMembershipCreateSuccess(response, 'VIEWER');

    await assertCanLogin(request, { email, password: DEFAULT_INVITE_PASSWORD }, [
      { name: 'memberships-mutating', slug: 'memberships-mutating', plan: 'FREE', role: 'VIEWER' },
    ]);
  });

  test('validate admin user can create a new member with role billing', async ({ request }) => {
    const email = randomEmail();
    const response = await sendMembershipCreateRequest(request, adminToken, getTenantId('memberships-mutating'), { email, role: 'BILLING' });
    await assertMembershipCreateSuccess(response, 'BILLING');

    await assertCanLogin(request, { email, password: DEFAULT_INVITE_PASSWORD }, [
      { name: 'memberships-mutating', slug: 'memberships-mutating', plan: 'FREE', role: 'BILLING' },
    ]);
  });

  test('validate owner user can create a new member with a specified password', async ({ request }) => {
    const email = randomEmail();
    const password = 'CustomPass123!';
    const response = await sendMembershipCreateRequest(request, ownerToken, getTenantId('memberships-mutating'), { email, role: 'MEMBER', password });
    await assertMembershipCreateSuccess(response, 'MEMBER');

    await assertCanLogin(request, { email, password }, [
      { name: 'memberships-mutating', slug: 'memberships-mutating', plan: 'FREE', role: 'MEMBER' },
    ]);
  });

  test('validate a new member defaults to role member when role is not specified', async ({ request }) => {
    const email = randomEmail();
    const response = await sendMembershipCreateRequest(request, ownerToken, getTenantId('memberships-mutating'), { email });
    await assertMembershipCreateSuccess(response, 'MEMBER');

    await assertCanLogin(request, { email, password: DEFAULT_INVITE_PASSWORD }, [
      { name: 'memberships-mutating', slug: 'memberships-mutating', plan: 'FREE', role: 'MEMBER' },
    ]);
  });

});
