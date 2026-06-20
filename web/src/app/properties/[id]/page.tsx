'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchProperty, isAuthenticated, type PropertyData } from '@/api/client';

export default function PropertyDetailPage() {
  const rawParams = useParams();
  const id = (rawParams?.id as string) || '';
  if (!id) return <div className="min-h-screen bg-[#020907] flex items-center justify-center text-red-400">معرف العقار غير صالح</div>;
  const router = useRouter();
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return; }
    fetchProperty(id)
      .then((p) => {
        if (!p) setError('العقار غير موجود');
        setProperty(p);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) return <div className="min-h-screen bg-[#020907] flex items-center justify-center text-gray-400">جاري التحميل...</div>;
  if (error) return <div className="min-h-screen bg-[#020907] flex items-center justify-center text-red-400">{error}</div>;
  if (!property) return null;

  return (
    <div className="min-h-screen bg-[#020907]">
      <header className="border-b border-[#1e3028] bg-[#141f1a] p-4">
        <div className="max-w-4xl mx-auto">
          <a href="/properties" className="text-gray-400 hover:text-white transition text-sm">← العقارات</a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 pt-8">
        <div className="bg-[#141f1a] border border-[#1e3028] rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">{property.title}</h1>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span className="bg-emerald-900/30 text-emerald-400 px-2 py-0.5 rounded-full text-xs">
                  {property.propertyType}
                </span>
                <span>{property.purpose === 'sale' ? 'للبيع' : property.purpose === 'rent' ? 'للإيجار' : property.purpose}</span>
                {property.city && <><span>•</span><span>{property.city}</span></>}
              </div>
            </div>
            <span className={`text-sm px-3 py-1 rounded-full ${
              property.status === 'active' ? 'bg-emerald-900/30 text-emerald-400' :
              property.status === 'draft' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-gray-800 text-gray-400'
            }`}>
              {property.status === 'active' ? 'نشط' : property.status === 'draft' ? 'مسودة' : property.status}
            </span>
          </div>

          {property.mainImageUrl && (
            <div className="rounded-lg overflow-hidden mb-6 bg-[#020907]">
              <img src={property.mainImageUrl} alt={property.title} className="w-full max-h-80 object-cover" />
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {property.priceAmount && (
              <div className="bg-[#020907] rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">السعر</p>
                <p className="text-lg font-bold text-emerald-400">{property.priceAmount.toLocaleString('ar-SA')} ر.س</p>
              </div>
            )}
            <div className="bg-[#020907] rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">النوع</p>
              <p className="text-white font-semibold">{property.propertyType}</p>
            </div>
            <div className="bg-[#020907] rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">الغرض</p>
              <p className="text-white font-semibold">{property.purpose === 'sale' ? 'بيع' : property.purpose === 'rent' ? 'إيجار' : property.purpose}</p>
            </div>
            <div className="bg-[#020907] rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">تاريخ الإضافة</p>
              <p className="text-white font-semibold text-sm">{new Date(property.createdAt).toLocaleDateString('ar-SA')}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
