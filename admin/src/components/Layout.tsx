import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { Sun, Moon } from 'lucide-react';

export default function Layout() {
  const { isDark, toggleTheme, toggleLanguage, dir } = useTheme();
  const { t } = useTranslation();

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--aq-bg)' }}
    >
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header
          className="h-14 border-b flex items-center justify-between px-6 shrink-0 backdrop-blur-sm"
          style={{
            backgroundColor: 'var(--aq-topbar-bg)',
            borderColor: 'var(--aq-topbar-border)',
          }}
        >
          <div>
            <h2
              className="text-sm font-medium"
              style={{ color: 'var(--aq-text-muted)' }}
            >
              {t('admin.dashboard')}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="btn-secondary text-xs flex items-center gap-1"
              title={isDark ? t('theme.light_mode') : t('theme.dark_mode')}
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            {/* Language toggle */}
            <button onClick={toggleLanguage} className="btn-secondary text-xs">
              {t('common.language_name')}
            </button>
            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{
                backgroundColor: 'var(--aq-brand-muted)',
                color: 'var(--aq-brand)',
              }}
            >
              A
            </div>
          </div>
        </header>
        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
