// tenant name/plan/limits/timezone are asserted via tenant-api.data.ts's
// ExpectedTenantDetails, reused directly rather than duplicated here (see
// conventions.md rule 4). requests/30d has no API-layer equivalent yet — no
// usage-api tests exist — so it's the one value that still lives here.
export interface ExpectedUsageDetails {
  requests: number;
}

export const acmeUsageDetails: ExpectedUsageDetails = {
  requests: 4500,
};
