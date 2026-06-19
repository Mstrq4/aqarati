// Aqarati Mobile — Property Card Component
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { spacing, radius } from '../theme';
import { formatPrice, formatRelativeDate, MOCK_PROPERTY_IMAGES } from '../utils';
import type { Property, PropertyDetails, PropertyPrice } from '../types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - spacing.lg * 2;

interface PropertyCardProps {
  property: Property;
  details?: Partial<PropertyDetails>;
  price?: Partial<PropertyPrice>;
  imageUrl?: string;
  onPress: () => void;
}

export default function PropertyCard({
  property,
  details,
  price,
  imageUrl,
  onPress,
}: PropertyCardProps) {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'ar' | 'en';
  const isRTL = lang === 'ar';

  const purposeColors: Record<string, string> = {
    sale: '#14b8a6',
    rent: '#8b5cf6',
    investment: '#f59e0b',
  };

  const purposeLabel =
    property.purpose === 'sale'
      ? t('property.sale')
      : property.purpose === 'rent'
      ? t('property.rent')
      : t('property.investment');

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Image
        source={{ uri: imageUrl || MOCK_PROPERTY_IMAGES[0] }}
        style={styles.image}
        resizeMode="cover"
      />
      {/* Purpose Badge */}
      <View
        style={[
          styles.badge,
          { backgroundColor: purposeColors[property.purpose] || theme.accent },
        ]}
      >
        <Text style={styles.badgeText}>{purposeLabel}</Text>
      </View>
      {/* Status indicator */}
      {property.status !== 'active' && (
        <View style={[styles.statusBadge, { backgroundColor: theme.muted }]}>
          <Text style={[styles.statusText, { color: theme.textMuted }]}>
            {t(`property.${property.status}`)}
          </Text>
        </View>
      )}
      {/* Content */}
      <View style={[styles.content, isRTL && styles.contentRTL]}>
        <Text
          style={[styles.title, { color: theme.text }]}
          numberOfLines={1}
        >
          {property.title}
        </Text>
        {price?.price_amount ? (
          <Text style={[styles.price, { color: theme.accent }]}>
            {formatPrice(price.price_amount, price.currency)}
          </Text>
        ) : null}
        <View style={[styles.meta, isRTL && styles.metaRTL]}>
          {details?.area_sqm ? (
            <Text style={[styles.metaText, { color: theme.textSecondary }]}>
              {details.area_sqm} م²
            </Text>
          ) : null}
          {details?.bedrooms ? (
            <Text style={[styles.metaText, { color: theme.textSecondary }]}>
              🛏 {details.bedrooms}
            </Text>
          ) : null}
          {details?.bathrooms ? (
            <Text style={[styles.metaText, { color: theme.textSecondary }]}>
              🚿 {details.bathrooms}
            </Text>
          ) : null}
        </View>
        <Text style={[styles.date, { color: theme.textMuted }]}>
          {formatRelativeDate(property.created_at, lang)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: '#1a2a23',
  },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Tajawal',
  },
  statusBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Tajawal',
  },
  content: {
    padding: spacing.md,
  },
  contentRTL: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Tajawal',
    marginBottom: 4,
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'Tajawal',
    marginBottom: 6,
  },
  meta: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: 4,
  },
  metaRTL: {
    flexDirection: 'row-reverse',
  },
  metaText: {
    fontSize: 13,
    fontFamily: 'Tajawal',
  },
  date: {
    fontSize: 11,
    fontFamily: 'Tajawal',
    marginTop: 2,
  },
});
