'use client';

// Browser calls to the versioned API. Credentials are the httpOnly session cookies.

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    });
  } catch {
    throw new ApiRequestError(0, 'NETWORK', 'Network request failed');
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = (body as { error?: { code?: string; message?: string; details?: unknown } }).error;
    throw new ApiRequestError(response.status, error?.code ?? 'UNKNOWN', error?.message ?? 'Request failed', error?.details);
  }
  return body as T;
}

export async function signOut(): Promise<void> {
  await fetch('/api/v1/auth/sign-out', { method: 'POST', credentials: 'same-origin' }).catch(() => undefined);
}
