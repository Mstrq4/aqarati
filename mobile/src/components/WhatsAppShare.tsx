// Aqarati Mobile — WhatsApp Share Component
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { spacing, radius } from '../theme';
import { buildWhatsAppUrl, openWhatsApp, formatPrice } from '../utils';
import type { Property, PropertyPrice, PropertyLocation } from '../types';

interface WhatsAppShareProps {
  property: Property;
  price?: Partial<PropertyPrice>;
  location?: Partial<PropertyLocation>;
  ownerPhone?: string;
}

export default function WhatsAppShare({
  property,
  price,
  location,
  ownerPhone,
}: WhatsAppShareProps) {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'ar' | 'en';

  const buildAdText = (): string => {
    const lines: string[] = [];
    if (lang === 'ar') {
      lines.push(`🏠 *${property.title}*`);
      lines.push('');
      if (price?.price_amount) {
        lines.push(`💰 السعر: ${formatPrice(price.price_amount)}${price.negotiable ? ' (قابل للتفاوض)' : ''}`);
      }
      if (location?.city) {
        lines.push(`📍 الموقع: ${[location.district, location.city, location.region].filter(Boolean).join('، ')}`);
      }
      if (property.description) {
        lines.push(`📝 ${property.description.substring(0, 200)}`);
      }
      if (ownerPhone) {
        lines.push(`📞 للتواصل: ${ownerPhone}`);
      }
      lines.push('');
      lines.push(`#عقاراتي #${property.purpose === 'sale' ? 'بيع' : property.purpose === 'rent' ? 'إيجار' : 'استثمار'}`);
    } else {
      lines.push(`🏠 *${property.title}*`);
      lines.push('');
      if (price?.price_amount) {
        lines.push(`💰 Price: ${formatPrice(price.price_amount)}${price.negotiable ? ' (Negotiable)' : ''}`);
      }
      if (location?.city) {
        lines.push(`📍 Location: ${[location.district, location.city, location.region].filter(Boolean).join(', ')}`);
      }
      if (property.description) {
        lines.push(`📝 ${property.description.substring(0, 200)}`);
      }
      if (ownerPhone) {
        lines.push(`📞 Contact: ${ownerPhone}`);
      }
      lines.push('');
      lines.push(`#Aqarati #${property.purpose === 'sale' ? 'ForSale' : property.purpose === 'rent' ? 'ForRent' : 'Investment'}`);
    }
    return lines.join('\n');
  };

  const handleWhatsApp = async () => {
    if (!ownerPhone) {
      Alert.alert(t('common.error'), t('errors.required_field'));
      return;
    }
    await openWhatsApp(ownerPhone, buildAdText());
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>
        {t('share.share_property')}
      </Text>
      <View style={styles.preview}>
        <Text style={[styles.previewText, { color: theme.textSecondary }]}>
          {buildAdText().substring(0, 250)}
          {buildAdText().length > 250 ? '...' : ''}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.whatsappBtn, { backgroundColor: '#25D366' }]}
        onPress={handleWhatsApp}
        activeOpacity={0.8}
      >
        <Text style={styles.whatsappText}>💬 {t('share.via_whatsapp')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Tajawal',
    marginBottom: spacing.md,
  },
  preview: {
    backgroundColor: '#1a2a23',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  previewText: {
    fontSize: 13,
    fontFamily: 'Tajawal',
    lineHeight: 20,
  },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  whatsappText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Tajawal',
  },
});
