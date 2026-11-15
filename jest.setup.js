/* global jest */
// In-memory stand-in for the native Keychain module.
jest.mock('react-native-keychain', () => {
  const store = new Map();
  return {
    ACCESSIBLE: {
      AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY:
        'AccessibleAfterFirstUnlockThisDeviceOnly',
    },
    setGenericPassword: jest.fn(async (username, password, options) => {
      store.set(options?.service ?? 'default', { username, password });
      return { service: options?.service, storage: 'mock' };
    }),
    getGenericPassword: jest.fn(
      async options => store.get(options?.service ?? 'default') ?? false,
    ),
    resetGenericPassword: jest.fn(async options => {
      store.delete(options?.service ?? 'default');
      return true;
    }),
  };
});

jest.mock('@react-native-async-storage/async-storage', () => {
  const mock = jest.requireActual(
    '@react-native-async-storage/async-storage/jest',
  );
  return mock.default ?? mock;
});

jest.mock('react-native-blob-util', () => ({
  __esModule: true,
  default: {
    fs: { dirs: { CacheDir: '/tmp' }, writeFile: jest.fn(async () => {}) },
  },
}));
