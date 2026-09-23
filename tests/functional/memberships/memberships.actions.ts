import { Page, expect } from '@playwright/test';

export async function goToMembersPage(page: Page) {
  await page.getByRole('link', { name: 'Members' }).click();
  await expect(page).toHaveURL(/\/dashboard\/members$/);
  await page.waitForLoadState('networkidle');
}
