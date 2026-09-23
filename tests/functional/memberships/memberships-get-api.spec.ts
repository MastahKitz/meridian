import { test } from '@playwright/test';
import { generateAccessToken } from '../auth/login/login-api.flow';
import { getTenantId } from '../utils/seed.utils';
import {
  ownerLoginBody,
  adminLoginBody,
  memberLoginBody,
  viewerLoginBody,
  billingLoginBody,
} from '../auth/login/login-api.data';
import { sendGetMembershipsRequest } from './memberships-api.actions';
import { assertGetMembershipsSuccess } from './memberships-api.assertions';
import { acmeMembers, northwindMembers } from './memberships-api.data';

test.describe('memberships api - get', { tag: ['@memberships', '@api'] }, () => {

  // docs/rbac-matrix.md: "List members" is allowed for every role — no
  // @Roles(...) on memberships.controller.ts's GET handler.
  test('validate owner user can list members', async ({ request }) => {
    const ownerToken = await generateAccessToken(request, ownerLoginBody);
    const response = await sendGetMembershipsRequest(request, ownerToken, getTenantId('acme'));
    await assertGetMembershipsSuccess(response, acmeMembers);
  });

  test('validate admin user can list members', async ({ request }) => {
    const adminToken = await generateAccessToken(request, adminLoginBody);
    const response = await sendGetMembershipsRequest(request, adminToken, getTenantId('acme'));
    await assertGetMembershipsSuccess(response, acmeMembers);
  });

  test('validate member user can list members', async ({ request }) => {
    const memberToken = await generateAccessToken(request, memberLoginBody);
    const response = await sendGetMembershipsRequest(request, memberToken, getTenantId('acme'));
    await assertGetMembershipsSuccess(response, acmeMembers);
  });

  test('validate viewer user can list members', async ({ request }) => {
    const viewerToken = await generateAccessToken(request, viewerLoginBody);
    const response = await sendGetMembershipsRequest(request, viewerToken, getTenantId('acme'));
    await assertGetMembershipsSuccess(response, acmeMembers);
  });

  test('validate billing user can list members', async ({ request }) => {
    const billingToken = await generateAccessToken(request, billingLoginBody);
    const response = await sendGetMembershipsRequest(request, billingToken, getTenantId('acme'));
    await assertGetMembershipsSuccess(response, acmeMembers);
  });

  test('validate member user can list members under different tenant id', async ({ request }) => {
    const memberToken = await generateAccessToken(request, memberLoginBody);
    const response = await sendGetMembershipsRequest(request, memberToken, getTenantId('northwind'));
    await assertGetMembershipsSuccess(response, northwindMembers);
  });

});
