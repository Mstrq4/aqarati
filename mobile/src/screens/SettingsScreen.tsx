// Aqarati Mobile — Settings Screen (الإعدادات)
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { spacing, radius } from '../theme';

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { profile, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const lang = i18n.language as 'ar' | 'en';

  const handleLanguageChange = () => {
    const nextLang = lang === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(nextLang);
  };

  const handleLogout = () => {
    Alert.alert(
      t('auth.sign_out'),
      lang === 'ar' ? 'هل أنت متأكد من تسجيل الخروج؟' : 'Are you sure you want to sign out?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('auth.sign_out'), style: 'destructive', onPress: () => logout() },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      lang === 'ar' ? 'حذف الحساب' : 'Delete Account',
      lang === 'ar'
        ? 'سيتم حذف حسابك وجميع بياناتك بشكل نهائي. هذا الإجراء لا يمكن التراجع عنه.'
        : 'Your account and all data will be permanently deleted. This cannot be undone.',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => Alert.alert(
            lang === 'ar' ? 'تأكيد الحذف' : 'Confirm Deletion',
            lang === 'ar' ? 'اكتب "حذف" للتأكيد' : 'Type "DELETE" to confirm',
          ),
        },
      ]
    );
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.accent }]}>{title}</Text>
      {children}
    </View>
  );

  const renderRow = (
    label: string,
    right: React.ReactNode,
    onPress?: () => void,
    danger?: boolean,
  ) => (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: theme.border + '40' }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.6 : 1}
    >
      <Text style={[styles.rowLabel, { color: danger ? '#ef4444' : theme.text }]}>
        {label}
      </Text>
      <View style={styles.rowRight}>{right}</View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, { color: theme.textSecondary }]}>
            {t('common.back')}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {lang === 'ar' ? 'الإعدادات' : 'Settings'}
        </Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile */}
        <View style={[styles.profileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.avatar, { backgroundColor: theme.accent + '20' }]}>
            <Text style={[styles.avatarText, { color: theme.accent }]}>
              {profile?.full_name?.charAt(0) || 'ع'}
            </Text>
          </View>
          <View>
            <Text style={[styles.profileName, { color: theme.text }]}>
              {profile?.full_name || 'مستخدم عقاراتي'}
            </Text>
            <Text style={[styles.profileEmail, { color: theme.textMuted }]}>
              {profile?.email || 'demo@aqarati.app'}
            </Text>
          </View>
        </View>

        {/* Appearance */}
        {renderSection(
          lang === 'ar' ? 'المظهر' : 'Appearance',
          <>
            {renderRow(
              isDark ? t('theme.light_mode') : t('theme.dark_mode'),
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: theme.border, true: theme.accent }}
                thumbColor={isDark ? '#ffffff' : theme.textMuted}
              />,
            )}
            {renderRow(
              t('theme.language'),
              <Text style={[styles.rowValue, { color: theme.accent }]}>
                {lang === 'ar' ? 'العربية' : 'English'}
              </Text>,
              handleLanguageChange,
            )}
          </>
        )}

        {/* Account */}
        {renderSection(
          lang === 'ar' ? 'الحساب' : 'Account',
          <>
            {renderRow(
              t('subscription.subscription'),
              <Text style={[styles.rowValue, { color: theme.accent }]}>
                {t('subscription.free')}
              </Text>,
              () => navigation.navigate('Subscription'),
            )}
            {renderRow(
              t('office.my_office'),
              <Text style={[styles.rowValue, { color: theme.textSecondary }]}>›</Text>,
              () => navigation.navigate('Office'),
            )}
            {renderRow(
              t('contacts.contacts'),
              <Text style={[styles.rowValue, { color: theme.textSecondary }]}>›</Text>,
              () => navigation.navigate('Contacts'),
            )}
          </>
        )}

        {/* Support */}
        {renderSection(
          lang === 'ar' ? 'الدعم' : 'Support',
          <>
            {renderRow(
              lang === 'ar' ? 'مركز المساعدة' : 'Help Center',
              <Text style={[styles.rowValue, { color: theme.textSecondary }]}>›</Text>,
              () => Alert.alert('Help', 'Coming soon'),
            )}
            {renderRow(
              lang === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy',
              <Text style={[styles.rowValue, { color: theme.textSecondary }]}>›</Text>,
              () => Alert.alert('Privacy', 'Coming soon'),
            )}
            {renderRow(
              lang === 'ar' ? 'شروط الاستخدام' : 'Terms of Service',
              <Text style={[styles.rowValue, { color: theme.textSecondary }]}>›</Text>,
              () => Alert.alert('Terms', 'Coming soon'),
            )}
          </>
        )}

        {/* Danger Zone */}
        {renderSection(
          lang === 'ar' ? 'منطقة الخطر' : 'Danger Zone',
          <>
            {renderRow(
              t('auth.sign_out'),
              <Text style={[styles.rowValue, { color: theme.textSecondary }]}>›</Text>,
              handleLogout,
            )}
            {renderRow(
              lang === 'ar' ? 'حذف الحساب' : 'Delete Account',
              <Text style={[styles.rowValue, { color: theme.textSecondary }]}>›</Text>,
              handleDeleteAccount,
              true,
            )}
          </>
        )}

        {/* Version */}
        <Text style={[styles.version, { color: theme.textMuted }]}>
          عقاراتي v1.0.0 · Build 1
        </Text>
        <View style={{ height: 40 }} />
      </ScrollView>
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
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.md },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Tajawal',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Tajawal',
  },
  profileEmail: {
    fontSize: 13,
    fontFamily: 'Tajawal',
    marginTop: 2,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Tajawal',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
  },
  rowLabel: {
    fontSize: 16,
    fontFamily: 'Tajawal',
    flex: 1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowValue: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'Tajawal',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Tajawal',
    marginTop: spacing.lg,
    opacity: 0.6,
  },
});
