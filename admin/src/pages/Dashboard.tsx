import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchDashboardStats, fetchRecentActivity, DashboardStats, RecentActivity } from '../api/client';
import { Users, Building2, Building, DollarSign, CreditCard, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchDashboardStats(), fetchRecentActivity()]).then(
      ([s, a]) => {
        setStats(s);
        setActivity(a);
        setLoading(false);
      }
    );
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-[#14b8a6] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    { label: t('admin.users'), value: stats.total_users.toLocaleString('ar-SA'), icon: Users, color: '#14b8a6' },
    { label: t('admin.properties'), value: stats.total_properties.toLocaleString('ar-SA'), icon: Building2, color: '#8b5cf6' },
    { label: t('admin.organizations'), value: stats.total_organizations.toLocaleString('ar-SA'), icon: Building, color: '#f59e0b' },
    { label: 'الإيرادات', value: `${stats.total_revenue_sar.toLocaleString('ar-SA')} ر.س`, icon: DollarSign, color: '#22c55e' },
    { label: 'الاشتراكات النشطة', value: stats.active_subscriptions.toLocaleString('ar-SA'), icon: CreditCard, color: '#3b82f6' },
    { label: t('admin.reports'), value: stats.pending_reports.toLocaleString('ar-SA'), icon: AlertTriangle, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t('admin.dashboard')}</h1>
        <p className="text-white/40 text-sm mt-1">نظرة عامة على المنصة</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="card card-hover p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/40 text-sm">{c.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{c.value}</p>
              </div>
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${c.color}15` }}
              >
                <c.icon size={20} style={{ color: c.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="card p-5">
        <h2 className="text-lg font-semibold text-white mb-4">آخر النشاطات</h2>
        <div className="space-y-3">
          {activity.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-3 p-3 rounded-md bg-white/[0.02] border border-white/[0.03]"
            >
              <div className="w-2 h-2 rounded-full bg-[#14b8a6] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white">{a.action}</p>
                <p className="text-xs text-white/40">{a.user}</p>
              </div>
              <span className="text-xs text-white/30 shrink-0">{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
