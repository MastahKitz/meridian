import { test } from '@playwright/test';
import { ownerLoginBody } from '../auth/login/login-api.data';
import { loginViaUi } from '../auth/login/login.flow';
import { assertTenantSummaryVisible, assertQuotaWarningHidden } from './overview.assertions';
import { acmeOverview } from './overview.data';

test.describe('overview', { tag: ['@overview', '@ui'] }, () => {

  test('validate owner user sees their tenant summary on the overview page', async ({ page }) => {
    await loginViaUi(page, ownerLoginBody);
    await assertTenantSummaryVisible(page, acmeOverview);

    await assertQuotaWarningHidden(page);
  });

});
