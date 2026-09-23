import { Page, expect } from '@playwright/test';
import { OverviewSummary } from './overview.data';

export async function assertTenantSummaryVisible(page: Page, expected: OverviewSummary) {
  await expect.soft(page.getByRole('heading', { level: 1 })).toHaveText(expected.tenantName);
  await expect.soft(page.getByRole('row', { name: /Tier/ })).toHaveText(`Tier${expected.plan}`);
  await expect.soft(page.getByRole('row', { name: /Rate limit/ })).toHaveText(`Rate limit${expected.rateLimitPerMinute} req/min`);
  await expect.soft(page.getByRole('row', { name: /Monthly quota/ })).toHaveText(`Monthly quota${expected.monthlyQuota.toLocaleString()}`);
  await expect.soft(page.getByRole('row', { name: /Timezone/ })).toHaveText(`Timezone${expected.timezone}`);
  await expect.soft(page.getByRole('row', { name: /Requests \(30d\)/ })).toHaveText(`Requests (30d)${expected.requests.toLocaleString()}`);
}

const QUOTA_WARNING_TEXT = /^You have used \d+% of your monthly quota\. Requests beyond the quota are billed as overage\.$/;

export async function assertQuotaWarningHidden(page: Page) {
  await expect.soft(page.getByText(QUOTA_WARNING_TEXT)).toHaveCount(0);
}

export async function assertQuotaWarningVisible(page: Page) {
  await expect.soft(page.getByText(QUOTA_WARNING_TEXT)).toBeVisible();
}
