'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchMyProperties, isAuthenticated, type PropertyData } from '@/api/client';
import { Home, Plus } from 'lucide-react';

export default function MyPropertiesPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return; }
    fetchMyProperties()
      .then(setProperties)
      .catch(() => setProperties([]))
      .finally(() => setLoading(false));
  }, [router]);

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      active: 'نشط', draft: 'مسودة', sold: 'مباع', rented: 'مؤجر', deleted: 'محذوف'
    };
    return map[s] || s;
  };

  return (
    <div className="min-h-screen bg-[#020907]">
      <header className="border-b border-[#1e3028] bg-[#141f1a] p-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/dashboard" className="text-gray-400 hover:text-white transition">← لوحة التحكم</a>
          </div>
          <a href="/properties/new" className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2">
            <Plus size={16} /> إضافة عقار
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 pt-8">
        <h1 className="text-2xl font-bold text-white mb-6">عقاراتي</h1>

        {loading ? (
          <div className="text-center text-gray-400 py-12">جاري التحميل...</div>
        ) : properties.length === 0 ? (
          <div className="text-center py-16">
            <Home size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg mb-4">لا توجد عقارات بعد</p>
            <a href="/properties/new" className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-semibold transition">
              <Plus size={18} /> إضافة أول عقار
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.map((p) => (
              <a
                key={p.id}
                href={`/properties/${p.id}`}
                className="bg-[#141f1a] border border-[#1e3028] rounded-xl overflow-hidden hover:border-emerald-500 transition group"
              >
                <div className="h-40 bg-gradient-to-br from-emerald-900/30 to-[#141f1a] flex items-center justify-center">
                  {p.mainImageUrl ? (
                    <img src={p.mainImageUrl} alt={p.title} className="w-full h-full object-cover" />
                  ) : (
                    <Home size={48} className="text-gray-600 group-hover:text-emerald-600 transition" />
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-white font-semibold group-hover:text-emerald-400 transition line-clamp-1">
                      {p.title}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      p.status === 'active' ? 'bg-emerald-900/30 text-emerald-400' :
                      p.status === 'draft' ? 'bg-yellow-900/30 text-yellow-400' :
                      'bg-gray-900/30 text-gray-400'
                    }`}>
                      {statusLabel(p.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>{p.propertyType}</span>
                    <span>•</span>
                    <span>{p.purpose}</span>
                    {p.city && <><span>•</span><span>{p.city}</span></>}
                  </div>
                  {p.priceAmount && (
                    <p className="text-emerald-400 font-semibold mt-2">
                      {p.priceAmount.toLocaleString('ar-SA')} ر.س
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
