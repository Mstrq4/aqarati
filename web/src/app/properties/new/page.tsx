'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProperty, isAuthenticated } from '@/api/client';

const PROPERTY_TYPES = ['villa', 'apartment', 'land', 'commercial', 'floor', 'farm'];
const PURPOSES = ['sale', 'rent'];

export default function AddPropertyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '', propertyType: 'apartment', purpose: 'sale',
    priceAmount: '', city: '', description: '',
    areaSqm: '', bedrooms: '', bathrooms: '', ownerPhone: '', visibility: 'public',
  });

  if (typeof window !== 'undefined' && !isAuthenticated()) {
    router.push('/login');
    return null;
  }

  const update = (k: string, v: string) => setForm({ ...form, [k]: v });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createProperty({
        title: form.title,
        propertyType: form.propertyType,
        purpose: form.purpose,
        priceAmount: form.priceAmount ? Number(form.priceAmount) : undefined,
        city: form.city || undefined,
        description: form.description || undefined,
        areaSqm: form.areaSqm ? Number(form.areaSqm) : undefined,
        bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
        ownerPhone: form.ownerPhone,
        visibility: form.visibility,
      });
      router.push('/properties');
    } catch (err: any) {
      setError(err.message || 'فشل إضافة العقار');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full bg-[#020907] border border-[#1e3028] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition';

  return (
    <div className="min-h-screen bg-[#020907]">
      <header className="border-b border-[#1e3028] bg-[#141f1a] p-4">
        <div className="max-w-2xl mx-auto">
          <a href="/properties" className="text-gray-400 hover:text-white transition text-sm">← العقارات</a>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 pt-8">
        <h1 className="text-2xl font-bold text-white mb-6">إضافة عقار جديد</h1>

        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-300 rounded-lg p-3 mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="bg-[#141f1a] border border-[#1e3028] rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">العنوان *</label>
            <input className={inputClass} value={form.title} onChange={(e) => update('title', e.target.value)} required placeholder="عنوان العقار" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">نوع العقار</label>
              <select className={inputClass} value={form.propertyType} onChange={(e) => update('propertyType', e.target.value)}>
                {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">الغرض</label>
              <select className={inputClass} value={form.purpose} onChange={(e) => update('purpose', e.target.value)}>
                {PURPOSES.map((p) => <option key={p} value={p}>{p === 'sale' ? 'بيع' : 'إيجار'}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">السعر (ر.س)</label>
              <input type="number" className={inputClass} value={form.priceAmount} onChange={(e) => update('priceAmount', e.target.value)} placeholder="مثال: 500000" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">المدينة</label>
              <input className={inputClass} value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="الرياض" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">الوصف</label>
            <textarea className={inputClass} rows={3} value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="وصف العقار" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">المساحة (م²)</label>
              <input type="number" className={inputClass} value={form.areaSqm} onChange={(e) => update('areaSqm', e.target.value)} placeholder="250" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">غرف النوم</label>
              <input type="number" className={inputClass} value={form.bedrooms} onChange={(e) => update('bedrooms', e.target.value)} placeholder="3" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">الحمامات</label>
              <input type="number" className={inputClass} value={form.bathrooms} onChange={(e) => update('bathrooms', e.target.value)} placeholder="2" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">رقم التواصل *</label>
              <input className={inputClass} value={form.ownerPhone} onChange={(e) => update('ownerPhone', e.target.value)} required placeholder="05xxxxxxxx" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">الظهور</label>
              <select className={inputClass} value={form.visibility} onChange={(e) => update('visibility', e.target.value)}>
                <option value="public">عام</option>
                <option value="private">خاص</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white rounded-lg py-3 font-semibold transition">
              {loading ? 'جاري الحفظ...' : 'إضافة العقار'}
            </button>
            <button type="button" onClick={() => router.push('/properties')} className="px-6 border border-[#1e3028] hover:border-gray-500 text-gray-400 rounded-lg py-3 transition">
              إلغاء
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
