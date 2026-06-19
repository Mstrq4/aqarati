// Aqarati Mobile — Office Screen (المكتب)
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { spacing, radius } from '../theme';
import EmptyState from '../components/EmptyState';
import type { RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const MOCK_MEMBERS = [
  { id: 'm-1', name: 'محمد العتيبي', role: 'owner', phone: '+966551234567', status: 'active' },
  { id: 'm-2', name: 'خالد الشمري', role: 'manager', phone: '+966551234568', status: 'active' },
  { id: 'm-3', name: 'سارة القحطاني', role: 'member', phone: '+966551234569', status: 'active' },
  { id: 'm-4', name: 'نورة الحربي', role: 'viewer', phone: '+966551234570', status: 'invited' },
];

const ROLE_MAP: Record<string, { ar: string; en: string; color: string }> = {
  owner: { ar: 'مالك المكتب', en: 'Owner', color: '#14b8a6' },
  manager: { ar: 'مدير', en: 'Manager', color: '#3b82f6' },
  member: { ar: 'عضو', en: 'Member', color: '#f59e0b' },
  viewer: { ar: 'مشاهد', en: 'Viewer', color: '#94a3b8' },
};

export default function OfficeScreen() {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const lang = i18n.language as 'ar' | 'en';
  const [invitePhone, setInvitePhone] = useState('');
  const [showInvite, setShowInvite] = useState(false);

  const handleInvite = () => {
    if (!invitePhone.trim()) {
      Alert.alert(t('common.error'), t('errors.required_field'));
      return;
    }
    Alert.alert(
      t('common.done'),
      lang === 'ar' ? 'تم إرسال الدعوة بنجاح' : 'Invitation sent successfully',
      [{ text: t('common.done'), onPress: () => { setInvitePhone(''); setShowInvite(false); } }]
    );
  };

  const handleExport = () => {
    Alert.alert(
      lang === 'ar' ? 'تصدير بيانات المكتب' : 'Export Office Data',
      lang === 'ar'
        ? 'سيتم تصدير جميع العقارات إلى ملف CSV وإرساله للمالك'
        : 'All properties will be exported as CSV and sent to the owner',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('office.export'),
          onPress: () => Alert.alert(t('common.done'),
            lang === 'ar' ? 'تم التصدير بنجاح' : 'Export successful'),
        },
      ]
    );
  };

  const renderMember = ({ item }: { item: typeof MOCK_MEMBERS[0] }) => {
    const roleInfo = ROLE_MAP[item.role] || ROLE_MAP.viewer;
    return (
      <View style={[styles.memberCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.memberAvatar, { backgroundColor: theme.muted }]}>
          <Text style={[styles.memberAvatarText, { color: roleInfo.color }]}>
            {item.name.charAt(0)}
          </Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={[styles.memberName, { color: theme.text }]}>{item.name}</Text>
          <View style={styles.memberMeta}>
            <View style={[styles.roleBadge, { backgroundColor: roleInfo.color + '20' }]}>
              <Text style={[styles.roleText, { color: roleInfo.color }]}>
                {lang === 'ar' ? roleInfo.ar : roleInfo.en}
              </Text>
            </View>
            {item.status === 'invited' && (
              <View style={[styles.statusBadge, { backgroundColor: '#f59e0b20' }]}>
                <Text style={[styles.statusText, { color: '#f59e0b' }]}>
                  {lang === 'ar' ? 'معلق' : 'Pending'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, { color: theme.textSecondary }]}>
            {t('common.back')}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {t('office.my_office')}
        </Text>
        <TouchableOpacity onPress={handleExport}>
          <Text style={[styles.exportText, { color: theme.accent }]}>
            {t('office.export')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Office Info */}
      <View style={[styles.officeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.officeHeader}>
          <View style={[styles.officeIcon, { backgroundColor: theme.accent + '20' }]}>
            <Text style={[styles.officeIconText, { color: theme.accent }]}>🏢</Text>
          </View>
          <View>
            <Text style={[styles.officeName, { color: theme.text }]}>
              {lang === 'ar' ? 'مكتب الرياض العقاري' : 'Riyadh Real Estate Office'}
            </Text>
            <Text style={[styles.officeMeta, { color: theme.textMuted }]}>
              {MOCK_MEMBERS.filter(m => m.status === 'active').length} {t('office.members')} · 12 {lang === 'ar' ? 'عقار' : 'properties'}
            </Text>
          </View>
        </View>
      </View>

      {/* Invite */}
      <View style={styles.inviteSection}>
        <TouchableOpacity
          style={[styles.inviteBtn, { backgroundColor: theme.accent }]}
          onPress={() => setShowInvite(!showInvite)}
        >
          <Text style={styles.inviteBtnText}>+ {t('office.invite')}</Text>
        </TouchableOpacity>
      </View>

      {showInvite && (
        <View style={[styles.inviteForm, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TextInput
            style={[styles.inviteInput, { backgroundColor: theme.muted, borderColor: theme.border, color: theme.text }]}
            value={invitePhone}
            onChangeText={setInvitePhone}
            placeholder={lang === 'ar' ? 'رقم الجوال مع مفتاح الدولة' : 'Phone with country code'}
            placeholderTextColor={theme.textMuted}
            keyboardType="phone-pad"
          />
          <TouchableOpacity
            style={[styles.inviteSubmit, { backgroundColor: theme.accent }]}
            onPress={handleInvite}
          >
            <Text style={styles.inviteSubmitText}>{t('common.send')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Members */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        {t('office.members')} ({MOCK_MEMBERS.length})
      </Text>

      <FlatList
        data={MOCK_MEMBERS}
        keyExtractor={(item) => item.id}
        renderItem={renderMember}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="👥"
            title={t('office.no_office')}
            subtitle={t('office.create_office')}
          />
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
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Tajawal',
  },
  backText: { fontSize: 16, fontFamily: 'Tajawal' },
  exportText: { fontSize: 15, fontWeight: '700', fontFamily: 'Tajawal' },
  officeCard: {
    margin: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  officeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  officeIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  officeIconText: { fontSize: 28 },
  officeName: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Tajawal',
  },
  officeMeta: {
    fontSize: 13,
    fontFamily: 'Tajawal',
    marginTop: 2,
  },
  inviteSection: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  inviteBtn: {
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 4,
    alignItems: 'center',
  },
  inviteBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Tajawal',
  },
  inviteForm: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  inviteInput: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 15,
    fontFamily: 'Tajawal',
  },
  inviteSubmit: {
    borderRadius: radius.sm,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  inviteSubmitText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Tajawal',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Tajawal',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 120,
    gap: spacing.sm,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Tajawal',
  },
  memberInfo: { flex: 1 },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Tajawal',
  },
  memberMeta: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: 4,
  },
  roleBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Tajawal',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Tajawal',
  },
});
