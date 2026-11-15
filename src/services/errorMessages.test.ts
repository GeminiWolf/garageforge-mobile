import { ApiError, OFFLINE_MESSAGE, fallbackErrorMessage } from './api';
import { syncErrorMessage } from './accountController';

describe('fallbackErrorMessage', () => {
  it('blames the server for 5xx responses', () => {
    expect(fallbackErrorMessage(503)).toBe(
      'Something went wrong on our side. Try again in a moment.',
    );
  });

  it('keeps the status code for other responses', () => {
    expect(fallbackErrorMessage(404)).toBe(
      'Something went wrong (404). Try again.',
    );
  });
});

describe('syncErrorMessage', () => {
  it('reassures people when they are offline', () => {
    const offline = new ApiError(OFFLINE_MESSAGE, undefined, true);
    expect(syncErrorMessage(offline)).toBe(
      'Offline. Changes will sync when you’re back online.',
    );
  });

  it('says it will retry after a server error', () => {
    expect(syncErrorMessage(new ApiError('boom', 500))).toBe(
      'Couldn’t sync just now. It will try again soon.',
    );
  });

  it('passes through messages the server wrote for people', () => {
    expect(syncErrorMessage(new ApiError('Session expired', 400))).toBe(
      'Session expired',
    );
  });
});
