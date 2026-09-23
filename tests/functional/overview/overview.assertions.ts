import { Page, expect } from '@playwright/test';
import { ExpectedTenantDetails } from '../tenant/tenant-api.data';
import { ExpectedUsageDetails } from './overview.data';

export async function assertTenantSummaryVisible(page: Page, tenant: ExpectedTenantDetails, usage: ExpectedUsageDetails) {
  await expect.soft(page.getByRole('heading', { level: 1 })).toHaveText(tenant.name);
  await expect.soft(page.getByRole('row', { name: /Tier/ })).toHaveText(`Tier${tenant.plan}`);
  await expect.soft(page.getByRole('row', { name: /Rate limit/ })).toHaveText(`Rate limit${tenant.limits.rateLimitPerMinute} req/min`);
  await expect.soft(page.getByRole('row', { name: /Monthly quota/ })).toHaveText(`Monthly quota${tenant.limits.monthlyQuota.toLocaleString()}`);
  await expect.soft(page.getByRole('row', { name: /Timezone/ })).toHaveText(`Timezone${tenant.timezone}`);
  await expect.soft(page.getByRole('row', { name: /Requests \(30d\)/ })).toHaveText(`Requests (30d)${usage.requests.toLocaleString()}`);
}

const QUOTA_WARNING_TEXT = /^You have used \d+% of your monthly quota\. Requests beyond the quota are billed as overage\.$/;

export async function assertQuotaWarningHidden(page: Page) {
  await expect.soft(page.getByText(QUOTA_WARNING_TEXT)).toHaveCount(0);
}

export async function assertQuotaWarningVisible(page: Page) {
  await expect.soft(page.getByText(QUOTA_WARNING_TEXT)).toBeVisible();
}
