// usage.service.ts's summary()'s per-key row shape.
export interface KeyUsageRow {
  keyId: string;
  name: string;
  prefix: string;
  requests: number;
  errors: number;
  avgLatencyMs: number;
}

// usage.controller.ts's GET /usage/summary response shape.
export interface UsageSummaryResponseBody {
  from: string;
  to: string;
  totalRequests: number;
  keys: KeyUsageRow[];
}
