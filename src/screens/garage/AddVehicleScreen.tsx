import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import { Button } from '../../components/common/Button';
import { SearchableBottomSheet } from '../../components/common/SearchableBottomSheet';
import type {GarageStackParamList} from '../../navigation/types';
import {
  getMakes,
  getModels,
  getModelYears,
  getVariants,
} from '../../services/api';
import {useGarageStore} from '../../store/garageStore';
import type {
  MakeOption,
  ModelOption,
  VariantOption,
  YearOption,
} from '../../types';
import {colors, radius, spacing, typography} from '../../theme';

type Props = NativeStackScreenProps<GarageStackParamList, 'AddVehicle'>;
type SheetKind = 'makes' | 'models' | 'years' | 'variants';

export function AddVehicleScreen({navigation}: Props) {
  const apiBaseUrl = useGarageStore(s => s.settings.apiBaseUrl);
  const region = useGarageStore(s => s.settings.region);
  const addVehicle = useGarageStore(s => s.addVehicle);

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
        console.error('getMakes error', err);
        if (!cancelled) {
          setError(err.message || 'Failed to load makes');
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
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message || 'Failed to load models');
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
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message || 'Failed to load years');
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
          setError(err.message || 'Failed to load variants');
          setVariants([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingVariants(false);
        }
      });
  }, [selectedModel, selectedModelYear, apiBaseUrl]);

  const makeOptions = useMemo(
    () => makes.map(m => ({key: m.id, label: m.name})),
    [makes],
  );
  const modelOptions = useMemo(
    () => models.map(m => ({key: m.id, label: m.name})),
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
          onSelect: (key: string) => {
            const make = makes.find(m => m.id === key) ?? null;
            setSelectedMake(make);
            setValidationError('');
          },
        };
      case 'models':
        return {
          title: 'Select model',
          options: modelOptions,
          selectedKey: selectedModel?.id,
          searchPlaceholder: 'Search models',
          onSelect: (key: string) => {
            const model = models.find(m => m.id === key) ?? null;
            setSelectedModel(model);
            setValidationError('');
          },
        };
      case 'years':
        return {
          title: 'Select year',
          options: yearOptions,
          selectedKey: selectedModelYear?.id,
          searchPlaceholder: 'Search years',
          onSelect: (key: string) => {
            const year = modelYears.find(y => y.id === key) ?? null;
            setSelectedModelYear(year);
            setValidationError('');
          },
        };
      case 'variants':
        return {
          title: 'Select variant',
          options: variantOptions,
          selectedKey: selectedVariant?.id,
          searchPlaceholder: 'Search variants',
          onSelect: (key: string) => {
            const variant = variants.find(v => v.id === key) ?? null;
            setSelectedVariant(variant);
            setValidationError('');
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
  ]);

  const save = () => {
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
      modelYearId: selectedModelYear.id,
      vehicleVariantId: Number(selectedVariant.id),
    });
    navigation.replace('CarDashboard', {vehicleId: id});
  };

  return (
    <View style={styles.container}>
      {error ? (
        <View accessibilityLiveRegion="assertive" accessibilityRole="alert">
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : null}
      {validationError ? (
        <View accessibilityLiveRegion="assertive" accessibilityRole="alert">
          <Text style={styles.error}>{validationError}</Text>
        </View>
      ) : null}

      <View style={styles.block}>
        <FieldButton
          label="Make"
          value={selectedMake?.name || 'Choose make'}
          hint={loadingMakes ? 'Loading makes…' : undefined}
          loading={loadingMakes}
          onPress={() => setOpenSheet('makes')}
        />
        <FieldButton
          label="Model"
          value={selectedModel?.name || 'Choose model'}
          hint={
            !selectedMake
              ? 'Pick a make first'
              : loadingModels
              ? 'Loading models…'
              : undefined
          }
          disabled={!selectedMake || loadingModels}
          loading={loadingModels}
          onPress={() => setOpenSheet('models')}
        />
        <FieldButton
          label="Year"
          value={
            selectedModelYear ? String(selectedModelYear.year) : 'Choose year'
          }
          hint={
            !selectedModel
              ? 'Pick a model first'
              : loadingYears
              ? 'Loading years…'
              : undefined
          }
          disabled={!selectedModel || loadingYears}
          loading={loadingYears}
          onPress={() => setOpenSheet('years')}
        />
        <FieldButton
          label="Variant"
          value={
            selectedVariant ? String(selectedVariant.name) : 'Choose variant'
          }
          hint={
            !selectedModelYear
              ? 'Pick a year first'
              : loadingVariants
              ? 'Loading variants…'
              : undefined
          }
          disabled={!selectedModelYear || loadingVariants}
          loading={loadingVariants}
          onPress={() => setOpenSheet('variants')}
        />
        <Button
          label="Save to garage"
          onPress={save}
          disabled={loadingMakes || loadingModels || loadingYears}
          style={{ marginTop: spacing.md }}
        />
      </View>

      <SearchableBottomSheet
        visible={sheetConfig != null}
        title={sheetConfig?.title ?? ''}
        options={sheetConfig?.options ?? []}
        selectedKey={sheetConfig?.selectedKey?.toString() ?? ''}
        searchPlaceholder={sheetConfig?.searchPlaceholder}
        onClose={() => setOpenSheet(null)}
        onSelect={option => sheetConfig?.onSelect(option.key)}
      />
    </View>
  );
}

function FieldButton({
  label,
  value,
  hint,
  disabled,
  loading,
  onPress,
}: {
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
      accessibilityLabel={`${label}, ${value}`}
      accessibilityHint={hint}
      accessibilityState={{disabled: !!disabled}}
      style={[styles.field, disabled && styles.disabled]}>
      <View style={styles.fieldHeader}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {loading ? <ActivityIndicator color={colors.accent} size="small" /> : null}
      </View>
      <Text style={styles.fieldValue}>{value}</Text>
      {hint && !loading ? <Text style={styles.fieldHint}>{hint}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  block: {
    gap: spacing.sm,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  field: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  disabled: {
    opacity: 0.45,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  fieldLabel: {
    ...typography.label,
    color: colors.textMuted,
  },
  fieldValue: {
    ...typography.body,
    color: colors.text,
  },
  fieldHint: {
    ...typography.caption,
    color: colors.textDim,
    marginTop: 4,
  },
});
