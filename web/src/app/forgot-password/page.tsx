'use client';

import { useState } from 'react';
import { forgotPassword, resetPassword } from '@/api/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setMessage('تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني');
      setStep('reset');
    } catch (err: any) {
      setError(err.message || 'فشل إرسال رابط الاستعادة');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword(token, newPassword);
      setMessage('تم تغيير كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول.');
    } catch (err: any) {
      setError(err.message || 'فشل تغيير كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020907] p-4">
      <div className="w-full max-w-md bg-[#141f1a] rounded-2xl border border-[#1e3028] p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">عقاراتي</h1>
          <p className="text-emerald-400 text-sm">
            {step === 'email' ? 'استعادة كلمة المرور' : 'تعيين كلمة مرور جديدة'}
          </p>
        </div>

        {message && (
          <div className="bg-emerald-900/30 border border-emerald-800 text-emerald-300 rounded-lg p-3 mb-4 text-sm">
            {message}
            {step === 'reset' && !token && (
              <a href="/login" className="block mt-2 text-emerald-400 hover:text-emerald-300 transition">
                الذهاب إلى صفحة الدخول
              </a>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-300 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleSendEmail} className="space-y-4">
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
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white rounded-lg py-3 font-semibold transition"
            >
              {loading ? 'جاري الإرسال...' : 'إرسال رابط الاستعادة'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">رمز الاستعادة</label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                placeholder="أدخل الرمز المرسل إلى بريدك"
                className="w-full bg-[#020907] border border-[#1e3028] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">كلمة المرور الجديدة</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                placeholder="••••••••"
                className="w-full bg-[#020907] border border-[#1e3028] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white rounded-lg py-3 font-semibold transition"
            >
              {loading ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <a href="/login" className="text-gray-500 hover:text-gray-400 text-sm transition">
            العودة إلى تسجيل الدخول
          </a>
        </div>
      </div>
    </div>
  );
}
