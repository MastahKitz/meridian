export interface CreateKeyRequestBody {
  name?: string;
  scopes?: string[];
}

// keys.controller.ts's create() returns the new row (RETURNING id, name,
// prefix, scopes, created_at) plus the one-time secret — never stored, only
// returned on creation.
export interface CreateKeyResponseBody {
  id: string;
  name: string;
  prefix: string;
  scopes: string[] | null;
  created_at: string;
  secret: string;
}

// keys.controller.ts's list() row shape — includes revoked_at/last_used_at,
// which create()'s response doesn't return.
export interface KeyListItem {
  id: string;
  name: string;
  prefix: string;
  revoked_at: string | null;
  last_used_at: string | null;
  scopes: string[] | null;
  created_at: string;
}

// Same shape as memberships'/tenant's error bodies (Nest's default
// HttpException) — own literal type since these messages (scopes validation,
// the OWNER/ADMIN/MEMBER role gate) are keys-specific.
export interface KeyErrorResponseBody {
  message: string;
  error: string;
  statusCode: number;
}
