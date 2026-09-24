import { BillingService } from './billing.service';
import { DbService } from '../db/db.service';
import { PLANS, PlanTier } from '../common/plans';

function createMockDb() {
  return { query: jest.fn(), one: jest.fn() };
}

describe('BillingService.previewInvoice', () => {
  it('reports zero overage when usage is under the plan quota', async () => {
    const db = createMockDb();
    db.one.mockResolvedValueOnce({ plan: 'FREE' }).mockResolvedValueOnce({ used: '5000' });

    const service = new BillingService(db as unknown as DbService);
    const result = await service.previewInvoice('tenant-1');

    expect(result).toEqual({
      plan: 'FREE',
      quota: PLANS.FREE.monthlyQuota,
      used: 5000,
      overageRequests: 0,
      overageAmount: 0,
      total: 0,
    });
  });

  it('charges only for requests past the quota, at the plan\'s overage rate', async () => {
    const db = createMockDb();
    const used = PLANS.FREE.monthlyQuota + 2000;
    db.one.mockResolvedValueOnce({ plan: 'FREE' }).mockResolvedValueOnce({ used: String(used) });

    const service = new BillingService(db as unknown as DbService);
    const result = await service.previewInvoice('tenant-1');

    expect(result.overageRequests).toBe(2000);
    expect(result.overageAmount).toBeCloseTo(2000 * PLANS.FREE.overageRatePerRequest);
    expect(result.total).toBe(result.overageAmount);
  });

  it('reports zero overage exactly at the quota boundary', async () => {
    const db = createMockDb();
    db.one.mockResolvedValueOnce({ plan: 'GROWTH' }).mockResolvedValueOnce({ used: String(PLANS.GROWTH.monthlyQuota) });

    const service = new BillingService(db as unknown as DbService);
    const result = await service.previewInvoice('tenant-1');

    expect(result.overageRequests).toBe(0);
    expect(result.overageAmount).toBe(0);
  });

  it('uses the correct quota and overage rate for each plan tier', async () => {
    for (const tier of Object.keys(PLANS) as PlanTier[]) {
      const db = createMockDb();
      const used = PLANS[tier].monthlyQuota + 100;
      db.one.mockResolvedValueOnce({ plan: tier }).mockResolvedValueOnce({ used: String(used) });

      const service = new BillingService(db as unknown as DbService);
      const result = await service.previewInvoice('tenant-1');

      expect(result.quota).toBe(PLANS[tier].monthlyQuota);
      expect(result.overageRequests).toBe(100);
      expect(result.overageAmount).toBeCloseTo(100 * PLANS[tier].overageRatePerRequest);
    }
  });

  // node-postgres returns BIGINT columns as strings (JS numbers can't hold
  // every bigint value) — previewInvoice() explicitly wraps this in
  // Number(), so used comes back as a real number, not the raw string.
  it('converts the bigint COUNT result (returned as a string by pg) to a number', async () => {
    const db = createMockDb();
    db.one.mockResolvedValueOnce({ plan: 'FREE' }).mockResolvedValueOnce({ used: '42' });

    const service = new BillingService(db as unknown as DbService);
    const result = await service.previewInvoice('tenant-1');

    expect(result.used).toBe(42);
    expect(typeof result.used).toBe('number');
  });
});
