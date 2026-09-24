import { test } from '@playwright/test';
import { GW_MUTATING_SCOPE_READ_API_KEY } from '../gw-api.data';
import { sendTransformRequest } from './transform-api.actions';
import { assertScopeForbiddenError } from '../gw-api.assertions';

test.describe('gw transform api - errors', { tag: ['@gw', '@transform', '@api', '@error'] }, () => {

  test('validate a read-only-scoped key cannot write via transform', async ({ request }) => {
    const response = await sendTransformRequest(request, GW_MUTATING_SCOPE_READ_API_KEY);
    await assertScopeForbiddenError(response, 'write');
  });

});
