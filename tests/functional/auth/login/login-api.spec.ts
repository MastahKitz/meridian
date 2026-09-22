import { test } from '@playwright/test';
import { sendLoginRequest } from './login-api.actions';
import { assertLoginSuccess } from './login-api.assertions';
import {
  ownerLoginBody,
  adminLoginBody,
  memberLoginBody,
  viewerLoginBody,
  billingLoginBody,
} from './login-api.data';

test.describe('login api', { tag: ['@login', '@api'] }, () => {

  test('validate owner can login', async ({ request }) => {
    const response = await sendLoginRequest(request, ownerLoginBody);
    await assertLoginSuccess(response, {
      email: ownerLoginBody.email,
      tenants: [{ name: 'Acme Corp', slug: 'acme', plan: 'FREE', role: 'OWNER' }],
    });
  });

  test('validate admin can login', async ({ request }) => {
    const response = await sendLoginRequest(request, adminLoginBody);
    await assertLoginSuccess(response, {
      email: adminLoginBody.email,
      tenants: [{ name: 'Acme Corp', slug: 'acme', plan: 'FREE', role: 'ADMIN' }],
    });
  });

  // member@acme.test is the deliberate cross-tenant seed case — also VIEWER in
  // Northwind, per README — so it holds two memberships, not one.
  test('validate member can login', async ({ request }) => {
    const response = await sendLoginRequest(request, memberLoginBody);
    await assertLoginSuccess(response, {
      email: memberLoginBody.email,
      tenants: [
        { name: 'Acme Corp', slug: 'acme', plan: 'FREE', role: 'MEMBER' },
        { name: 'Northwind Traders', slug: 'northwind', plan: 'GROWTH', role: 'VIEWER' },
      ],
    });
  });

  test('validate viewer can login', async ({ request }) => {
    const response = await sendLoginRequest(request, viewerLoginBody);
    await assertLoginSuccess(response, {
      email: viewerLoginBody.email,
      tenants: [{ name: 'Acme Corp', slug: 'acme', plan: 'FREE', role: 'VIEWER' }],
    });
  });

  test('validate billing can login', async ({ request }) => {
    const response = await sendLoginRequest(request, billingLoginBody);
    await assertLoginSuccess(response, {
      email: billingLoginBody.email,
      tenants: [{ name: 'Acme Corp', slug: 'acme', plan: 'FREE', role: 'BILLING' }],
    });
  });

});
