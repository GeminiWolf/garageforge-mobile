import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { colors, spacing } from '../../theme';
import { Text } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import { Badge, BadgeTone } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useGarageStore } from '../../store/garageStore';
import { probeApiHealth } from '../../services/api';
import { SearchableBottomSheet } from '../../components/common/SearchableBottomSheet';
import { BASE_URL_OBJ } from '../../config';

type ProbeState = 'idle' | 'checking' | 'ok' | 'fail';

const PROBE_BADGE: Record<ProbeState, { label: string; tone: BadgeTone }> = {
  idle: { label: 'Not checked', tone: 'muted' },
  checking: { label: 'Checking…', tone: 'info' },
  ok: { label: 'Connected', tone: 'accent' },
  fail: { label: 'Unreachable', tone: 'warning' },
};

const DOT_STYLE: Record<Exclude<ProbeState, 'checking'>, object> = {
  idle: { backgroundColor: colors.textDim },
  ok: { backgroundColor: colors.accent },
  fail: { backgroundColor: colors.warning },
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

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Card gap="md" radius="md" padding="md">
          <View style={styles.statusRow}>
            <Text tone="white">API Connection Status</Text>
            <View accessibilityLiveRegion="polite">
              <Badge
                label={PROBE_BADGE[probe].label}
                tone={PROBE_BADGE[probe].tone}
                leftSection={
                  probe === 'checking' ? (
                    <ActivityIndicator size="small" color={colors.info} />
                  ) : (
                    <View style={[styles.statusDot, DOT_STYLE[probe]]} />
                  )
                }
              />
            </View>
          </View>

          <Text>Base Endpoint</Text>
          <Button
            label={apiUrlDraft}
            onPress={() => setOpenApiSheet(true)}
            style={styles.flex}
            variant="secondary"
            rightIcon="ChevronRight"
          />

          <Text>Bearer Token</Text>
          <Input
            value={tokenDraft}
            onChangeText={setTokenDraft}
            placeholder="Optional"
            placeholderTextColor={colors.textDim}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />

          <View style={styles.row}>
            <Button label="Save API" onPress={saveApi} style={styles.flex} />
            <Button
              label="Probe"
              variant="secondary"
              onPress={() => runProbe(apiUrlDraft.trim(), tokenDraft.trim())}
              style={styles.flex}
            />
          </View>
        </Card>
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
  },
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  contentContainer: {
    gap: spacing.lg,
    marginHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
