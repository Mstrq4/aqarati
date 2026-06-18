// Aqarati Mobile — Subscription Screen (الاشتراك)
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { spacing, radius } from '../theme';

interface PlanData {
  id: string;
  name: string;
  arName: string;
  tier: string;
  price: number;
  maxProperties: number;
  maxImages: number;
  maxMembers: number;
  aiEnabled: boolean;
  exportEnabled: boolean;
  features: { ar: string[]; en: string[] };
  color: string;
  popular?: boolean;
}

const PLANS: PlanData[] = [
  {
    id: 'free',
    name: 'Free',
    arName: 'مجاني',
    tier: 'free',
    price: 0,
    maxProperties: 10,
    maxImages: 5,
    maxMembers: 1,
    aiEnabled: false,
    exportEnabled: false,
    features: {
      ar: ['10 عقارات', '5 صور لكل عقار', 'مشاركة عبر واتساب', 'بحث وفلاتر أساسية'],
      en: ['10 Properties', '5 Images per property', 'WhatsApp Sharing', 'Basic Search & Filters'],
    },
    color: '#94a3b8',
  },
  {
    id: 'pro',
    name: 'Professional',
    arName: 'احترافي',
    tier: 'pro',
    price: 49,
    maxProperties: 100,
    maxImages: 20,
    maxMembers: 1,
    aiEnabled: true,
    exportEnabled: true,
    features: {
      ar: ['100 عقار', '20 صورة لكل عقار', 'كل مميزات المجاني', 'تصدير البيانات', 'تذكيرات متقدمة', 'دعم الأولوية'],
      en: ['100 Properties', '20 Images per property', 'All Free features', 'Data Export', 'Advanced Reminders', 'Priority Support'],
    },
    color: '#14b8a6',
    popular: true,
  },
  {
    id: 'office',
    name: 'Office',
    arName: 'مكتب',
    tier: 'office',
    price: 149,
    maxProperties: 500,
    maxImages: 50,
    maxMembers: 10,
    aiEnabled: true,
    exportEnabled: true,
    features: {
      ar: ['500 عقار', '50 صورة لكل عقار', '10 أعضاء', 'مساحة مكتب', 'صلاحيات متقدمة', 'كل مميزات الاحترافي', 'مدير حساب مخصص'],
      en: ['500 Properties', '50 Images per property', '10 Members', 'Office Space', 'Advanced Permissions', 'All Pro features', 'Dedicated Account Manager'],
    },
    color: '#8b5cf6',
  },
];

export default function SubscriptionScreen() {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const lang = i18n.language as 'ar' | 'en';
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const handleUpgrade = (plan: PlanData) => {
    if (plan.tier === 'free') {
      setSelectedPlan('free');
      return;
    }
    Alert.alert(
      lang === 'ar' ? `الترقية إلى ${plan.arName}` : `Upgrade to ${plan.name}`,
      lang === 'ar'
        ? `سيتم تحويلك إلى بوابة الدفع لإكمال الاشتراك بقيمة ${plan.price} ريال/${billingCycle === 'monthly' ? 'شهرياً' : 'سنوياً'}`
        : `You'll be redirected to the payment gateway to complete your subscription at ${plan.price} SAR/${billingCycle === 'monthly' ? 'month' : 'year'}`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: lang === 'ar' ? 'متابعة للدفع' : 'Proceed to Payment',
          onPress: () => {
            setSelectedPlan(plan.id);
            Alert.alert(
              t('common.done'),
              lang === 'ar' ? 'تم ترقية باقتك بنجاح' : 'Plan upgraded successfully',
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, { color: theme.textSecondary }]}>
            {t('common.back')}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {t('subscription.subscription')}
        </Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Plan */}
        <View style={[styles.currentPlan, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.currentLabel, { color: theme.textMuted }]}>
            {t('subscription.current_plan')}
          </Text>
          <Text style={[styles.currentName, { color: theme.accent }]}>
            {selectedPlan === 'pro'
              ? t('subscription.pro')
              : selectedPlan === 'office'
                ? t('subscription.office_plan')
                : t('subscription.free')}
          </Text>
        </View>

        {/* Billing Toggle */}
        <View style={[styles.billingToggle, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TouchableOpacity
            style={[
              styles.billingBtn,
              billingCycle === 'monthly' && { backgroundColor: theme.accent },
            ]}
            onPress={() => setBillingCycle('monthly')}
          >
            <Text style={[styles.billingText, { color: billingCycle === 'monthly' ? '#fff' : theme.textSecondary }]}>
              {lang === 'ar' ? 'شهري' : 'Monthly'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.billingBtn,
              billingCycle === 'yearly' && { backgroundColor: theme.accent },
            ]}
            onPress={() => setBillingCycle('yearly')}
          >
            <Text style={[styles.billingText, { color: billingCycle === 'yearly' ? '#fff' : theme.textSecondary }]}>
              {lang === 'ar' ? 'سنوي' : 'Yearly'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Plans */}
        {PLANS.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          const price = billingCycle === 'yearly' ? Math.round(plan.price * 10) : plan.price;

          return (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                {
                  backgroundColor: isSelected ? plan.color + '15' : theme.surface,
                  borderColor: isSelected ? plan.color : theme.border,
                },
              ]}
              onPress={() => handleUpgrade(plan)}
              activeOpacity={0.8}
            >
              {plan.popular && (
                <View style={[styles.popularBadge, { backgroundColor: plan.color }]}>
                  <Text style={styles.popularText}>
                    {lang === 'ar' ? 'الأكثر شيوعاً' : 'Most Popular'}
                  </Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <View>
                  <Text style={[styles.planName, { color: theme.text }]}>
                    {lang === 'ar' ? plan.arName : plan.name}
                  </Text>
                  <Text style={[styles.planTier, { color: plan.color }]}>
                    {plan.tier.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.planPrice}>
                  <Text style={[styles.priceAmount, { color: theme.text }]}>
                    {price > 0 ? price : (lang === 'ar' ? 'مجاناً' : 'Free')}
                  </Text>
                  {price > 0 && (
                    <Text style={[styles.priceUnit, { color: theme.textMuted }]}>
                      {billingCycle === 'monthly'
                        ? (lang === 'ar' ? 'ر.س/شهر' : 'SAR/mo')
                        : (lang === 'ar' ? 'ر.س/سنة' : 'SAR/yr')}
                    </Text>
                  )}
                </View>
              </View>

              {/* Limits */}
              <View style={styles.limitsRow}>
                <View style={styles.limitItem}>
                  <Text style={[styles.limitValue, { color: plan.color }]}>{plan.maxProperties}</Text>
                  <Text style={[styles.limitLabel, { color: theme.textMuted }]}>
                    {t('subscription.properties_limit')}
                  </Text>
                </View>
                <View style={styles.limitItem}>
                  <Text style={[styles.limitValue, { color: plan.color }]}>{plan.maxImages}</Text>
                  <Text style={[styles.limitLabel, { color: theme.textMuted }]}>
                    {t('subscription.images_limit')}
                  </Text>
                </View>
                <View style={styles.limitItem}>
                  <Text style={[styles.limitValue, { color: plan.color }]}>{plan.maxMembers}</Text>
                  <Text style={[styles.limitLabel, { color: theme.textMuted }]}>
                    {t('subscription.members_limit')}
                  </Text>
                </View>
              </View>

              {/* Features */}
              <View style={styles.featuresList}>
                {(lang === 'ar' ? plan.features.ar : plan.features.en).map((feat, i) => (
                  <View key={i} style={styles.featureRow}>
                    <Text style={[styles.featureCheck, { color: plan.color }]}>✓</Text>
                    <Text style={[styles.featureText, { color: theme.textSecondary }]}>
                      {feat}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Action */}
              <TouchableOpacity
                style={[
                  styles.planAction,
                  {
                    backgroundColor: isSelected ? plan.color + '30' : plan.color,
                    borderColor: plan.color,
                  },
                ]}
                onPress={() => handleUpgrade(plan)}
              >
                <Text style={[styles.planActionText, { color: isSelected ? plan.color : '#fff' }]}>
                  {isSelected
                    ? (lang === 'ar' ? 'باقتك الحالية' : 'Current Plan')
                    : (lang === 'ar' ? 'ترقية' : 'Upgrade')}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}

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
  currentPlan: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  currentLabel: {
    fontSize: 12,
    fontFamily: 'Tajawal',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  currentName: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'Tajawal',
    marginTop: 4,
  },
  billingToggle: {
    flexDirection: 'row',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 4,
    marginBottom: spacing.lg,
  },
  billingBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.sm + 2,
    alignItems: 'center',
  },
  billingText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Tajawal',
  },
  planCard: {
    borderRadius: radius.lg,
    borderWidth: 2,
    padding: spacing.lg,
    marginBottom: spacing.md,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  popularText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Tajawal',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Tajawal',
  },
  planTier: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'Tajawal',
    marginTop: 2,
    letterSpacing: 2,
  },
  planPrice: {
    alignItems: 'flex-end',
  },
  priceAmount: {
    fontSize: 28,
    fontWeight: '800',
    fontFamily: 'Tajawal',
  },
  priceUnit: {
    fontSize: 12,
    fontFamily: 'Tajawal',
  },
  limitsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  limitItem: {
    alignItems: 'center',
  },
  limitValue: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'Tajawal',
  },
  limitLabel: {
    fontSize: 10,
    fontFamily: 'Tajawal',
    marginTop: 2,
  },
  featuresList: {
    marginBottom: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs + 2,
  },
  featureCheck: {
    fontSize: 14,
    fontWeight: '700',
    marginRight: spacing.sm,
    width: 20,
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'Tajawal',
    flex: 1,
  },
  planAction: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: spacing.sm + 4,
    alignItems: 'center',
  },
  planActionText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Tajawal',
  },
});
