import { Page, expect } from '@playwright/test';
import { ExpectedMember } from './memberships-api.data';

export async function assertMembersListVisible(page: Page, expected: ExpectedMember[]) {
  await expect.soft(page.getByRole('row')).toHaveCount(expected.length + 1); // +1 for the header row

  for (const member of expected) {
    const row = page.getByRole('row').filter({ has: page.getByRole('cell', { name: member.email, exact: true }) });
    await expect.soft(row.getByRole('combobox')).toHaveValue(member.role);
  }
}
