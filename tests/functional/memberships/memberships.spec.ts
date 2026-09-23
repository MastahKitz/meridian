import { test } from '@playwright/test';
import { ownerLoginBody } from '../auth/login/login-api.data';
import { loginViaUi } from '../auth/login/login.flow';
import { goToMembersPage } from './memberships.actions';
import { assertMembersListVisible } from './memberships.assertions';
import { acmeMembers } from './memberships-api.data';

test.describe('memberships', { tag: ['@memberships', '@ui'] }, () => {

  test('validate owner user sees the tenant members list on the members page', async ({ page }) => {
    await loginViaUi(page, ownerLoginBody);
    await goToMembersPage(page);
    await assertMembersListVisible(page, acmeMembers);
  });

});
