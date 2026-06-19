import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchAuditLogs } from '../api/client';
import type { AdminAuditLog } from '../shared';

export default function AuditLog() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchAuditLogs(page, 15).then((res) => {
      setLogs(res.data);
      setTotal(res.total);
      setLoading(false);
    });
  }, [page]);

  const actionLabel = (action: string) => {
    const map: Record<string, string> = {
      create: 'إنشاء', update: 'تحديث', delete: 'حذف', suspend: 'تعليق', activate: 'تفعيل',
    };
    return map[action] || action;
  };

  const actionColor = (action: string) => {
    const map: Record<string, string> = {
      create: 'text-green-400', update: 'text-blue-400', delete: 'text-red-400', suspend: 'text-yellow-400', activate: 'text-green-400',
    };
    return map[action] || 'text-white/50';
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">{t('admin.audit_log')}</h1>
        <p className="text-white/40 text-sm mt-1">إجمالي السجلات: {total}</p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e3028]">
                <th className="text-right text-xs text-white/40 font-medium p-4">الإجراء</th>
                <th className="text-right text-xs text-white/40 font-medium p-4">النوع</th>
                <th className="text-right text-xs text-white/40 font-medium p-4">المعرف</th>
                <th className="text-right text-xs text-white/40 font-medium p-4">IP</th>
                <th className="text-right text-xs text-white/40 font-medium p-4">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center"><div className="animate-spin w-6 h-6 border-2 border-[#14b8a6] border-t-transparent rounded-full mx-auto" /></td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-white/30">{t('common.no_results')}</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-[#1e3028]/50 hover:bg-white/[0.01]">
                    <td className="p-4">
                      <span className={`text-sm font-medium ${actionColor(log.action)}`}>
                        {actionLabel(log.action)}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-white/50">{log.target_type}</td>
                    <td className="p-4 text-sm text-white/40 font-mono text-xs">{log.target_id || '—'}</td>
                    <td className="p-4 text-sm text-white/40 font-mono text-xs">{log.ip_address || '—'}</td>
                    <td className="p-4 text-sm text-white/40">
                      {new Date(log.created_at).toLocaleString('ar-SA')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-white/40">صفحة {page} من {Math.ceil(total / 15)}</span>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn-secondary text-sm disabled:opacity-30">السابق</button>
          <button disabled={page * 15 >= total} onClick={() => setPage(page + 1)} className="btn-secondary text-sm disabled:opacity-30">التالي</button>
        </div>
      </div>
    </div>
  );
}
