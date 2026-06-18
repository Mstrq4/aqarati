// Aqarati Mobile — Utility helpers
import { Linking, Platform } from 'react-native';

export function formatPrice(amount: number, currency: string = 'SAR'): string {
  if (currency === 'SAR') {
    return `${amount.toLocaleString('ar-SA')} ريال`;
  }
  return `${amount.toLocaleString()} ${currency}`;
}

export function formatDate(dateStr: string, locale: string = 'ar'): string {
  const date = new Date(dateStr);
  if (locale === 'ar') {
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatRelativeDate(dateStr: string, locale: string = 'ar'): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (locale === 'ar') {
    if (mins < 1) return 'الآن';
    if (mins < 60) return `منذ ${mins} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days < 7) return `منذ ${days} يوم`;
    if (days < 30) return `منذ ${Math.floor(days / 7)} أسبوع`;
    return formatDate(dateStr, locale);
  }
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return formatDate(dateStr, locale);
}

export function buildWhatsAppUrl(phone: string, text: string): string {
  const cleaned = phone.replace(/[^0-9+]/g, '');
  const encoded = encodeURIComponent(text);
  return `https://wa.me/${cleaned}?text=${encoded}`;
}

export async function openWhatsApp(phone: string, text: string): Promise<void> {
  const url = buildWhatsAppUrl(phone, text);
  try {
    await Linking.openURL(url);
  } catch {
    // Fallback: try opening just WhatsApp
    await Linking.openURL('whatsapp://send?phone=' + phone.replace(/[^0-9+]/g, ''));
  }
}

export function truncateText(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.substring(0, max).trimEnd() + '...';
}

export const MOCK_PROPERTY_IMAGES = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600',
];

export const PROPERTY_TYPES = [
  { key: 'apartment', ar: 'شقة', en: 'Apartment' },
  { key: 'villa', ar: 'فيلا', en: 'Villa' },
  { key: 'land', ar: 'أرض', en: 'Land' },
  { key: 'commercial', ar: 'تجاري', en: 'Commercial' },
  { key: 'office', ar: 'مكتب', en: 'Office' },
  { key: 'warehouse', ar: 'مستودع', en: 'Warehouse' },
  { key: 'farm', ar: 'مزرعة', en: 'Farm' },
  { key: 'floor', ar: 'دور', en: 'Floor' },
  { key: 'building', ar: 'عمارة', en: 'Building' },
  { key: 'rest_house', ar: 'استراحة', en: 'Rest House' },
  { key: 'shop', ar: 'محل', en: 'Shop' },
];

export const PURPOSES = [
  { key: 'sale', ar: 'بيع', en: 'Sale', color: '#14b8a6' },
  { key: 'rent', ar: 'إيجار', en: 'Rent', color: '#8b5cf6' },
  { key: 'investment', ar: 'استثمار', en: 'Investment', color: '#f59e0b' },
];
