// Aqarati Mobile — Search / Explore Screen (استكشاف)
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { spacing, radius } from '../theme';
import PropertyCard from '../components/PropertyCard';
import EmptyState from '../components/EmptyState';
import FilterChips from '../components/FilterChips';
import { searchProperties } from '../api/client';
import { PROPERTY_TYPES, PURPOSES } from '../utils';
import type { RootStackParamList, Property, PropertyDetails, PropertyPrice } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;


const SORT_OPTIONS = [
  { key: 'newest', label: 'الأحدث' },
  { key: 'price_asc', label: 'السعر: من الأقل' },
  { key: 'price_desc', label: 'السعر: من الأعلى' },
  { key: 'area_asc', label: 'المساحة: من الأصغر' },
  { key: 'area_desc', label: 'المساحة: من الأكبر' },
];

export default function SearchScreen() {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const lang = i18n.language as 'ar' | 'en';

  const [query, setQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedPurposes, setSelectedPurposes] = useState<string[]>([]);
  const [selectedSort, setSelectedSort] = useState<string[]>(['newest']);
  const [refreshing, setRefreshing] = useState(false);

  const typeChips = PROPERTY_TYPES.map((t) => ({
    key: t.key,
    label: lang === 'ar' ? t.ar : t.en,
  }));

  const purposeChips = PURPOSES.map((p) => ({
    key: p.key,
    label: lang === 'ar' ? p.ar : p.en,
    color: p.color,
  }));

  const filtered = searchResults.filter((item) => {
    const q = query.toLowerCase();
    const matchesQuery =
      !q ||
      item.property.title.toLowerCase().includes(q) ||
      (item.property.description || '').toLowerCase().includes(q);
    const matchesType =
      selectedTypes.length === 0 || selectedTypes.includes(item.property.property_type);
    const matchesPurpose =
      selectedPurposes.length === 0 || selectedPurposes.includes(item.property.purpose);
    return matchesQuery && matchesType && matchesPurpose;
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setRefreshing(false);
  }, []);

  const renderHeader = () => (
    <View style={styles.headerContent}>
      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          value={query}
          onChangeText={setQuery}
          placeholder={t('search.search_placeholder')}
          placeholderTextColor={theme.textMuted}
          textAlign={lang === 'ar' ? 'right' : 'left'}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Text style={[styles.clearBtn, { color: theme.textMuted }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Type filter */}
      <View style={styles.filterGroup}>
        <FilterChips
          chips={purposeChips}
          selected={selectedPurposes}
          onToggle={(k) =>
            setSelectedPurposes((p) =>
              p.includes(k) ? p.filter((x) => x !== k) : [...p, k]
            )
          }
        />
      </View>

      <View style={styles.filterGroup}>
        <FilterChips
          chips={typeChips}
          selected={selectedTypes}
          onToggle={(k) =>
            setSelectedTypes((p) =>
              p.includes(k) ? p.filter((x) => x !== k) : [...p, k]
            )
          }
        />
      </View>

      {/* Sort */}
      <View style={styles.sortRow}>
        <Text style={[styles.sortLabel, { color: theme.textMuted }]}>
          {t('search.sort_by')}:
        </Text>
        <FilterChips
          chips={SORT_OPTIONS}
          selected={selectedSort}
          onToggle={(k) => setSelectedSort([k])}
          multiSelect={false}
          horizontal={false}
        />
      </View>

      <Text style={[styles.resultCount, { color: theme.textSecondary }]}>
        {filtered.length} {lang === 'ar' ? 'نتيجة' : 'results'}
      </Text>
    </View>
  );

  const renderItem = ({ item }: { item: typeof searchResultsULTS[0] }) => (
    <PropertyCard
      property={item.property}
      details={item.details}
      price={item.price}
      onPress={() => navigation.navigate('PropertyDetail', { propertyId: item.property.id })}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <Text style={[styles.screenTitle, { color: theme.text }]}>
        {lang === 'ar' ? 'استكشاف' : 'Explore'}
      </Text>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.property.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyState
            icon="🔍"
            title={t('common.no_results')}
            subtitle={lang === 'ar' ? 'جرب تغيير معايير البحث' : 'Try changing your search criteria'}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accent}
            colors={[theme.accent]}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    fontFamily: 'Tajawal',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
  },
  headerContent: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Tajawal',
    paddingVertical: spacing.sm + 4,
  },
  clearBtn: {
    fontSize: 16,
    fontWeight: '600',
  },
  filterGroup: {
    marginBottom: spacing.sm,
  },
  sortRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sortLabel: {
    fontSize: 13,
    fontFamily: 'Tajawal',
  },
  resultCount: {
    fontSize: 13,
    fontFamily: 'Tajawal',
    fontWeight: '500',
  },
});
