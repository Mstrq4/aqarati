import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchReports, updateReportStatus } from '../api/client';
import { Eye, CheckCircle, XCircle, Clock, Search } from 'lucide-react';
import type { Report } from '@aqarati/shared';

interface ReportFull extends Report {
  reporter_name: string;
}

export default function Reports() {
  const { t } = useTranslation();
  const [reports, setReports] = useState<ReportFull[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<ReportFull | null>(null);
  const [resolution, setResolution] = useState('');

  const load = () => {
    setLoading(true);
    fetchReports(page, 10).then((res) => {
      setReports(res.data);
      setTotal(res.total);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [page]);

  const handleStatusChange = async (id: string, status: string, resolutionText?: string) => {
    await updateReportStatus(id, status, resolutionText);
    setViewing(null);
    setResolution('');
    load();
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'badge-warning',
      reviewing: 'badge-info',
      resolved: 'badge-success',
      dismissed: 'badge-muted',
    };
    const labels: Record<string, string> = {
      pending: 'قيد الانتظار',
      reviewing: 'قيد المراجعة',
      resolved: 'تم الحل',
      dismissed: 'مرفوض',
    };
    return <span className={`badge ${map[status]}`}>{labels[status]}</span>;
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">{t('admin.reports')}</h1>
        <p className="text-white/40 text-sm mt-1">إجمالي البلاغات: {total}</p>
      </div>

      {/* Detail Modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setViewing(null)} />
          <div className="relative bg-[#0a1a14] border border-[#1e3028] rounded-lg w-full max-w-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4">تفاصيل البلاغ</h2>
            <div className="space-y-3 text-sm">
              <div><span className="text-white/40">المُبلّغ:</span> <span className="text-white">{viewing.reporter_name}</span></div>
              <div><span className="text-white/40">السبب:</span> <span className="text-white">{viewing.reason}</span></div>
              {viewing.description && <div><span className="text-white/40">الوصف:</span> <span className="text-white">{viewing.description}</span></div>}
              {viewing.property_id && <div><span className="text-white/40">العقار:</span> <span className="text-white">{viewing.property_id}</span></div>}
              {viewing.user_id && <div><span className="text-white/40">المستخدم:</span> <span className="text-white">{viewing.user_id}</span></div>}
              <div>{statusBadge(viewing.status)}</div>
              {viewing.resolution && <div><span className="text-white/40">القرار:</span> <span className="text-white">{viewing.resolution}</span></div>}
            </div>

            {viewing.status === 'pending' || viewing.status === 'reviewing' ? (
              <div className="mt-4 space-y-3">
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="سبب القرار (اختياري)..."
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatusChange(viewing.id, 'reviewing')}
                    className="btn-secondary text-sm flex items-center gap-1"
                    disabled={viewing.status === 'reviewing'}
                  >
                    <Search size={14} /> بدء المراجعة
                  </button>
                  <button
                    onClick={() => handleStatusChange(viewing.id, 'resolved', resolution)}
                    className="btn-primary text-sm flex items-center gap-1"
                  >
                    <CheckCircle size={14} /> حل
                  </button>
                  <button
                    onClick={() => handleStatusChange(viewing.id, 'dismissed', resolution)}
                    className="btn-danger text-sm flex items-center gap-1"
                  >
                    <XCircle size={14} /> رفض
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <button onClick={() => setViewing(null)} className="btn-secondary text-sm w-full">{t('common.back')}</button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e3028]">
                <th className="text-right text-xs text-white/40 font-medium p-4">المُبلّغ</th>
                <th className="text-right text-xs text-white/40 font-medium p-4">السبب</th>
                <th className="text-right text-xs text-white/40 font-medium p-4">النوع</th>
                <th className="text-right text-xs text-white/40 font-medium p-4">الحالة</th>
                <th className="text-right text-xs text-white/40 font-medium p-4">التاريخ</th>
                <th className="text-right text-xs text-white/40 font-medium p-4">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center"><div className="animate-spin w-6 h-6 border-2 border-[#14b8a6] border-t-transparent rounded-full mx-auto" /></td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-white/30">{t('common.no_results')}</td></tr>
              ) : (
                reports.map((r) => (
                  <tr key={r.id} className="border-b border-[#1e3028]/50 hover:bg-white/[0.01]">
                    <td className="p-4 text-sm text-white">{r.reporter_name}</td>
                    <td className="p-4 text-sm text-white/60">{r.reason}</td>
                    <td className="p-4 text-sm text-white/50">
                      {r.property_id ? 'عقار' : r.user_id ? 'مستخدم' : '—'}
                    </td>
                    <td className="p-4">{statusBadge(r.status)}</td>
                    <td className="p-4 text-sm text-white/40">{r.created_at}</td>
                    <td className="p-4">
                      <button onClick={() => setViewing(r)} className="flex items-center gap-1 text-xs text-[#14b8a6] hover:text-[#2dd4bf] transition-colors">
                        <Eye size={14} /> عرض
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-white/40">صفحة {page}</span>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn-secondary text-sm disabled:opacity-30">السابق</button>
          <button disabled={page * 10 >= total} onClick={() => setPage(page + 1)} className="btn-secondary text-sm disabled:opacity-30">التالي</button>
        </div>
      </div>
    </div>
  );
}
