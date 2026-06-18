// Aqarati Mobile — Reminders Screen (التذكيرات)
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { spacing, radius } from '../theme';
import FilterChips from '../components/FilterChips';
import EmptyState from '../components/EmptyState';
import { formatDate } from '../utils';
import type { Reminder } from '../types';

const MOCK_REMINDERS: Reminder[] = [
  { id: 'r-001', user_id: 'u-001', property_id: 'p-001', type: 'follow_up', title: 'متابعة العميل محمد بخصوص الفيلا', due_at: '2026-06-20T10:00:00Z', completed: false, created_at: '2026-06-15T00:00:00Z' },
  { id: 'r-002', user_id: 'u-001', property_id: 'p-002', type: 'expiry', title: 'ينتهي عرض الشقة المفروشة', due_at: '2026-06-25T00:00:00Z', completed: false, created_at: '2026-06-10T00:00:00Z' },
  { id: 'r-003', user_id: 'u-001', property_id: 'p-003', type: 'incomplete', title: 'بيانات الأرض ناقصة - إضافة الصور', due_at: '2026-06-18T00:00:00Z', completed: false, created_at: '2026-05-20T00:00:00Z' },
  { id: 'r-004', user_id: 'u-001', type: 'custom', title: 'تجديد الاشتراك الشهري', due_at: '2026-07-01T00:00:00Z', completed: true, created_at: '2026-05-01T00:00:00Z' },
  { id: 'r-005', user_id: 'u-001', property_id: 'p-004', type: 'follow_up', title: 'تحديث سعر المحل التجاري', due_at: '2026-06-16T00:00:00Z', completed: false, created_at: '2026-06-08T00:00:00Z' },
];

const TYPE_CHIPS = [
  { key: 'all', label: 'الكل' },
  { key: 'follow_up', label: 'متابعة' },
  { key: 'expiry', label: 'انتهاء عرض' },
  { key: 'incomplete', label: 'بيانات ناقصة' },
  { key: 'custom', label: 'مخصص' },
];

const TYPE_EMOJI: Record<string, string> = {
  follow_up: '📞',
  expiry: '⏰',
  incomplete: '📋',
  custom: '📌',
};

export default function RemindersScreen() {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'ar' | 'en';

  const [selectedTypes, setSelectedTypes] = useState<string[]>(['all']);
  const [showCompleted, setShowCompleted] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reminders, setReminders] = useState(MOCK_REMINDERS);

  const filtered = reminders.filter((r) => {
    const matchesType = selectedTypes.includes('all') || selectedTypes.includes(r.type);
    const matchesStatus = showCompleted || !r.completed;
    return matchesType && matchesStatus;
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setRefreshing(false);
  }, []);

  const handleTypeToggle = (key: string) => {
    if (key === 'all') { setSelectedTypes(['all']); return; }
    setSelectedTypes((prev) => {
      const withoutAll = prev.filter((k) => k !== 'all');
      if (withoutAll.includes(key)) {
        const next = withoutAll.filter((k) => k !== key);
        return next.length === 0 ? ['all'] : next;
      }
      return [...withoutAll, key];
    });
  };

  const toggleComplete = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r))
    );
  };

  const isOverdue = (dueAt: string) => new Date(dueAt) < new Date();

  const renderItem = ({ item }: { item: Reminder }) => (
    <TouchableOpacity
      style={[
        styles.reminderCard,
        {
          backgroundColor: theme.surface,
          borderColor: item.completed ? theme.border : isOverdue(item.due_at) ? theme.error + '40' : theme.accent + '40',
        },
        item.completed && styles.completedCard,
      ]}
      onPress={() => toggleComplete(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.reminderLeft}>
        <Text style={styles.emoji}>{TYPE_EMOJI[item.type] || '📌'}</Text>
      </View>
      <View style={styles.reminderContent}>
        <Text
          style={[
            styles.reminderTitle,
            { color: item.completed ? theme.textMuted : theme.text },
            item.completed && styles.strikethrough,
          ]}
        >
          {item.title}
        </Text>
        <Text style={[styles.reminderDate, { color: isOverdue(item.due_at) && !item.completed ? theme.error : theme.textMuted }]}>
          {isOverdue(item.due_at) && !item.completed ? '⚠️ ' : ''}
          {formatDate(item.due_at, lang)}
        </Text>
      </View>
      <TouchableOpacity
        style={[
          styles.checkbox,
          {
            borderColor: item.completed ? theme.success : theme.border,
            backgroundColor: item.completed ? theme.success : 'transparent',
          },
        ]}
        onPress={() => toggleComplete(item.id)}
      >
        {item.completed && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          {t('reminders.reminders')}
        </Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: theme.accent }]}
          onPress={() => Alert.alert(t('common.done'), lang === 'ar' ? 'فتح شاشة إضافة تذكير' : 'Open add reminder screen')}
        >
          <Text style={styles.addBtnText}>+ {t('reminders.add_reminder')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        <FilterChips
          chips={TYPE_CHIPS}
          selected={selectedTypes}
          onToggle={handleTypeToggle}
        />
      </View>

      <TouchableOpacity
        style={styles.toggleCompleted}
        onPress={() => setShowCompleted(!showCompleted)}
      >
        <Text style={[styles.toggleText, { color: theme.textMuted }]}>
          {showCompleted ? (lang === 'ar' ? 'إخفاء المكتملة' : 'Hide completed') : (lang === 'ar' ? 'إظهار المكتملة' : 'Show completed')}
        </Text>
      </TouchableOpacity>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <EmptyState
            icon="🔔"
            title={t('reminders.no_reminders')}
            subtitle={lang === 'ar' ? 'أضف تذكيراً لتتبع مهامك' : 'Add a reminder to track your tasks'}
            actionLabel={t('reminders.add_reminder')}
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
  filterRow: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  toggleCompleted: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  toggleText: {
    fontSize: 13,
    fontFamily: 'Tajawal',
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  completedCard: {
    opacity: 0.6,
  },
  reminderLeft: {
    width: 40,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 22,
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Tajawal',
    marginBottom: 2,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  reminderDate: {
    fontSize: 12,
    fontFamily: 'Tajawal',
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
