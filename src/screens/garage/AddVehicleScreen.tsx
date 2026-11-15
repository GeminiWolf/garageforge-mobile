import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { SearchableBottomSheet } from '../../components/common/SearchableBottomSheet';
import type { GarageStackParamList } from '../../navigation/types';
import {
  ApiError,
  getMakes,
  getModels,
  getModelYears,
  getVariants,
} from '../../services/api';
import { useGarageStore } from '../../store/garageStore';
import type {
  MakeOption,
  ModelOption,
  VariantOption,
  YearOption,
} from '../../types';
import {
  colors,
  fontFamily,
  layout,
  radius,
  spacing,
  typography,
} from '../../theme';
import { Check, ChevronRight } from 'lucide-react-native';
import { parseVehicleYear } from '../../utils/parseVehicleYear';

type Props = NativeStackScreenProps<GarageStackParamList, 'AddVehicle'>;
type SheetKind = 'makes' | 'models' | 'years' | 'variants';

export function AddVehicleScreen({ navigation }: Props) {
  const apiBaseUrl = useGarageStore(s => s.settings.apiBaseUrl);
  const region = useGarageStore(s => s.settings.region);
  const addVehicle = useGarageStore(s => s.addVehicle);
  const startJob = useGarageStore(s => s.startJob);
  const [customerName, setCustomerName] = useState('');
  const [plate, setPlate] = useState('');

  const [manual, setManual] = useState(false);
  const [manualYear, setManualYear] = useState('');
  const [manualMake, setManualMake] = useState('');
  const [manualModel, setManualModel] = useState('');
  const [manualTrim, setManualTrim] = useState('');

  const [makes, setMakes] = useState<MakeOption[]>([]);
  const [selectedMake, setSelectedMake] = useState<MakeOption | null>(null);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelOption | null>(null);
  const [modelYears, setModelYears] = useState<YearOption[]>([]);
  const [selectedModelYear, setSelectedModelYear] = useState<YearOption | null>(
    null,
  );
  const [variants, setVariants] = useState<VariantOption[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<VariantOption | null>(
    null,
  );
  const [openSheet, setOpenSheet] = useState<SheetKind | null>(null);
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoadingMakes(true);
    setError('');
    getMakes(apiBaseUrl, region)
      .then(data => {
        if (!cancelled) {
          setMakes(data);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(catalogueErrorMessage(err));
          setMakes([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingMakes(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, region]);

  useEffect(() => {
    if (!selectedMake) {
      return;
    }
    let cancelled = false;
    setLoadingModels(true);
    setError('');
    getModels(apiBaseUrl, selectedMake.id)
      .then(data => {
        if (!cancelled) {
          setModels(data);
          setSelectedModel(null);
          setModelYears([]);
          setSelectedModelYear(null);
          setVariants([]);
          setSelectedVariant(null);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(catalogueErrorMessage(err));
          setModels([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingModels(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedMake, apiBaseUrl]);

  useEffect(() => {
    if (!selectedModel) {
      return;
    }
    let cancelled = false;
    setLoadingYears(true);
    setError('');
    getModelYears(apiBaseUrl, selectedModel.id)
      .then(data => {
        if (!cancelled) {
          setModelYears(data);
          setSelectedModelYear(null);
          setVariants([]);
          setSelectedVariant(null);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(catalogueErrorMessage(err));
          setModelYears([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingYears(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedModel, apiBaseUrl]);

  useEffect(() => {
    if (!selectedModel || !selectedModelYear) {
      return;
    }
    let cancelled = false;
    setLoadingVariants(true);
    setError('');
    getVariants(apiBaseUrl, selectedModel.id, selectedModelYear.id)
      .then(data => {
        if (!cancelled) {
          setVariants(data);
          setSelectedVariant(null);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(catalogueErrorMessage(err));
          setVariants([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingVariants(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedModel, selectedModelYear, apiBaseUrl]);

  const makeOptions = useMemo(
    () => makes.map(m => ({ key: m.id, label: m.name })),
    [makes],
  );
  const modelOptions = useMemo(
    () => models.map(m => ({ key: m.id, label: m.name })),
    [models],
  );
  const yearOptions = useMemo(
    () => modelYears.map(y => ({ key: y.id, label: String(y.year) })),
    [modelYears],
  );
  const variantOptions = useMemo(
    () => variants.map(v => ({ key: v.id, label: v.name })),
    [variants],
  );

  const sheetConfig = useMemo(() => {
    switch (openSheet) {
      case 'makes':
        return {
          title: 'Select make',
          options: makeOptions,
          selectedKey: selectedMake?.id,
          searchPlaceholder: 'Search makes',
          loading: loadingMakes,
          emptyLabel: 'No makes for this region',
          onSelect: (key: string) => {
            const make = makes.find(m => m.id === key) ?? null;
            setSelectedMake(make);
            setValidationError('');
            setOpenSheet('models');
          },
        };
      case 'models':
        return {
          title: 'Select model',
          options: modelOptions,
          selectedKey: selectedModel?.id,
          searchPlaceholder: 'Search models',
          loading: loadingModels,
          emptyLabel: 'No models for this make',
          onSelect: (key: string) => {
            const model = models.find(m => m.id === key) ?? null;
            setSelectedModel(model);
            setValidationError('');
            setOpenSheet('years');
          },
        };
      case 'years':
        return {
          title: 'Select year',
          options: yearOptions,
          selectedKey: selectedModelYear?.id,
          searchPlaceholder: 'Search years',
          loading: loadingYears,
          emptyLabel: 'No years for this model',
          onSelect: (key: string) => {
            const year = modelYears.find(y => y.id === key) ?? null;
            setSelectedModelYear(year);
            setValidationError('');
            setOpenSheet('variants');
          },
        };
      case 'variants':
        return {
          title: 'Select version',
          options: variantOptions,
          selectedKey: selectedVariant?.id,
          searchPlaceholder: 'Search versions',
          loading: loadingVariants,
          emptyLabel: 'No versions for this year',
          onSelect: (key: string) => {
            const variant = variants.find(v => v.id === key) ?? null;
            setSelectedVariant(variant);
            setValidationError('');
            setOpenSheet(null);
          },
        };
      default:
        return null;
    }
  }, [
    openSheet,
    makeOptions,
    modelOptions,
    yearOptions,
    variantOptions,
    variants,
    makes,
    models,
    modelYears,
    selectedMake?.id,
    selectedModel?.id,
    selectedModelYear?.id,
    selectedVariant?.id,
    loadingMakes,
    loadingModels,
    loadingYears,
    loadingVariants,
  ]);

  const saveCatalogue = () => {
    if (
      !selectedMake ||
      !selectedModel ||
      !selectedModelYear ||
      !selectedVariant
    ) {
      const missing = [
        !selectedMake ? 'make' : null,
        !selectedModel ? 'model' : null,
        !selectedModelYear ? 'year' : null,
        !selectedVariant ? 'variant' : null,
      ].filter(Boolean);
      setValidationError(`Choose ${missing.join(', ')} to save.`);
      return;
    }
    setValidationError('');
    const id = addVehicle({
      year: selectedModelYear.year,
      make: selectedMake.name,
      model: selectedModel.name,
      trim: selectedVariant.trim,
      // Engine name and code come from the catalogue; the engine number is
      // unique to each car and is typed in later.
      ...(selectedVariant.engine_name?.trim()
        ? { engine: selectedVariant.engine_name.trim() }
        : {}),
      ...(selectedVariant.engine_code?.trim()
        ? { engineCode: selectedVariant.engine_code.trim() }
        : {}),
      customerName,
      plate,
    });
    // A new car is in the workshop: it starts with a job.
    startJob({ vehicleId: id });
    navigation.replace('CarDashboard', { vehicleId: id });
  };

  const saveManual = () => {
    const year = parseVehicleYear(manualYear);
    const make = manualMake.trim();
    const model = manualModel.trim();
    if (year == null || !make || !model) {
      setValidationError('Enter year, make, and model.');
      return;
    }
    setValidationError('');
    const id = addVehicle({
      year,
      make,
      model,
      trim: manualTrim.trim(),
      customerName,
      plate,
    });
    startJob({ vehicleId: id });
    navigation.replace('CarDashboard', { vehicleId: id });
  };

  const owner = (
    <View style={styles.owner}>
      <Text style={styles.ownerTitle}>Whose car is it?</Text>
      <Input
        appearance="outlined"
        size="lg"
        label="Customer"
        helper="Optional. Leave empty if it’s your own car."
        value={customerName}
        onChangeText={setCustomerName}
        autoCapitalize="words"
        maxLength={120}
      />
      <Input
        appearance="outlined"
        size="lg"
        label="Number plate"
        helper="Optional"
        value={plate}
        onChangeText={setPlate}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={20}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.intro}>
          {manual
            ? 'Type in your car’s details.'
            : 'Choose your car in four quick steps: make, model, year and version.'}
        </Text>
        {error && !manual ? (
          <View style={styles.notice} accessibilityLiveRegion="polite">
            <Text style={styles.noticeText}>{error}</Text>
          </View>
        ) : null}
        {validationError ? (
          <View style={styles.notice} accessibilityLiveRegion="polite">
            <Text style={styles.noticeText}>{validationError}</Text>
          </View>
        ) : null}

        {manual ? (
          <View>
            <Input
              appearance="outlined"
              size="lg"
              label="Year"
              value={manualYear}
              onChangeText={setManualYear}
              keyboardType="number-pad"
              containerStyle={styles.manualField}
            />
            <Input
              appearance="outlined"
              size="lg"
              label="Make"
              value={manualMake}
              onChangeText={setManualMake}
              containerStyle={styles.manualField}
            />
            <Input
              appearance="outlined"
              size="lg"
              label="Model"
              value={manualModel}
              onChangeText={setManualModel}
              containerStyle={styles.manualField}
            />
            <Input
              appearance="outlined"
              size="lg"
              label="Trim"
              value={manualTrim}
              onChangeText={setManualTrim}
              helper="Optional"
              containerStyle={styles.manualField}
            />
            {owner}
            <Button label="Save to garage" size="lg" onPress={saveManual} />
            <Pressable
              onPress={() => {
                setManual(false);
                setValidationError('');
              }}
              style={styles.modeLink}
            >
              <Text style={styles.modeLinkText}>
                Choose from the catalogue instead
              </Text>
            </Pressable>
          </View>
        ) : (
          <View>
            <View style={styles.panel}>
              <FieldButton
                step={1}
                done={selectedMake != null}
                label="Make"
                value={selectedMake?.name || 'Choose make'}
                hint={loadingMakes ? 'Loading makes…' : undefined}
                loading={loadingMakes}
                onPress={() => setOpenSheet('makes')}
              />
              <FieldButton
                step={2}
                done={selectedModel != null}
                divider
                label="Model"
                value={selectedModel?.name || 'Choose model'}
                hint={
                  !selectedMake
                    ? 'Pick a make first'
                    : loadingModels
                    ? 'Loading models…'
                    : undefined
                }
                disabled={!selectedMake}
                loading={loadingModels}
                onPress={() => setOpenSheet('models')}
              />
              <FieldButton
                step={3}
                done={selectedModelYear != null}
                divider
                label="Year"
                value={
                  selectedModelYear
                    ? String(selectedModelYear.year)
                    : 'Choose year'
                }
                hint={
                  !selectedModel
                    ? 'Pick a model first'
                    : loadingYears
                    ? 'Loading years…'
                    : undefined
                }
                disabled={!selectedModel}
                loading={loadingYears}
                onPress={() => setOpenSheet('years')}
              />
              <FieldButton
                step={4}
                done={selectedVariant != null}
                divider
                label="Version"
                value={
                  selectedVariant
                    ? String(selectedVariant.name)
                    : 'Choose version'
                }
                hint={
                  !selectedModelYear
                    ? 'Pick a year first'
                    : loadingVariants
                    ? 'Loading variants…'
                    : undefined
                }
                disabled={!selectedModelYear}
                loading={loadingVariants}
                onPress={() => setOpenSheet('variants')}
              />
            </View>
            {owner}
            <Button
              label="Save to garage"
              size="lg"
              onPress={saveCatalogue}
              disabled={!selectedVariant}
              style={styles.save}
            />
            <Pressable
              onPress={() => {
                setManual(true);
                setOpenSheet(null);
                setValidationError('');
              }}
              style={styles.modeLink}
            >
              <Text style={styles.modeLinkText}>
                Not in the catalogue? Enter it yourself
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <SearchableBottomSheet
        visible={sheetConfig != null}
        title={sheetConfig?.title ?? ''}
        options={sheetConfig?.options ?? []}
        selectedKey={sheetConfig?.selectedKey?.toString() ?? ''}
        searchPlaceholder={sheetConfig?.searchPlaceholder}
        emptyLabel={sheetConfig?.emptyLabel}
        loading={sheetConfig?.loading}
        closeOnSelect={false}
        onClose={() => setOpenSheet(null)}
        onSelect={option => sheetConfig?.onSelect(option.key)}
      />
    </KeyboardAvoidingView>
  );
}

function FieldButton({
  step,
  done,
  divider,
  label,
  value,
  hint,
  disabled,
  loading,
  onPress,
}: {
  step: number;
  done: boolean;
  divider?: boolean;
  label: string;
  value: string;
  hint?: string;
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Step ${step}, ${label}, ${value}`}
      accessibilityHint={hint}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.field,
        divider && styles.fieldDivider,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.stepDot, done && styles.stepDotDone]}>
        {done ? (
          <Check size={14} color={colors.bg} strokeWidth={3} />
        ) : (
          <Text style={styles.stepNumber}>{step}</Text>
        )}
      </View>
      <View style={styles.fieldText}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text
          style={[styles.fieldValue, !done && !disabled && styles.fieldPrompt]}
          numberOfLines={2}
        >
          {value}
        </Text>
        {hint && !loading ? <Text style={styles.fieldHint}>{hint}</Text> : null}
      </View>
      {loading ? (
        <ActivityIndicator color={colors.accent} size="small" />
      ) : (
        <ChevronRight size={20} color={colors.textDim} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  owner: { gap: spacing.md, marginTop: spacing.xl, marginBottom: spacing.md },
  ownerTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
  },
  flex: {
    flex: 1,
  },
  container: {
    paddingHorizontal: layout.gutter,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  intro: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  notice: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.warningSoft,
    marginBottom: spacing.md,
  },
  noticeText: {
    ...typography.body,
    color: colors.warningText,
  },
  panel: {
    paddingHorizontal: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 72,
    paddingVertical: spacing.md,
  },
  fieldDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: { opacity: 0.72 },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: { backgroundColor: colors.accent, borderColor: colors.accent },
  stepNumber: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
    color: colors.textMuted,
  },
  fieldText: { flex: 1, minWidth: 0, gap: 2 },
  fieldLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.textMuted,
  },
  fieldValue: {
    ...typography.subtitle,
    color: colors.text,
  },
  fieldPrompt: { color: colors.accent },
  fieldHint: {
    ...typography.caption,
    color: colors.textDim,
  },
  save: {
    marginTop: spacing.lg,
  },
  manualField: {
    marginBottom: spacing.md,
  },
  modeLink: {
    minHeight: 48,
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  modeLinkText: {
    ...typography.body,
    color: colors.accent,
    fontFamily: fontFamily.semibold,
  },
});

function catalogueErrorMessage(error: unknown): string {
  return error instanceof ApiError && error.offline
    ? 'Can’t load the car list while you’re offline. Check your connection, or enter your car yourself below.'
    : 'Can’t load the car list right now. Try again, or enter your car yourself below.';
}
