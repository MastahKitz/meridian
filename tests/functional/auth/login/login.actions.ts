import { Page, expect } from '@playwright/test';
import { environment } from '../../config/environments';

export async function goToLogin(page: Page) {
  await page.goto(environment.webBaseUrl);
  await expect(page).toHaveURL(/\/login$/);
}

export async function fillLoginForm(page: Page, email: string, password: string) {
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
}

export async function submitLoginForm(page: Page) {
  await page.getByRole('button', { name: 'Sign in' }).click();
}

export async function waitForOverviewPage(page: Page) {
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
  await page.waitForLoadState('networkidle');
}
