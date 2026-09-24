import { UsageService } from './usage.service';
import { DbService } from '../db/db.service';

function createMockDb() {
  return { query: jest.fn(), one: jest.fn() };
}

describe('UsageService.summary', () => {
  it('sums requests across every key into totalRequests', async () => {
    const db = createMockDb();
    db.query.mockResolvedValueOnce([
      { id: 'key-1', name: 'Production', prefix: 'mk_aaa' },
      { id: 'key-2', name: 'Staging', prefix: 'mk_bbb' },
    ]);
    db.one
      .mockResolvedValueOnce({ requests: 120, errors: 3, avg_latency: 45.5 })
      .mockResolvedValueOnce({ requests: 30, errors: 0, avg_latency: 12.1 });

    const service = new UsageService(db as unknown as DbService);
    const result = await service.summary('tenant-1', '2026-01-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z');

    expect(result.totalRequests).toBe(150);
    expect(result.keys).toEqual([
      { keyId: 'key-1', name: 'Production', prefix: 'mk_aaa', requests: 120, errors: 3, avgLatencyMs: 45.5 },
      { keyId: 'key-2', name: 'Staging', prefix: 'mk_bbb', requests: 30, errors: 0, avgLatencyMs: 12.1 },
    ]);
  });

  it('returns zero total requests and an empty keys array for a tenant with no keys', async () => {
    const db = createMockDb();
    db.query.mockResolvedValueOnce([]);

    const service = new UsageService(db as unknown as DbService);
    const result = await service.summary('tenant-empty', '2026-01-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z');

    expect(result.totalRequests).toBe(0);
    expect(result.keys).toEqual([]);
    expect(db.one).not.toHaveBeenCalled();
  });

  it('passes the tenant id and date range through to the per-key query unchanged', async () => {
    const db = createMockDb();
    db.query.mockResolvedValueOnce([{ id: 'key-1', name: 'Production', prefix: 'mk_aaa' }]);
    db.one.mockResolvedValueOnce({ requests: 1, errors: 0, avg_latency: 5 });

    const service = new UsageService(db as unknown as DbService);
    await service.summary('tenant-1', '2026-01-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z');

    expect(db.one).toHaveBeenCalledWith(expect.any(String), ['key-1', '2026-01-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z']);
  });
});

describe('UsageService.daily', () => {
  it('returns the per-day rows from the database as-is', async () => {
    const db = createMockDb();
    const rows = [
      { day: '2026-01-15', requests: 42 },
      { day: '2026-01-16', requests: 7 },
    ];
    db.query.mockResolvedValueOnce(rows);

    const service = new UsageService(db as unknown as DbService);
    const result = await service.daily('tenant-1', '2026-01-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z');

    expect(result).toBe(rows);
  });

  it('passes the tenant id and date range through to the query unchanged', async () => {
    const db = createMockDb();
    db.query.mockResolvedValueOnce([]);

    const service = new UsageService(db as unknown as DbService);
    await service.daily('tenant-1', '2026-01-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z');

    expect(db.query).toHaveBeenCalledWith(expect.any(String), ['tenant-1', '2026-01-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z']);
  });
});

describe('UsageService.exportRows', () => {
  it('scopes to one key when a keyId is given', async () => {
    const db = createMockDb();
    db.query.mockResolvedValueOnce([]);

    const service = new UsageService(db as unknown as DbService);
    await service.exportRows('key-1', '2026-01-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z');

    expect(db.query).toHaveBeenCalledWith(expect.any(String), ['key-1', '2026-01-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z']);
  });

  it('covers every key on the tenant when keyId is null', async () => {
    const db = createMockDb();
    db.query.mockResolvedValueOnce([]);

    const service = new UsageService(db as unknown as DbService);
    await service.exportRows(null, '2026-01-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z');

    expect(db.query).toHaveBeenCalledWith(expect.any(String), ['2026-01-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z']);
  });
});

describe('UsageService.toCsv', () => {
  const service = new UsageService({} as DbService);

  it('emits just the header row for no data', () => {
    expect(service.toCsv([])).toBe('timestamp,key_name,route,status,latency_ms');
  });

  it('formats each row with an ISO timestamp', () => {
    const csv = service.toCsv([
      { created_at: '2026-01-15T10:30:00.000Z', key_name: 'Production', route: 'GET /gw/ping', status: 200, latency_ms: 42 },
    ]);
    expect(csv).toBe('timestamp,key_name,route,status,latency_ms\n2026-01-15T10:30:00.000Z,Production,GET /gw/ping,200,42');
  });

  it('joins multiple rows with newlines, in the order given', () => {
    const csv = service.toCsv([
      { created_at: '2026-01-15T10:00:00.000Z', key_name: 'A', route: 'GET /gw/ping', status: 200, latency_ms: 10 },
      { created_at: '2026-01-15T11:00:00.000Z', key_name: 'B', route: 'POST /gw/echo', status: 500, latency_ms: 99 },
    ]);
    expect(csv.split('\n')).toHaveLength(3);
  });

  // Current behavior, not asserted as correct: a comma inside a field (e.g.
  // a customer-chosen key name) isn't escaped, so it silently shifts every
  // column after it. Documented here rather than silently left uncovered —
  // worth a look before a real customer's key name can contain a comma.
  it('does not escape a comma inside a field, which currently shifts the columns after it', () => {
    const csv = service.toCsv([
      { created_at: '2026-01-15T10:00:00.000Z', key_name: 'Prod, EU', route: 'GET /gw/ping', status: 200, latency_ms: 10 },
    ]);
    expect(csv).toBe('timestamp,key_name,route,status,latency_ms\n2026-01-15T10:00:00.000Z,Prod, EU,GET /gw/ping,200,10');
  });
});
