import * as Keychain from 'react-native-keychain';

const SERVICE = 'com.garageforge.session';

/**
 * The account session token is kept in the iOS Keychain / Android Keystore,
 * never in AsyncStorage. It is readable after the first unlock and does not
 * migrate to other devices through backups.
 */
export async function loadSessionToken(): Promise<string | null> {
  const credentials = await Keychain.getGenericPassword({ service: SERVICE });
  return credentials ? credentials.password : null;
}

export async function saveSessionToken(token: string): Promise<void> {
  await Keychain.setGenericPassword('session', token, {
    service: SERVICE,
    accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  });
}

export async function clearSessionToken(): Promise<void> {
  await Keychain.resetGenericPassword({ service: SERVICE });
}
