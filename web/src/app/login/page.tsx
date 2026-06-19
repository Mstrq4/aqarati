'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/api/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020907] p-4">
      <div className="w-full max-w-md bg-[#141f1a] rounded-2xl border border-[#1e3028] p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">عقاراتي</h1>
          <p className="text-emerald-400 text-sm">تسجيل الدخول إلى حسابك</p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-300 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="example@email.com"
              className="w-full bg-[#020907] border border-[#1e3028] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-[#020907] border border-[#1e3028] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white rounded-lg py-3 font-semibold transition"
          >
            {loading ? 'جاري الدخول...' : 'دخول'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <a href="/register" className="block text-emerald-400 hover:text-emerald-300 text-sm transition">
            إنشاء حساب جديد
          </a>
          <a href="/forgot-password" className="block text-gray-500 hover:text-gray-400 text-sm transition">
            نسيت كلمة المرور؟
          </a>
        </div>
      </div>
    </div>
  );
}
