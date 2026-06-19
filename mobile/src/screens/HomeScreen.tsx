// Aqarati Mobile — Home Screen (الرئيسية)
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { spacing, radius } from '../theme';
import PropertyCard from '../components/PropertyCard';
import EmptyState from '../components/EmptyState';
import FilterChips from '../components/FilterChips';
import { formatRelativeDate } from '../utils';
import type { RootStackParamList, Property, PropertyDetails, PropertyPrice } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// Mock data
const MOCK_PROPERTIES: Array<{ property: Property; details: Partial<PropertyDetails>; price: Partial<PropertyPrice> }> = [
  {
    property: {
      id: 'p-001', owner_user_id: 'u-001', visibility: 'public',
      purpose: 'sale', property_type: 'villa', title: 'فيلا فاخرة بحي النرجس',
      description: 'فيلا دورين وملحق، مودرن، مدخل سيارة، مجلس رجال ومقلط', status: 'active',
      completeness_score: 85, created_at: '2026-06-15T00:00:00Z', updated_at: '2026-06-15T00:00:00Z',
    },
    details: { area_sqm: 400, bedrooms: 5, bathrooms: 4, street_width: 20, furnished: false },
    price: { price_amount: 2500000, currency: 'SAR', negotiable: true, id: 'pr-001', property_id: 'p-001', valid_from: '2026-06-01T00:00:00Z' },
  },
  {
    property: {
      id: 'p-002', owner_user_id: 'u-001', visibility: 'public',
      purpose: 'rent', property_type: 'apartment', title: 'شقة مفروشة 3 غرف - الملقا',
      description: 'شقة مفروشة بالكامل، إطلالة رائعة، قريبة من الخدمات', status: 'active',
      completeness_score: 92, created_at: '2026-06-10T00:00:00Z', updated_at: '2026-06-12T00:00:00Z',
    },
    details: { area_sqm: 180, bedrooms: 3, bathrooms: 2, floor_number: 5, furnished: true },
    price: { price_amount: 85000, currency: 'SAR', negotiable: false, id: 'pr-002', property_id: 'p-002', valid_from: '2026-06-01T00:00:00Z' },
  },
  {
    property: {
      id: 'p-003', owner_user_id: 'u-001', visibility: 'private',
      purpose: 'investment', property_type: 'land', title: 'أرض استثمارية - شرق الرياض',
      description: 'أرض على 3 شوارع، مناسبة لبناء عمارة سكنية', status: 'draft',
      completeness_score: 60, created_at: '2026-05-20T00:00:00Z', updated_at: '2026-06-01T00:00:00Z',
    },
    details: { area_sqm: 900, street_width: 30 },
    price: { price_amount: 4500000, currency: 'SAR', negotiable: true, id: 'pr-003', property_id: 'p-003', valid_from: '2026-05-20T00:00:00Z' },
  },
  {
    property: {
      id: 'p-004', owner_user_id: 'u-001', visibility: 'public',
      purpose: 'sale', property_type: 'commercial', title: 'محل تجاري على شارع رئيسي',
      description: 'محل 200م، واجهة زجاجية، مناسب لجميع الأنشطة', status: 'active',
      completeness_score: 78, created_at: '2026-06-08T00:00:00Z', updated_at: '2026-06-08T00:00:00Z',
    },
    details: { area_sqm: 200, bathrooms: 1, street_width: 40 },
    price: { price_amount: 1800000, currency: 'SAR', negotiable: true, id: 'pr-004', property_id: 'p-004', valid_from: '2026-06-01T00:00:00Z' },
  },
];

const STATUS_CHIPS = [
  { key: 'all', label: 'الكل' },
  { key: 'active', label: 'نشط' },
  { key: 'draft', label: 'مسودة' },
  { key: 'reserved', label: 'محجوز' },
  { key: 'sold', label: 'مباع' },
];

export default function HomeScreen() {
  const { theme } = useTheme();
  const { profile } = useAuth();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string[]>(['all']);

  const filtered = MOCK_PROPERTIES.filter((item) => {
    if (selectedStatus.includes('all')) return true;
    return selectedStatus.includes(item.property.status);
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setRefreshing(false);
  }, []);

  const handleStatusToggle = (key: string) => {
    if (key === 'all') {
      setSelectedStatus(['all']);
      return;
    }
    setSelectedStatus((prev) => {
      const withoutAll = prev.filter((k) => k !== 'all');
      if (withoutAll.includes(key)) {
        const next = withoutAll.filter((k) => k !== key);
        return next.length === 0 ? ['all'] : next;
      }
      return [...withoutAll, key];
    });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={[styles.greeting, { color: theme.textMuted }]}>
          {t('common.app_name')}
        </Text>
        <Text style={[styles.name, { color: theme.text }]}>
          {profile?.full_name || t('common.app_name')}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.avatar, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={() => navigation.navigate('Settings')}
      >
        <Text style={[styles.avatarText, { color: theme.accent }]}>
          {profile?.full_name?.charAt(0) || 'ع'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsRow}>
      {[
        { label: 'العقارات', value: MOCK_PROPERTIES.length, color: theme.accent },
        { label: 'النشطة', value: MOCK_PROPERTIES.filter((p) => p.property.status === 'active').length, color: '#22c55e' },
        { label: 'المسودات', value: MOCK_PROPERTIES.filter((p) => p.property.status === 'draft').length, color: '#f59e0b' },
      ].map((stat, i) => (
        <View
          key={i}
          style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );

  const renderItem = ({ item }: { item: typeof MOCK_PROPERTIES[0] }) => (
    <PropertyCard
      property={item.property}
      details={item.details}
      price={item.price}
      onPress={() => navigation.navigate('PropertyDetail', { propertyId: item.property.id })}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.property.id}
        renderItem={renderItem}
        ListHeaderComponent={
          <>
            {renderHeader()}
            {renderStats()}
            <View style={styles.filterRow}>
              <FilterChips
                chips={STATUS_CHIPS}
                selected={selectedStatus}
                onToggle={handleStatusToggle}
              />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {t('property.add_property') === 'إضافة عقار' ? 'العقارات' : 'Properties'}
            </Text>
          </>
        }
        ListEmptyComponent={
          <EmptyState
            icon="🏠"
            title={t('property.no_properties')}
            subtitle={t('property.add_first')}
            actionLabel={t('property.add_property')}
            onAction={() => navigation.navigate('AddProperty', {})}
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
      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.accent }]}
        onPress={() => navigation.navigate('AddProperty', {})}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  greeting: {
    fontSize: 13,
    fontFamily: 'Tajawal',
    fontWeight: '500',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Tajawal',
    marginTop: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Tajawal',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'Tajawal',
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Tajawal',
    marginTop: 2,
  },
  filterRow: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Tajawal',
    marginBottom: spacing.md,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#14b8a6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '300',
  },
});
