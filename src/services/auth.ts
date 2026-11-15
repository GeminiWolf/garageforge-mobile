import { ApiError, buildRequestHeaders, request } from './api';
import type { Account } from '../types/garage';
import type { ServerSettings } from './syncTypes';

export type MeResponse = {
  user: Account & { emailVerified: boolean };
  settings: ServerSettings;
};

type Credentials = { email: string; password: string };

const trimBase = (baseUrl: string) => baseUrl.replace(/\/$/, '');

/**
 * Better Auth returns the bearer token for native clients in the
 * `set-auth-token` response header.
 */
async function authenticate(
  baseUrl: string,
  path: '/api/auth/sign-in/email' | '/api/auth/sign-up/email',
  body: Record<string, string>,
): Promise<string> {
  let response: Response;
  try {
    response = await fetch(`${trimBase(baseUrl)}${path}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Unable to reach Garage Forge. Check your connection.');
  }
  if (!response.ok) {
    let message =
      response.status === 429
        ? 'Too many attempts. Wait a minute and try again.'
        : `Request failed (${response.status})`;
    try {
      const data = (await response.json()) as { message?: string };
      if (data?.message && response.status !== 429) {
        message = data.message;
      }
    } catch {
      // keep the default message
    }
    throw new ApiError(message, response.status);
  }
  const token = response.headers.get('set-auth-token');
  if (!token) {
    throw new ApiError('Sign-in did not return a session. Please try again.');
  }
  return token;
}

export function signIn(baseUrl: string, credentials: Credentials) {
  return authenticate(baseUrl, '/api/auth/sign-in/email', credentials);
}

export function signUp(
  baseUrl: string,
  credentials: Credentials & { name: string },
) {
  return authenticate(baseUrl, '/api/auth/sign-up/email', credentials);
}

export function getMe(baseUrl: string): Promise<MeResponse> {
  return request<MeResponse>(baseUrl, '/api/v1/me', undefined, 15000);
}

/** Ends the session on the server. Failures are ignored: we sign out locally regardless. */
export async function signOutRemote(baseUrl: string): Promise<void> {
  try {
    await fetch(`${trimBase(baseUrl)}/api/auth/sign-out`, {
      method: 'POST',
      headers: buildRequestHeaders({ body: '{}' }),
      body: '{}',
    });
  } catch {
    // offline: the token is discarded on the device anyway
  }
}

export function deleteAccount(baseUrl: string): Promise<void> {
  return request<void>(baseUrl, '/api/v1/me', { method: 'DELETE' }, 15000);
}
