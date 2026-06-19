import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from 'react-i18next';

export default function Layout() {
  const { toggleLanguage } = useTheme();
  const { t } = useTranslation();

  return (
    <div className="flex h-screen bg-[#020907] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-[#1e3028] bg-[#020907]/80 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
          <div>
            <h2 className="text-sm text-white/50 font-medium">
              {t('admin.dashboard')}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleLanguage}
              className="btn-secondary text-xs"
            >
              {t('common.language_name')}
            </button>
            <div className="w-8 h-8 rounded-full bg-[#14b8a6]/20 flex items-center justify-center text-sm font-bold text-[#14b8a6]">
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
