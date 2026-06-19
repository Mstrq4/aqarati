import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function useTheme() {
  const { i18n } = useTranslation();

  const isDark = true; // Always dark for now
  const lang = i18n.language as 'ar' | 'en';
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
    document.documentElement.classList.toggle('dark', isDark);
  }, [lang, dir, isDark]);

  const toggleLanguage = () => {
    const next = lang === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(next);
  };

  return { isDark, lang, dir, toggleLanguage };
}
