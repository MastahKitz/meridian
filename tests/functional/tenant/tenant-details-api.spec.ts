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
import { sendTenantDetailsRequest } from './tenant-api.actions';
import { assertTenantDetailsSuccess } from './tenant-api.assertions';
import { acmeTenantDetails, northwindTenantDetails, sakuraTenantDetails } from './tenant-api.data';

test.describe('tenant api - details', { tag: ['@tenant', '@api'] }, () => {

  test('validate owner user can view tenant settings', async ({ request }) => {
    const ownerToken = await generateAccessToken(request, ownerLoginBody);
    const response = await sendTenantDetailsRequest(request, ownerToken, getTenantId('acme'));
    await assertTenantDetailsSuccess(response, acmeTenantDetails);
  });

  test('validate admin user can view tenant settings', async ({ request }) => {
    const adminToken = await generateAccessToken(request, adminLoginBody);
    const response = await sendTenantDetailsRequest(request, adminToken, getTenantId('acme'));
    await assertTenantDetailsSuccess(response, acmeTenantDetails);
  });

  test('validate member user can view tenant settings', async ({ request }) => {
    const memberToken = await generateAccessToken(request, memberLoginBody);
    const response = await sendTenantDetailsRequest(request, memberToken, getTenantId('acme'));
    await assertTenantDetailsSuccess(response, acmeTenantDetails);
  });

  test('validate viewer user can view tenant settings', async ({ request }) => {
    const viewerToken = await generateAccessToken(request, viewerLoginBody);
    const response = await sendTenantDetailsRequest(request, viewerToken, getTenantId('acme'));
    await assertTenantDetailsSuccess(response, acmeTenantDetails);
  });

  test('validate billing user can view tenant settings', async ({ request }) => {
    const billingToken = await generateAccessToken(request, billingLoginBody);
    const response = await sendTenantDetailsRequest(request, billingToken, getTenantId('acme'));
    await assertTenantDetailsSuccess(response, acmeTenantDetails);
  });

  test('validate member user can view tenant settings under different tenant id it belongs to', async ({ request }) => {
    const memberToken = await generateAccessToken(request, memberLoginBody);
    const response = await sendTenantDetailsRequest(request, memberToken, getTenantId('northwind'));
    await assertTenantDetailsSuccess(response, northwindTenantDetails);
  });

  test('validate growth plan tenant sees growth plan limits', async ({ request }) => {
    const northwindOwnerToken = await generateAccessToken(request, northwindOwnerLoginBody);
    const response = await sendTenantDetailsRequest(request, northwindOwnerToken, getTenantId('northwind'));
    await assertTenantDetailsSuccess(response, northwindTenantDetails);
  });

  test('validate scale plan tenant sees scale plan limits', async ({ request }) => {
    const sakuraOwnerToken = await generateAccessToken(request, sakuraOwnerLoginBody);
    const response = await sendTenantDetailsRequest(request, sakuraOwnerToken, getTenantId('sakura'));
    await assertTenantDetailsSuccess(response, sakuraTenantDetails);
  });

});
