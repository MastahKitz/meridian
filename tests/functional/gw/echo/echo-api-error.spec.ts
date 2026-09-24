import { test } from '@playwright/test';
import { GW_MUTATING_SCOPE_READ_API_KEY } from '../gw-api.data';
import { sendEchoRequest } from './echo-api.actions';
import { assertScopeForbiddenError } from '../gw-api.assertions';

test.describe('gw echo api - errors', { tag: ['@gw', '@echo', '@api', '@error'] }, () => {

  test('validate a read-only-scoped key cannot write via echo', async ({ request }) => {
    const response = await sendEchoRequest(request, GW_MUTATING_SCOPE_READ_API_KEY);
    await assertScopeForbiddenError(response, 'write');
  });

});
