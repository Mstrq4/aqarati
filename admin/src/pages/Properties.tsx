import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchProperties } from '../api/client';
import { Search } from 'lucide-react';
import type { Property, PropertyLocation, PropertyDetails, PropertyPrice } from '@aqarati/shared';

type PropertyFull = Property & { location: any; details: any; price: any };

export default function Properties() {
  const { t } = useTranslation();
  const [properties, setProperties] = useState<PropertyFull[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetchProperties(page, 10, search, statusFilter, visibilityFilter).then((res) => {
      setProperties(res.data);
      setTotal(res.total);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [page, statusFilter, visibilityFilter]);

  const handleSearch = () => { setPage(1); load(); };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: 'badge-success',
      draft: 'badge-muted',
      reserved: 'badge-warning',
      sold: 'badge-info',
      rented: 'badge-info',
      archived: 'badge-muted',
    };
    const labels: Record<string, string> = {
      active: 'نشط', draft: 'مسودة', reserved: 'محجوز',
      sold: 'مباع', rented: 'مؤجر', archived: 'مؤرشف',
    };
    return <span className={`badge ${map[status] || 'badge-muted'}`}>{labels[status] || status}</span>;
  };

  const purposeLabel = (p: string) => {
    const map: Record<string, string> = { sale: 'بيع', rent: 'إيجار', investment: 'استثمار' };
    return map[p] || p;
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">{t('admin.properties')}</h1>
        <p className="text-white/40 text-sm mt-1">إجمالي العقارات: {total}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder={t('common.search') + '...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="input-field pr-9"
          />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input-field w-auto">
          <option value="">كل الحالات</option>
          <option value="active">نشط</option><option value="draft">مسودة</option>
          <option value="reserved">محجوز</option><option value="sold">مباع</option>
          <option value="rented">مؤجر</option><option value="archived">مؤرشف</option>
        </select>
        <select value={visibilityFilter} onChange={(e) => { setVisibilityFilter(e.target.value); setPage(1); }} className="input-field w-auto">
          <option value="">كل أنواع الظهور</option>
          <option value="public">عام</option><option value="private">خاص</option><option value="organization">المكتب</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e3028]">
                <th className="text-right text-xs text-white/40 font-medium p-4">العقار</th>
                <th className="text-right text-xs text-white/40 font-medium p-4">النوع/الغرض</th>
                <th className="text-right text-xs text-white/40 font-medium p-4">المدينة</th>
                <th className="text-right text-xs text-white/40 font-medium p-4">السعر</th>
                <th className="text-right text-xs text-white/40 font-medium p-4">الحالة</th>
                <th className="text-right text-xs text-white/40 font-medium p-4">الظهور</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center"><div className="animate-spin w-6 h-6 border-2 border-[#14b8a6] border-t-transparent rounded-full mx-auto" /></td></tr>
              ) : properties.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-white/30">{t('common.no_results')}</td></tr>
              ) : (
                properties.map((p) => (
                  <tr key={p.id} className="border-b border-[#1e3028]/50 hover:bg-white/[0.01]">
                    <td className="p-4">
                      <p className="text-sm text-white font-medium">{p.title}</p>
                      <p className="text-xs text-white/30 mt-0.5">{p.id}</p>
                    </td>
                    <td className="p-4 text-sm text-white/60">
                      <span>{p.property_type}</span>
                      <span className="mx-1.5 text-white/20">·</span>
                      <span>{purposeLabel(p.purpose)}</span>
                    </td>
                    <td className="p-4 text-sm text-white/60">{p.location?.city || '—'}</td>
                    <td className="p-4 text-sm text-white/60">
                      {p.price?.price_amount?.toLocaleString('ar-SA') || '—'} ر.س
                    </td>
                    <td className="p-4">{statusBadge(p.status)}</td>
                    <td className="p-4 text-sm text-white/50">{p.visibility}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-white/40">عرض {(page - 1) * 10 + 1} - {Math.min(page * 10, total)} من {total}</span>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn-secondary text-sm disabled:opacity-30">السابق</button>
          <button disabled={page * 10 >= total} onClick={() => setPage(page + 1)} className="btn-secondary text-sm disabled:opacity-30">التالي</button>
        </div>
      </div>
    </div>
  );
}
