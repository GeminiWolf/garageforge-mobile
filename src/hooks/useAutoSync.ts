import { useEffect } from 'react';
import { AppState } from 'react-native';
import { restoreSession, syncNow } from '../services/accountController';
import { hasPendingChanges } from '../services/sync';
import { useGarageStore } from '../store/garageStore';

const CHANGE_DEBOUNCE_MS = 2000;
const PERIODIC_SYNC_MS = 5 * 60 * 1000;

/**
 * Keeps the signed-in garage in sync: on launch, when the app returns to the
 * foreground, shortly after local changes, and every few minutes while open
 * (to pick up changes made on the website).
 */
export function useAutoSync() {
  const hasHydrated = useGarageStore(state => state.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }
    restoreSession().catch(() => undefined);

    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = useGarageStore.subscribe(state => {
      if (!state.account || !hasPendingChanges(state)) {
        return;
      }
      clearTimeout(timer);
      timer = setTimeout(
        () => syncNow().catch(() => undefined),
        CHANGE_DEBOUNCE_MS,
      );
    });

    const appState = AppState.addEventListener('change', next => {
      if (next === 'active') {
        syncNow().catch(() => undefined);
      }
    });

    const interval = setInterval(() => {
      if (AppState.currentState === 'active') {
        syncNow().catch(() => undefined);
      }
    }, PERIODIC_SYNC_MS);

    return () => {
      clearTimeout(timer);
      unsubscribe();
      appState.remove();
      clearInterval(interval);
    };
  }, [hasHydrated]);
}
