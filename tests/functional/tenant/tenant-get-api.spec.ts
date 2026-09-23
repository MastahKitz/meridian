import { test } from '@playwright/test';
import { generateAccessToken } from '../auth/login/login-api.flow';
import { getTenantId } from '../utils/seed.utils';
import {
  ownerLoginBody,
  adminLoginBody,
  memberLoginBody,
  viewerLoginBody,
  billingLoginBody,
  northwindOwnerLoginBody,
  sakuraOwnerLoginBody,
} from '../auth/login/login-api.data';
import { sendGetTenantRequest } from './tenant-api.actions';
import { assertGetTenantSuccess } from './tenant-api.assertions';
import { acmeTenantDetails, northwindTenantDetails, sakuraTenantDetails } from './tenant-api.data';

test.describe('tenant api - get', { tag: ['@tenant', '@api'] }, () => {

  test('validate owner user can view tenant settings', async ({ request }) => {
    const ownerToken = await generateAccessToken(request, ownerLoginBody);
    const response = await sendGetTenantRequest(request, ownerToken, getTenantId('acme'));
    await assertGetTenantSuccess(response, acmeTenantDetails);
  });

  test('validate admin user can view tenant settings', async ({ request }) => {
    const adminToken = await generateAccessToken(request, adminLoginBody);
    const response = await sendGetTenantRequest(request, adminToken, getTenantId('acme'));
    await assertGetTenantSuccess(response, acmeTenantDetails);
  });

  test('validate member user can view tenant settings', async ({ request }) => {
    const memberToken = await generateAccessToken(request, memberLoginBody);
    const response = await sendGetTenantRequest(request, memberToken, getTenantId('acme'));
    await assertGetTenantSuccess(response, acmeTenantDetails);
  });

  test('validate viewer user can view tenant settings', async ({ request }) => {
    const viewerToken = await generateAccessToken(request, viewerLoginBody);
    const response = await sendGetTenantRequest(request, viewerToken, getTenantId('acme'));
    await assertGetTenantSuccess(response, acmeTenantDetails);
  });

  test('validate billing user can view tenant settings', async ({ request }) => {
    const billingToken = await generateAccessToken(request, billingLoginBody);
    const response = await sendGetTenantRequest(request, billingToken, getTenantId('acme'));
    await assertGetTenantSuccess(response, acmeTenantDetails);
  });

  test('validate member user can view tenant settings under different tenant id it belongs to', async ({ request }) => {
    const memberToken = await generateAccessToken(request, memberLoginBody);
    const response = await sendGetTenantRequest(request, memberToken, getTenantId('northwind'));
    await assertGetTenantSuccess(response, northwindTenantDetails);
  });

  test('validate growth plan tenant sees growth plan limits', async ({ request }) => {
    const northwindOwnerToken = await generateAccessToken(request, northwindOwnerLoginBody);
    const response = await sendGetTenantRequest(request, northwindOwnerToken, getTenantId('northwind'));
    await assertGetTenantSuccess(response, northwindTenantDetails);
  });

  test('validate scale plan tenant sees scale plan limits', async ({ request }) => {
    const sakuraOwnerToken = await generateAccessToken(request, sakuraOwnerLoginBody);
    const response = await sendGetTenantRequest(request, sakuraOwnerToken, getTenantId('sakura'));
    await assertGetTenantSuccess(response, sakuraTenantDetails);
  });

});
