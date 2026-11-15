import React, { useEffect, useState } from 'react';
import { useGarageStore } from './src/store/garageStore';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { colors } from './src/theme';

function App({ uiTest = false }: { uiTest?: boolean }) {
  const [testReady, setTestReady] = useState(!(__DEV__ && uiTest));
  useEffect(() => {
    if (!__DEV__ || !uiTest) return;
    const prepare = () => {
      // UI tests use memory storage; never overwrite the user's saved garage.
      useGarageStore.persist.setOptions({
        storage: {
          getItem: async () => null,
          setItem: async () => {},
          removeItem: async () => {},
        },
      });
      useGarageStore.setState({
        vehicles: [
          {
            id: 'ui-test',
            year: 2021,
            make: 'Audi',
            model: 'A3',
            trim: 'Sedan',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        trackedParts: [],
        hasHydrated: true,
      });
      setTestReady(true);
    };
    if (useGarageStore.persist.hasHydrated()) {
      prepare();
      return;
    }
    return useGarageStore.persist.onFinishHydration(prepare);
  }, [uiTest]);
  if (!testReady) return null;
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <RootNavigator />
    </SafeAreaProvider>
  );
}

export default App;
