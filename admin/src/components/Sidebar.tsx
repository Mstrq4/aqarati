import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Users, Building2, Building, CreditCard,
  Wallet, AlertTriangle, Settings, ScrollText, Menu, X,
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
      className={`flex flex-col h-full border transition-all duration-300 ${
        collapsed ? 'w-[60px]' : 'w-[220px]'
      }`}
      style={{
        backgroundColor: 'var(--aq-sidebar-bg)',
        borderColor: 'var(--aq-sidebar-border)',
        // RTL: border on the left (content side), LTR: border on the right
        ...(document.dir === 'rtl'
          ? { borderLeftWidth: '1px', borderRightWidth: '0' }
          : { borderRightWidth: '1px', borderLeftWidth: '0' }),
      }}
    >
      {/* Logo */}
      <div
        className="h-14 flex items-center justify-center border-b px-3 shrink-0"
        style={{ borderColor: 'var(--aq-sidebar-border)' }}
      >
        {collapsed ? (
          <span
            className="font-bold text-lg"
            style={{ color: 'var(--aq-brand)' }}
          >
            ع
          </span>
        ) : (
          <span
            className="font-bold text-lg"
            style={{ color: 'var(--aq-brand)' }}
          >
            {t('common.app_name')}
          </span>
        )}
      </div>

      {/* Toggle collapse */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex items-center justify-center h-8 mx-3 mt-2 transition-colors"
        style={{ color: 'var(--aq-text-muted)' }}
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
                collapsed ? 'justify-center px-0' : ''
              }`
            }
            style={({ isActive }) =>
              isActive
                ? {
                    backgroundColor: 'var(--aq-sidebar-active-bg)',
                    color: 'var(--aq-sidebar-active-text)',
                    borderColor: 'var(--aq-brand-border)',
                    borderWidth: '1px',
                  }
                : {
                    color: 'var(--aq-sidebar-text)',
                  }
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
        <div
          className="p-3 border-t"
          style={{ borderColor: 'var(--aq-sidebar-border)' }}
        >
          <p
            className="text-xs text-center"
            style={{ color: 'var(--aq-text-muted)' }}
          >
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
        className="lg:hidden fixed top-3 z-50 p-2 rounded-md border text-white"
        style={{
          backgroundColor: 'var(--aq-surface)',
          borderColor: 'var(--aq-border)',
          [document.dir === 'rtl' ? 'right' : 'left']: '12px',
        }}
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
          <div
            className="absolute top-0 bottom-0 w-[240px]"
            style={{ [document.dir === 'rtl' ? 'right' : 'left']: 0 }}
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 z-10 p-2 rounded-md border text-white"
              style={{
                backgroundColor: 'var(--aq-surface)',
                borderColor: 'var(--aq-border)',
                [document.dir === 'rtl' ? 'left' : 'right']: '12px',
              }}
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
