import { APIRequestContext } from '@playwright/test';
import { sendTenantDetailsRequest } from './tenant-api.actions';
import { assertTenantDetailsSuccess } from './tenant-api.assertions';
import { ExpectedTenantDetails } from './tenant-api.data';

export async function assertTenantDetailsCorrect(
  request: APIRequestContext,
  accessToken: string,
  tenantId: string,
  expected: ExpectedTenantDetails,
): Promise<void> {
  const response = await sendTenantDetailsRequest(request, accessToken, tenantId);
  await assertTenantDetailsSuccess(response, expected);
}
