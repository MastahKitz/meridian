export interface RefreshRequestBody {
  refreshToken: string;
}

export interface RefreshResponseBody {
  accessToken: string;
}

// auth.controller.ts's presence check and auth.service.ts's session lookup both use
// Nest's default HttpException body, same shape as login's — but a different message
// per case, so each domain keeps its own literal type rather than sharing one.
export interface RefreshErrorResponseBody {
  message: string;
  error: string;
  statusCode: number;
}
