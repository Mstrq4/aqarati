// Aqarati Mobile — Filter Chips Component
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { spacing, radius } from '../theme';

export interface FilterChip {
  key: string;
  label: string;
  color?: string;
}

interface FilterChipsProps {
  chips: FilterChip[];
  selected: string[];
  onToggle: (key: string) => void;
  multiSelect?: boolean;
  horizontal?: boolean;
  label?: string;
}

export default function FilterChips({
  chips,
  selected,
  onToggle,
  multiSelect = true,
  horizontal = true,
  label,
}: FilterChipsProps) {
  const { theme } = useTheme();

  const content = (
    <View style={horizontal ? styles.horizontalWrap : styles.verticalWrap}>
      {chips.map((chip) => {
        const isSelected = selected.includes(chip.key);
        return (
          <TouchableOpacity
            key={chip.key}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected
                  ? (chip.color || theme.accent)
                  : theme.muted,
                borderColor: isSelected
                  ? (chip.color || theme.accent)
                  : theme.border,
              },
            ]}
            onPress={() => onToggle(chip.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.chipText,
                {
                  color: isSelected ? '#ffffff' : theme.textSecondary,
                },
              ]}
            >
              {chip.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  if (horizontal) {
    return (
      <View>
        {label && <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {content}
        </ScrollView>
      </View>
    );
  }

  return (
    <View>
      {label && <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>}
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Tajawal',
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: 0,
    gap: spacing.sm,
  },
  horizontalWrap: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: spacing.sm,
  },
  verticalWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
    borderRadius: radius.xl,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Tajawal',
  },
});
