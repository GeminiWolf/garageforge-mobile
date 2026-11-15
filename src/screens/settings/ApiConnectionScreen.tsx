import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { colors, layout, spacing } from '../../theme';
import { Text } from '../../components/common/Text';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useGarageStore } from '../../store/garageStore';
import { probeApiHealth } from '../../services/api';
import { SearchableBottomSheet } from '../../components/common/SearchableBottomSheet';
import { BASE_URL_OBJ } from '../../config';

type ProbeState = 'idle' | 'checking' | 'ok' | 'fail';

const PROBE_LABEL: Record<ProbeState, string> = {
  idle: 'Not checked',
  checking: 'Checking…',
  ok: 'Connected',
  fail: 'Unavailable',
};

const API_SHEET_OPTIONS = Object.values(BASE_URL_OBJ).map(url => ({
  key: url,
  label: url,
}));

export default function ApiConnectionScreen() {
  const updateSettings = useGarageStore(s => s.updateSettings);
  const settings = useGarageStore(s => s.settings);
  const hasHydrated = useGarageStore(s => s.hasHydrated);

  const [apiUrlDraft, setApiUrlDraft] = useState(settings.apiBaseUrl);
  const [tokenDraft, setTokenDraft] = useState(settings.apiBearerToken);
  const [openApiSheet, setOpenApiSheet] = useState(false);
  const [probe, setProbe] = useState<ProbeState>('idle');

  const runProbe = async (
    url = settings.apiBaseUrl,
    token = settings.apiBearerToken,
  ) => {
    setProbe('checking');
    const ok = await probeApiHealth(url, token);
    setProbe(ok ? 'ok' : 'fail');
  };

  useEffect(() => {
    setApiUrlDraft(settings.apiBaseUrl);
  }, [settings.apiBaseUrl]);

  useEffect(() => {
    setTokenDraft(settings.apiBearerToken);
  }, [settings.apiBearerToken]);

  useEffect(() => {
    if (hasHydrated) {
      runProbe();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, settings.apiBaseUrl, settings.apiBearerToken]);

  const saveApi = () => {
    const apiBaseUrl = apiUrlDraft.trim();
    const apiBearerToken = tokenDraft.trim();
    updateSettings({ apiBaseUrl, apiBearerToken });
    runProbe(apiBaseUrl, apiBearerToken);
  };

  const probeTone =
    probe === 'ok' ? 'accent' : probe === 'fail' ? 'warning' : 'muted';

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.statusRow}>
          <Text tone="muted">Catalogue connection</Text>
          {probe === 'checking' ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Text tone={probeTone}>{PROBE_LABEL[probe]}</Text>
          )}
        </View>

        <Button
          label={apiUrlDraft || 'Choose endpoint'}
          onPress={() => setOpenApiSheet(true)}
          variant="ghost"
        />

        <Input
          label="Bearer token"
          value={tokenDraft}
          onChangeText={setTokenDraft}
          placeholder="Optional"
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />

        <View style={styles.row}>
          <Button label="Save" onPress={saveApi} style={styles.flex} />
          <Button
            label="Check"
            variant="secondary"
            onPress={() => runProbe(apiUrlDraft.trim(), tokenDraft.trim())}
            style={styles.flex}
          />
        </View>
      </ScrollView>

      <SearchableBottomSheet
        visible={openApiSheet}
        title="API"
        options={API_SHEET_OPTIONS}
        selectedKey={settings.apiBaseUrl}
        searchable={false}
        onClose={() => setOpenApiSheet(false)}
        onSelect={option => {
          setApiUrlDraft(option.key);
          setOpenApiSheet(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  contentContainer: {
    gap: spacing.lg,
    paddingHorizontal: layout.gutter,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
});
