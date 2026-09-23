import { Page } from '@playwright/test';
import { goToLogin, fillLoginForm, submitLoginForm, waitForOverviewPage } from './login.actions';
import { LoginRequestBody } from './login-api.data';

export async function loginViaUi(page: Page, body: LoginRequestBody): Promise<void> {
  await goToLogin(page);
  await fillLoginForm(page, body.email, body.password);
  await submitLoginForm(page);
  await waitForOverviewPage(page);
}
