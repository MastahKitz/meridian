export interface LogoutRequestBody {
  refreshToken: string;
}

export interface LogoutResponseBody {
  ok: boolean;
}

// Same shape as login's/refresh's error body (Nest's default HttpException), own
// literal message — see logout-api.assertions.ts.
export interface LogoutErrorResponseBody {
  message: string;
  error: string;
  statusCode: number;
}
