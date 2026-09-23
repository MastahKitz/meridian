export interface OverviewSummary {
  tenantName: string;
  plan: string;
  rateLimitPerMinute: number;
  monthlyQuota: number;
  timezone: string;
  requests: number;
}

export const acmeOverview: OverviewSummary = {
  tenantName: 'Acme Corp',
  plan: 'FREE',
  rateLimitPerMinute: 100,
  monthlyQuota: 10_000,
  timezone: 'UTC',
  requests: 4500,
};
