// Aqarati Mobile — Property Detail Screen
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { spacing, radius } from '../theme';
import StarRating from '../components/StarRating';
import WhatsAppShare from '../components/WhatsAppShare';
import { formatPrice, formatDate, MOCK_PROPERTY_IMAGES } from '../utils';
import type { RootStackParamList } from '../types';

const { width } = Dimensions.get('window');
const IMG_HEIGHT = 260;

type DetailRoute = RouteProp<RootStackParamList, 'PropertyDetail'>;

// Mock detail based on property id
const MOCK_DETAIL = {
  id: 'p-001',
  title: 'فيلا فاخرة بحي النرجس',
  description: 'فيلا دورين وملحق بتصميم مودرن، مدخل سيارة واسع، مجلس رجال ومقلط، صالة عائلية كبيرة، مطبخ راكب، 5 غرف نوم ماستر، حديقة خلفية، موقع مميز قريب من الخدمات.',
  purpose: 'sale' as const,
  property_type: 'villa',
  status: 'active' as const,
  price: 2500000,
  currency: 'SAR',
  negotiable: true,
  area_sqm: 400,
  bedrooms: 5,
  bathrooms: 4,
  street_width: 20,
  age_years: 3,
  furnished: false,
  city: 'الرياض',
  district: 'حي النرجس',
  address: 'شارع الأمير محمد بن سلمان',
  owner_phone: '+966501234567',
  owner_name: 'محمد العقاري',
  completeness_score: 85,
  created_at: '2026-06-15T00:00:00Z',
};

export default function PropertyDetailScreen() {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<DetailRoute>();
  const lang = i18n.language as 'ar' | 'en';

  const [currentImage, setCurrentImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [rating, setRating] = useState(0);

  const property = MOCK_DETAIL;
  const images = MOCK_PROPERTY_IMAGES;
  const isRTL = lang === 'ar';

  const statusColors: Record<string, string> = {
    active: '#22c55e',
    draft: '#64748b',
    reserved: '#f59e0b',
    sold: '#3b82f6',
    rented: '#8b5cf6',
    archived: '#94a3b8',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header overlaid on image */}
      <View style={styles.headerOverlay}>
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.iconBtnText}>{isRTL ? '→' : '←'}</Text>
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
            onPress={() => setIsFavorite(!isFavorite)}
          >
            <Text style={styles.iconBtnText}>{isFavorite ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / width);
            setCurrentImage(idx);
          }}
        >
          {images.map((uri, i) => (
            <Image
              key={i}
              source={{ uri }}
              style={styles.image}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
        {/* Dots */}
        <View style={styles.dots}>
          {images.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i === currentImage ? theme.accent : 'rgba(255,255,255,0.4)',
                },
              ]}
            />
          ))}
        </View>

        <View style={[styles.content, isRTL && styles.contentRTL]}>
          {/* Title + Status */}
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: theme.text }]}>
              {property.title}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColors[property.status] + '20' }]}>
              <Text style={[styles.statusText, { color: statusColors[property.status] }]}>
                {t(`property.${property.status}`)}
              </Text>
            </View>
          </View>

          {/* Price */}
          <Text style={[styles.price, { color: theme.accent }]}>
            {formatPrice(property.price, property.currency)}
            {property.negotiable && (
              <Text style={[styles.negotiable, { color: theme.textMuted }]}>
                {'  '}{lang === 'ar' ? '(قابل للتفاوض)' : '(Negotiable)'}
              </Text>
            )}
          </Text>

          {/* Quick specs */}
          <View style={[styles.specsRow, isRTL && styles.specsRowRTL]}>
            {property.area_sqm && (
              <View style={[styles.spec, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.specValue, { color: theme.accent }]}>{property.area_sqm}</Text>
                <Text style={[styles.specLabel, { color: theme.textMuted }]}>م²</Text>
              </View>
            )}
            {property.bedrooms > 0 && (
              <View style={[styles.spec, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.specValue, { color: theme.accent }]}>{property.bedrooms}</Text>
                <Text style={[styles.specLabel, { color: theme.textMuted }]}>{t('property.bedrooms')}</Text>
              </View>
            )}
            {property.bathrooms > 0 && (
              <View style={[styles.spec, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.specValue, { color: theme.accent }]}>{property.bathrooms}</Text>
                <Text style={[styles.specLabel, { color: theme.textMuted }]}>{t('property.bathrooms')}</Text>
              </View>
            )}
            {property.street_width && (
              <View style={[styles.spec, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.specValue, { color: theme.accent }]}>{property.street_width}</Text>
                <Text style={[styles.specLabel, { color: theme.textMuted }]}>{t('property.street_width')}</Text>
              </View>
            )}
          </View>

          {/* Description */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {t('property.description')}
          </Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            {property.description}
          </Text>

          {/* Location */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {t('property.location')}
          </Text>
          <View style={[styles.locationCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.locationText, { color: theme.textSecondary }]}>
              📍 {[property.address, property.district, property.city].filter(Boolean).join('، ')}
            </Text>
          </View>

          {/* Owner */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {lang === 'ar' ? 'المالك' : 'Owner'}
          </Text>
          <View style={[styles.ownerCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.ownerAvatar}>
              <Text style={styles.ownerAvatarText}>م</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.ownerName, { color: theme.text }]}>{property.owner_name}</Text>
              <Text style={[styles.ownerPhone, { color: theme.textMuted }]}>{property.owner_phone}</Text>
            </View>
            <TouchableOpacity
              style={[styles.callBtn, { backgroundColor: theme.accent }]}
              activeOpacity={0.8}
            >
              <Text style={styles.callBtnText}>📞</Text>
            </TouchableOpacity>
          </View>

          {/* Rating */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {t('rating.rating')}
          </Text>
          <StarRating
            rating={rating}
            interactive
            onRate={setRating}
            size={32}
          />

          {/* WhatsApp Share */}
          <View style={styles.shareSection}>
            <WhatsAppShare
              property={{ ...property, id: 'p-001', owner_user_id: 'u-001', visibility: 'public', completeness_score: 85, updated_at: '' }}
              price={{ price_amount: property.price, currency: property.currency, negotiable: property.negotiable, id: '', property_id: '', valid_from: '' }}
              location={{ property_id: '', country_code: 'SA', city: property.city, district: property.district, address_text: property.address }}
              ownerPhone={property.owner_phone}
            />
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => navigation.navigate('AddProperty', { propertyId: property.id })}
            >
              <Text style={[styles.actionText, { color: theme.text }]}>✏️  {t('common.edit')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.error + '15', borderColor: theme.error + '40' }]}
              onPress={() => Alert.alert(t('common.confirm'), t('property.delete_confirm'), [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('common.delete'), style: 'destructive', onPress: () => navigation.goBack() },
              ])}
            >
              <Text style={[styles.actionText, { color: theme.error }]}>🗑  {t('common.delete')}</Text>
            </TouchableOpacity>
          </View>

          {/* Data completeness */}
          <View style={[styles.completenessCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.completenessLabel, { color: theme.textSecondary }]}>
              {t('property.completeness')}
            </Text>
            <View style={styles.completenessBar}>
              <View style={[styles.completenessFill, { width: `${property.completeness_score}%`, backgroundColor: property.completeness_score > 70 ? theme.success : theme.warning }]} />
            </View>
            <Text style={[styles.completenessValue, { color: theme.textMuted }]}>
              {property.completeness_score}%
            </Text>
          </View>

          <Text style={[styles.date, { color: theme.textMuted }]}>
            {formatDate(property.created_at, lang)}
          </Text>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerOverlay: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  headerRight: { flexDirection: 'row', gap: spacing.sm },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  image: {
    width,
    height: IMG_HEIGHT,
    backgroundColor: '#1a2a23',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: -24,
    marginBottom: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    paddingHorizontal: spacing.md,
  },
  contentRTL: {
    alignItems: 'flex-end',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'Tajawal',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Tajawal',
  },
  price: {
    fontSize: 26,
    fontWeight: '800',
    fontFamily: 'Tajawal',
    marginBottom: spacing.md,
  },
  negotiable: {
    fontSize: 14,
    fontWeight: '400',
  },
  specsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  specsRowRTL: {
    flexDirection: 'row-reverse',
  },
  spec: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.sm + 4,
    alignItems: 'center',
  },
  specValue: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'Tajawal',
  },
  specLabel: {
    fontSize: 11,
    fontFamily: 'Tajawal',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Tajawal',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Tajawal',
    lineHeight: 22,
  },
  locationCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  locationText: {
    fontSize: 14,
    fontFamily: 'Tajawal',
  },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
  ownerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#14b8a6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ownerAvatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Tajawal',
  },
  ownerName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Tajawal',
  },
  ownerPhone: {
    fontSize: 13,
    fontFamily: 'Tajawal',
    marginTop: 2,
  },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callBtnText: {
    fontSize: 18,
  },
  shareSection: {
    marginTop: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  actionBtn: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: spacing.sm + 4,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Tajawal',
  },
  completenessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  completenessLabel: {
    fontSize: 12,
    fontFamily: 'Tajawal',
    flex: 1,
  },
  completenessBar: {
    flex: 3,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1e3028',
    overflow: 'hidden',
  },
  completenessFill: {
    height: '100%',
    borderRadius: 3,
  },
  completenessValue: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Tajawal',
    width: 35,
  },
  date: {
    fontSize: 12,
    fontFamily: 'Tajawal',
    marginTop: spacing.md,
  },
});
