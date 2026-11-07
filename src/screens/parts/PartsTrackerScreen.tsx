import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Button} from '../../components/common/Button';
import {EmptyState} from '../../components/common/EmptyState';
import {Screen} from '../../components/common/Screen';
import {SectionHeader} from '../../components/common/SectionHeader';
import {TrackedPartRow} from '../../components/parts/TrackedPartRow';
import type {GarageStackParamList} from '../../navigation/types';
import {useGarageStore} from '../../store/garageStore';
import type {PartPriority, PartStatus} from '../../types';
import {prioritizeParts} from '../../utils/healthSummary';
import {colors, fontFamily, radius, shadows, spacing, typography} from '../../theme';

type Props = NativeStackScreenProps<GarageStackParamList, 'PartsTracker'>;
type FilterKind = 'status' | 'priority' | 'category';

const STATUSES: Array<PartStatus | 'all'> = [
  'all',
  'needed',
  'sourcing',
  'ordered',
  'installed',
];
const PRIORITIES: Array<PartPriority | 'all'> = [
  'all',
  'urgent',
  'soon',
  'someday',
];

function formatFilterLabel(value: string): string {
  return value === 'all' ? 'All' : value;
}

export function PartsTrackerScreen({navigation, route}: Props) {
  const {vehicleId} = route.params;
  const trackedParts = useGarageStore(s => s.trackedParts);
  const currency = useGarageStore(s => s.settings.currency);

  const [status, setStatus] = useState<PartStatus | 'all'>('all');
  const [priority, setPriority] = useState<PartPriority | 'all'>('all');
  const [category, setCategory] = useState<string>('all');
  const [openFilter, setOpenFilter] = useState<FilterKind | null>(null);

  const parts = useMemo(
    () => trackedParts.filter(p => p.vehicleId === vehicleId),
    [trackedParts, vehicleId],
  );

  const categories = useMemo(() => {
    const set = new Set(parts.map(p => p.category).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [parts]);

  const filtered = useMemo(() => {
    return prioritizeParts(
      parts.filter(p => {
        if (status !== 'all' && p.status !== status) {
          return false;
        }
        if (priority !== 'all' && p.priority !== priority) {
          return false;
        }
        if (category !== 'all' && p.category !== category) {
          return false;
        }
        return true;
      }),
    );
  }, [parts, status, priority, category]);

  const hasActiveFilters =
    status !== 'all' || priority !== 'all' || category !== 'all';

  const clearFilters = () => {
    setStatus('all');
    setPriority('all');
    setCategory('all');
    setOpenFilter(null);
  };

  const toggleFilter = (kind: FilterKind) => {
    setOpenFilter(current => (current === kind ? null : kind));
  };

  const emptyContent =
    parts.length === 0 ? (
      <EmptyState
        title="No parts tracked yet"
        subtitle="Add the first part for this car."
        actionLabel="Add part"
        onAction={() => navigation.navigate('AddPart', {vehicleId})}
      />
    ) : (
      <EmptyState
        title="No matching parts"
        subtitle="Try clearing filters or broadening your search."
        actionLabel={hasActiveFilters ? 'Clear filters' : 'Add part'}
        onAction={
          hasActiveFilters
            ? clearFilters
            : () => navigation.navigate('AddPart', {vehicleId})
        }
      />
    );

  return (
    <Screen scroll>
      <SectionHeader
        title="Parts tracker"
        subtitle="Filter by status, priority, category"
        right={
          <Button
            label="Add"
            onPress={() => navigation.navigate('AddPart', {vehicleId})}
            style={{minHeight: 36, paddingHorizontal: 12}}
          />
        }
      />

      <View style={styles.filters}>
        <DropdownMenu
          label="Status"
          value={formatFilterLabel(status)}
          open={openFilter === 'status'}
          stackIndex={openFilter === 'status' ? 3 : 1}
          onToggle={() => toggleFilter('status')}
          options={STATUSES.map(s => ({
            key: s,
            label: formatFilterLabel(s),
            selected: status === s,
            onSelect: () => {
              setStatus(s);
              setOpenFilter(null);
            },
          }))}
        />
        <DropdownMenu
          label="Priority"
          value={formatFilterLabel(priority)}
          open={openFilter === 'priority'}
          stackIndex={openFilter === 'priority' ? 3 : 1}
          onToggle={() => toggleFilter('priority')}
          options={PRIORITIES.map(p => ({
            key: p,
            label: formatFilterLabel(p),
            selected: priority === p,
            onSelect: () => {
              setPriority(p);
              setOpenFilter(null);
            },
          }))}
        />
        <DropdownMenu
          label="Category"
          value={category === 'all' ? 'All' : category}
          open={openFilter === 'category'}
          stackIndex={openFilter === 'category' ? 3 : 1}
          onToggle={() => toggleFilter('category')}
          options={categories.map(c => ({
            key: c,
            label: c === 'all' ? 'All' : c,
            selected: category === c,
            onSelect: () => {
              setCategory(c);
              setOpenFilter(null);
            },
          }))}
        />
      </View>

      {hasActiveFilters ? (
        <Button
          label="Clear filters"
          variant="ghost"
          onPress={clearFilters}
          style={styles.clearBtn}
        />
      ) : null}

      <Pressable
        disabled={!openFilter}
        onPress={() => setOpenFilter(null)}
        style={styles.listArea}
        accessibilityLiveRegion="polite"
        accessibilityLabel={`${filtered.length} ${filtered.length === 1 ? 'part' : 'parts'} shown`}>
        {filtered.length === 0
          ? emptyContent
          : filtered.map(part => (
              <TrackedPartRow
                key={part.id}
                part={part}
                currency={currency}
                onPress={() =>
                  navigation.navigate('PartDetail', {partId: part.id})
                }
              />
            ))}
      </Pressable>
    </Screen>
  );
}

type DropdownOption = {
  key: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
};

function DropdownMenu({
  label,
  value,
  open,
  stackIndex,
  onToggle,
  options,
}: {
  label: string;
  value: string;
  open: boolean;
  stackIndex: number;
  onToggle: () => void;
  options: DropdownOption[];
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      Animated.timing(progress, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.timing(progress, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(({finished}) => {
      if (finished) {
        setMounted(false);
      }
    });
  }, [open, progress]);

  const menuStyle = {
    opacity: progress,
    transform: [
      {
        translateY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [-8, 0],
        }),
      },
    ],
  };

  return (
    <View style={[styles.dropdownWrap, {zIndex: stackIndex}]}>
      <Pressable
        style={[styles.field, open && styles.fieldOpen]}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={`${label} filter, ${value}`}
        accessibilityState={{expanded: open}}>
        <View style={styles.fieldText}>
          <Text style={styles.fieldLabel}>{label}</Text>
          <Text
            style={[
              styles.fieldValue,
              label === 'Category' && value !== 'All' && styles.fieldValuePlain,
            ]}>
            {value}
          </Text>
        </View>
        <Text style={styles.chevron} accessible={false}>
          {open ? '▴' : '▾'}
        </Text>
      </Pressable>
      {mounted ? (
        <Animated.View
          style={[styles.menu, menuStyle]}
          accessibilityRole="menu">
          {options.map(opt => (
            <Pressable
              key={opt.key}
              style={[styles.option, opt.selected && styles.optionSelected]}
              onPress={opt.onSelect}
              accessibilityRole="menuitem"
              accessibilityLabel={opt.label}
              accessibilityState={{selected: opt.selected}}>
              <Text
                style={[
                  styles.optionText,
                  opt.selected && styles.optionTextSelected,
                ]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  filters: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
    overflow: 'visible',
  },
  clearBtn: {
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
    minHeight: 36,
    paddingHorizontal: spacing.md,
  },
  listArea: {
    flexGrow: 1,
  },
  dropdownWrap: {
    position: 'relative',
  },
  field: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldOpen: {
    borderColor: colors.accent,
  },
  fieldText: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  fieldLabel: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  fieldValue: {
    ...typography.body,
    color: colors.text,
    textTransform: 'capitalize',
  },
  fieldValuePlain: {
    textTransform: 'none',
  },
  chevron: {
    ...typography.body,
    color: colors.textMuted,
  },
  menu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: spacing.xs,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
    ...shadows.soft,
  },
  option: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  optionSelected: {
    backgroundColor: colors.accentSoft,
  },
  optionText: {
    ...typography.body,
    color: colors.text,
    textTransform: 'capitalize',
  },
  optionTextSelected: {
    color: colors.accent,
    fontFamily: fontFamily.semibold,
  },
});
