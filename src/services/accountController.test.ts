import * as Keychain from 'react-native-keychain';
import { useGarageStore } from '../store/garageStore';
import {
  signInWithEmail,
  signOut,
  syncNow,
  useSyncStatus,
} from './accountController';
import { getSessionToken, setSessionToken } from './api';

type Call = { url: string; init?: RequestInit };

const json = (
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });

const settings = {
  currency: 'ZAR',
  units: 'metric',
  region: 'AF',
  monthlyBudget: 0,
  budgetRollover: false,
  spendingAlertThreshold: 80,
};

let calls: Call[] = [];

function mockFetch(handler: (call: Call) => Response) {
  calls = [];
  globalThis.fetch = jest.fn(async (url: string, init?: RequestInit) => {
    const call = { url: String(url), init };
    calls.push(call);
    return handler(call);
  }) as unknown as typeof fetch;
}

beforeEach(() => {
  setSessionToken(null);
  useGarageStore.setState({
    account: null,
    vehicles: [],
    trackedParts: [],
    sync: { pendingDeletions: [] },
  });
  useSyncStatus.setState({ state: 'idle', message: undefined });
});

describe('accountController', () => {
  it('signs in, stores the token securely and uploads the local garage', async () => {
    const vehicleId = useGarageStore.getState().addVehicle({
      year: 2016,
      make: 'Volkswagen',
      model: 'Polo',
      trim: '',
    });
    mockFetch(({ url }) => {
      if (url.endsWith('/api/auth/sign-in/email')) {
        return json(
          200,
          { token: 'raw' },
          { 'set-auth-token': 'signed.token' },
        );
      }
      if (url.endsWith('/api/v1/me')) {
        return json(200, {
          user: {
            id: 'u1',
            email: 'a@example.test',
            name: 'A',
            emailVerified: false,
          },
          settings,
        });
      }
      if (url.endsWith('/api/v1/garage/sync')) {
        return json(200, {
          cursor: '2026-11-15T12:00:00.000Z',
          vehicles: [],
          parts: [],
          settings,
          rejected: [],
        });
      }
      return json(404, {});
    });

    await signInWithEmail('a@example.test', 'correct-horse-1');

    expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
      'session',
      'signed.token',
      expect.objectContaining({ service: 'com.garageforge.session' }),
    );
    expect(getSessionToken()).toBe('signed.token');
    expect(useGarageStore.getState().account).toEqual({
      id: 'u1',
      email: 'a@example.test',
      name: 'A',
    });

    const syncCall = calls.find(call => call.url.endsWith('/garage/sync'));
    expect(
      (syncCall?.init?.headers as Record<string, string>).Authorization,
    ).toBe('Bearer signed.token');
    const body = JSON.parse(String(syncCall?.init?.body));
    expect(body.since).toBeUndefined();
    expect(body.vehicles.map((v: { id: string }) => v.id)).toEqual([vehicleId]);
    expect(useGarageStore.getState().sync.cursor).toBe(
      '2026-11-15T12:00:00.000Z',
    );
    // Bearer token only: a stored cookie without an Origin header makes the
    // auth server reject sign-in as cross-site.
    expect(calls.map(call => call.init?.credentials)).toEqual(
      calls.map(() => 'omit'),
    );
  });

  it('ends the session but keeps the garage when the server says 401', async () => {
    setSessionToken('expired');
    useGarageStore.setState({
      account: { id: 'u1', email: 'a@example.test', name: 'A' },
    });
    useGarageStore.getState().addVehicle({
      year: 2016,
      make: 'Volkswagen',
      model: 'Polo',
      trim: '',
    });
    mockFetch(() => json(401, { message: 'Sign in required' }));

    await syncNow();

    expect(useGarageStore.getState().account).toBeNull();
    expect(useGarageStore.getState().vehicles).toHaveLength(1);
    expect(getSessionToken()).toBe('');
    expect(useSyncStatus.getState()).toMatchObject({ state: 'error' });
  });

  it('refuses to sign out while changes cannot be uploaded', async () => {
    setSessionToken('token');
    useGarageStore.setState({
      account: { id: 'u1', email: 'a@example.test', name: 'A' },
    });
    useGarageStore.getState().addVehicle({
      year: 2016,
      make: 'Volkswagen',
      model: 'Polo',
      trim: '',
    });
    mockFetch(() => {
      throw new TypeError('Network request failed');
    });

    await expect(signOut()).resolves.toBe(false);
    expect(useGarageStore.getState().account).not.toBeNull();
    expect(useGarageStore.getState().vehicles).toHaveLength(1);

    await expect(signOut({ force: true })).resolves.toBe(true);
    expect(useGarageStore.getState().account).toBeNull();
    expect(useGarageStore.getState().vehicles).toEqual([]);
  });
});
