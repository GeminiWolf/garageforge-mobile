import AsyncStorage from '@react-native-async-storage/async-storage';

const WELCOME_SEEN = 'garageforge.welcomeSeen';
const BACKUP_HINT_DISMISSED = 'garageforge.backupHintDismissed';

async function readFlag(key: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(key)) === '1';
  } catch {
    return true; // if storage fails, don't nag
  }
}

async function writeFlag(key: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, '1');
  } catch {
    // best effort
  }
}

export const hasSeenWelcome = () => readFlag(WELCOME_SEEN);
export const markWelcomeSeen = () => writeFlag(WELCOME_SEEN);
export const isBackupHintDismissed = () => readFlag(BACKUP_HINT_DISMISSED);
export const dismissBackupHint = () => writeFlag(BACKUP_HINT_DISMISSED);
