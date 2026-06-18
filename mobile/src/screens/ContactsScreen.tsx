// Aqarati Mobile — Contacts Screen (جهات الاتصال)
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { spacing, radius } from '../theme';
import FilterChips from '../components/FilterChips';
import EmptyState from '../components/EmptyState';
import type { Contact } from '../types';

const MOCK_CONTACTS: Contact[] = [
  { id: 'c-001', owner_user_id: 'u-001', name: 'محمد العتيبي', phone: '+966****1234', email: 'moh@example.com', type: 'owner', notes: 'مالك الفيلا', created_at: '2026-05-01T00:00:00Z' },
  { id: 'c-002', owner_user_id: 'u-001', name: 'خالد السبيعي', phone: '+966****5678', type: 'agent', notes: 'وسيط عقاري', created_at: '2026-04-15T00:00:00Z' },
  { id: 'c-003', owner_user_id: 'u-001', name: 'عبدالله الحربي', phone: '+966****9012', email: 'abd@example.com', type: 'client', notes: 'عميل مهتم بالاستثمار', created_at: '2026-03-20T00:00:00Z' },
  { id: 'c-004', owner_user_id: 'u-001', name: 'سارة القحطاني', phone: '+966****3456', type: 'source', notes: 'مصدر عقارات', created_at: '2026-02-10T00:00:00Z' },
  { id: 'c-005', owner_user_id: 'u-001', name: 'فهد المطيري', phone: '+966****7890', type: 'client', created_at: '2026-01-05T00:00:00Z' },
];

const ROLE_CHIPS = [
  { key: 'all', label: 'الكل' },
  { key: 'owner', label: 'مالك' },
  { key: 'agent', label: 'وسيط' },
  { key: 'client', label: 'عميل' },
  { key: 'source', label: 'مصدر' },
];

const ROLE_EMOJI: Record<string, string> = {
  owner: '🏠',
  agent: '🤝',
  client: '👤',
  source: '📋',
};

export default function ContactsScreen() {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const lang = i18n.language as 'ar' | 'en';

  const [search, setSearch] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['all']);
  const [refreshing, setRefreshing] = useState(false);

  const filtered = MOCK_CONTACTS.filter((c) => {
    const matchesSearch = !search || c.name.includes(search) || (c.phone || '').includes(search);
    const matchesRole = selectedRoles.includes('all') || selectedRoles.includes(c.type);
    return matchesSearch && matchesRole;
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setRefreshing(false);
  }, []);

  const handleRoleToggle = (key: string) => {
    if (key === 'all') { setSelectedRoles(['all']); return; }
    setSelectedRoles((prev) => {
      const withoutAll = prev.filter((k) => k !== 'all');
      if (withoutAll.includes(key)) {
        const next = withoutAll.filter((k) => k !== key);
        return next.length === 0 ? ['all'] : next;
      }
      return [...withoutAll, key];
    });
  };

  const renderItem = ({ item }: { item: Contact }) => (
    <View style={[styles.contactCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.contactLeft}>
        <View style={[styles.avatar, { backgroundColor: theme.accent + '20' }]}>
          <Text style={styles.avatarEmoji}>
            {ROLE_EMOJI[item.type] || '👤'}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.contactName, { color: theme.text }]}>{item.name}</Text>
          {item.phone && (
            <Text style={[styles.contactPhone, { color: theme.textMuted }]}>{item.phone}</Text>
          )}
          {item.notes && (
            <Text style={[styles.contactNotes, { color: theme.textSecondary }]} numberOfLines={1}>
              {item.notes}
            </Text>
          )}
        </View>
      </View>
      <View style={[styles.roleBadge, { backgroundColor: theme.muted }]}>
        <Text style={[styles.roleBadgeText, { color: theme.accent }]}>
          {t(`contacts.${item.type}`)}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          {t('contacts.contacts')}
        </Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: theme.accent }]}
          onPress={() => Alert.alert(t('common.done'), lang === 'ar' ? 'فتح شاشة إضافة جهة اتصال' : 'Open add contact screen')}
        >
          <Text style={styles.addBtnText}>+ {t('contacts.add_contact')}</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          value={search}
          onChangeText={setSearch}
          placeholder={lang === 'ar' ? 'ابحث عن جهة اتصال...' : 'Search contacts...'}
          placeholderTextColor={theme.textMuted}
          textAlign={lang === 'ar' ? 'right' : 'left'}
        />
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        <FilterChips
          chips={ROLE_CHIPS}
          selected={selectedRoles}
          onToggle={handleRoleToggle}
        />
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <EmptyState
            icon="📇"
            title={t('contacts.no_contacts')}
            subtitle={t('contacts.add_first_contact')}
            actionLabel={t('contacts.add_contact')}
            onAction={() => {}}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} colors={[theme.accent]} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    fontFamily: 'Tajawal',
  },
  addBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Tajawal',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    marginHorizontal: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  searchIcon: { fontSize: 16, marginRight: spacing.sm },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Tajawal',
    paddingVertical: spacing.sm + 4,
  },
  filterRow: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: { fontSize: 22 },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Tajawal',
  },
  contactPhone: {
    fontSize: 13,
    fontFamily: 'Tajawal',
    marginTop: 2,
  },
  contactNotes: {
    fontSize: 12,
    fontFamily: 'Tajawal',
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Tajawal',
  },
});
