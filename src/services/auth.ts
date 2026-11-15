import {
  ApiError,
  NO_COOKIES,
  OFFLINE_MESSAGE,
  buildRequestHeaders,
  fallbackErrorMessage,
  request,
} from './api';
import type { Account } from '../types/garage';
import type { ServerSettings } from './syncTypes';

export type MeResponse = {
  user: Account & { emailVerified: boolean };
  settings: ServerSettings;
};

type Credentials = { email: string; password: string };

const trimBase = (baseUrl: string) => baseUrl.replace(/\/$/, '');

/** Signing in before confirming the email; the server sends a new link. */
export class EmailNotConfirmedError extends ApiError {
  constructor() {
    super('Confirm your email first.', 403);
    this.name = 'EmailNotConfirmedError';
  }
}

/**
 * Better Auth returns the bearer token for native clients in the
 * `set-auth-token` response header. There is none after sign-up when the
 * email has to be confirmed first; that returns null.
 */
async function authenticate(
  baseUrl: string,
  path: '/api/auth/sign-in/email' | '/api/auth/sign-up/email',
  body: Record<string, string>,
): Promise<string | null> {
  let response: Response;
  try {
    response = await fetch(`${trimBase(baseUrl)}${path}`, {
      method: 'POST',
      credentials: NO_COOKIES,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(OFFLINE_MESSAGE, undefined, true);
  }
  if (response.status === 403 && path === '/api/auth/sign-in/email') {
    throw new EmailNotConfirmedError();
  }
  if (!response.ok) {
    let message =
      response.status === 429
        ? 'Too many attempts. Wait a minute and try again.'
        : fallbackErrorMessage(response.status);
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
  if (!token && path === '/api/auth/sign-in/email') {
    throw new ApiError('Sign-in did not return a session. Please try again.');
  }
  return token || null;
}

export async function signIn(
  baseUrl: string,
  credentials: Credentials,
): Promise<string> {
  return (await authenticate(
    baseUrl,
    '/api/auth/sign-in/email',
    credentials,
  )) as string;
}

/** Returns null when the account needs its email confirmed first. */
export function signUp(
  baseUrl: string,
  credentials: Credentials & { name: string },
): Promise<string | null> {
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
      credentials: NO_COOKIES,
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
