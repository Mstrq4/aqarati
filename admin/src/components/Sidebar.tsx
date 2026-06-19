import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Users,
  Building2,
  Building,
  CreditCard,
  Wallet,
  AlertTriangle,
  Settings,
  ScrollText,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, key: 'admin.dashboard' },
  { to: '/users', icon: Users, key: 'admin.users' },
  { to: '/properties', icon: Building2, key: 'admin.properties' },
  { to: '/organizations', icon: Building, key: 'admin.organizations' },
  { to: '/plans', icon: CreditCard, key: 'admin.plans' },
  { to: '/payments', icon: Wallet, key: 'admin.payment_providers' },
  { to: '/reports', icon: AlertTriangle, key: 'admin.reports' },
  { to: '/settings', icon: Settings, key: 'admin.settings' },
  { to: '/audit-log', icon: ScrollText, key: 'admin.audit_log' },
];

export default function Sidebar() {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <div
      className={`flex flex-col h-full bg-[#0a1a14] border-l border-[#1e3028] transition-all duration-300 ${
        collapsed ? 'w-[60px]' : 'w-[220px]'
      }`}
    >
      {/* Logo */}
      <div className="h-14 flex items-center justify-center border-b border-[#1e3028] px-3 shrink-0">
        {collapsed ? (
          <span className="text-[#14b8a6] font-bold text-lg">ع</span>
        ) : (
          <span className="text-[#14b8a6] font-bold text-lg">
            عقاراتي
          </span>
        )}
      </div>

      {/* Toggle collapse */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex items-center justify-center h-8 mx-3 mt-2 text-white/30 hover:text-white/70 transition-colors"
      >
        <Menu size={16} />
      </button>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md mb-1 transition-all duration-200 ${
                isActive
                  ? 'bg-[#14b8a6]/10 text-[#14b8a6] border border-[#14b8a6]/20'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              } ${collapsed ? 'justify-center px-0' : ''}`
            }
          >
            <item.icon size={18} />
            {!collapsed && (
              <span className="text-sm font-medium">{t(item.key)}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-3 border-t border-[#1e3028]">
          <p className="text-xs text-white/30 text-center">
            Aqarati v1.0.0
          </p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 right-3 z-50 p-2 rounded-md bg-[#141f1a] border border-[#1e3028] text-white"
      >
        <Menu size={20} />
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block shrink-0">{sidebarContent}</aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-[240px]">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 left-3 z-10 p-2 rounded-md bg-[#141f1a] border border-[#1e3028] text-white"
            >
              <X size={16} />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
