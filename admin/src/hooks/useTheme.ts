import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { injectThemeVariables } from '../shared/theme';

type Theme = 'dark' | 'light';

export function useTheme() {
  const { i18n } = useTranslation();
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('aq-theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const lang = i18n.language as 'ar' | 'en';
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const isDark = theme === 'dark';

  // Apply theme CSS variables
  useEffect(() => {
    injectThemeVariables(theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Apply direction + language
  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
    localStorage.setItem('aq-lang', lang);
  }, [lang, dir]);

  // Listen for system theme changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('aq-theme')) {
        setThemeState(e.matches ? 'dark' : 'light');
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem('aq-theme', t);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const toggleLanguage = useCallback(() => {
    const next = lang === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(next);
  }, [lang, i18n]);

  return { isDark, theme, lang, dir, setTheme, toggleTheme, toggleLanguage };
}
