// Aqarati Mobile — i18n setup using i18next
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { ar, en } from '../../../shared/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import RNRestart from 'react-native'; // fallback

const LANG_KEY = 'aqarati_language';

const resources = {
  ar: { translation: ar },
  en: { translation: en },
};

export async function initI18n(): Promise<void> {
  const storedLang = await AsyncStorage.getItem(LANG_KEY);
  const lang = storedLang || 'ar';

  const rtl = lang === 'ar';
  if (I18nManager.isRTL !== rtl) {
    I18nManager.allowRTL(rtl);
    I18nManager.forceRTL(rtl);
  }

  await i18n.use(initReactI18next).init({
    resources,
    lng: lang,
    fallbackLng: 'ar',
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v3',
  });
}

export async function changeLanguage(lang: 'ar' | 'en'): Promise<void> {
  await AsyncStorage.setItem(LANG_KEY, lang);
  await i18n.changeLanguage(lang);
  const rtl = lang === 'ar';
  if (I18nManager.isRTL !== rtl) {
    I18nManager.allowRTL(rtl);
    I18nManager.forceRTL(rtl);
  }
}

export default i18n;
