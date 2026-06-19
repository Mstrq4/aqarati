'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { me, logout, fetchMySubscription, isAuthenticated, UserData, SubscriptionData } from '@/api/client';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    Promise.all([
      me().catch(() => null),
      fetchMySubscription().catch(() => null),
    ]).then(([userData, subData]) => {
      setUser(userData);
      setSubscription(subData);
      setLoading(false);
      if (!userData) router.push('/login');
    });
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020907] flex items-center justify-center">
        <p className="text-gray-400 text-lg">جاري التحميل...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#020907]">
      {/* Header */}
      <header className="border-b border-[#1e3028] bg-[#141f1a] p-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-white">عقاراتي</h1>
            <span className="text-emerald-400 text-sm">لوحة التحكم</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm">{user.fullName || user.email}</span>
            <button
              onClick={handleLogout}
              className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-2 rounded-lg text-sm hover:bg-red-900/50 transition"
            >
              خروج
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto p-4 pt-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-1">
            مرحباً، {user.fullName || 'مستخدم عقاراتي'}
          </h2>
          <p className="text-gray-400">هذه لوحة تحكم عقاراتك</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#141f1a] border border-[#1e3028] rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-1">الباقة الحالية</p>
            <p className="text-2xl font-bold text-emerald-400">
              {subscription ? subscription.planName : 'مجانية'}
            </p>
            <p className="text-gray-500 text-xs mt-1">
              {subscription ? subscription.tier : 'trial'}
            </p>
          </div>

          <div className="bg-[#141f1a] border border-[#1e3028] rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-1">حالة الاشتراك</p>
            <p className={`text-2xl font-bold ${subscription?.status === 'active' ? 'text-emerald-400' : 'text-yellow-400'}`}>
              {subscription ? (subscription.status === 'active' ? 'نشط' : subscription.status === 'trial' ? 'تجريبي' : subscription.status) : 'لا يوجد'}
            </p>
            {subscription?.currentPeriodEnd && (
              <p className="text-gray-500 text-xs mt-1">
                ينتهي: {new Date(subscription.currentPeriodEnd).toLocaleDateString('ar-SA')}
              </p>
            )}
          </div>

          <div className="bg-[#141f1a] border border-[#1e3028] rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-1">الحساب</p>
            <p className="text-2xl font-bold text-white">{user.email}</p>
            <p className="text-gray-500 text-xs mt-1">
              {user.status === 'active' ? 'مفعل ✅' : user.status}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href="/properties" className="bg-[#141f1a] border border-[#1e3028] rounded-xl p-6 hover:border-emerald-500 transition group">
            <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition">🏠 عقاراتي</h3>
            <p className="text-gray-400 text-sm mt-1">عرض وإدارة عقاراتك</p>
          </a>
          <a href="/plans" className="bg-[#141f1a] border border-[#1e3028] rounded-xl p-6 hover:border-emerald-500 transition group">
            <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition">💎 الباقات</h3>
            <p className="text-gray-400 text-sm mt-1">ترقية باقتك وباقة مكتبك</p>
          </a>
        </div>
      </main>
    </div>
  );
}
