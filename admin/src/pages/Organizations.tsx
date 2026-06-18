import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchOrganizations } from '../api/client';
import { Building, Users } from 'lucide-react';

interface OrgFull {
  id: string; name: string; country_code: string; owner_user_id: string;
  status: string; created_at: string; member_count: number; owner_name: string;
}

export default function Organizations() {
  const { t } = useTranslation();
  const [orgs, setOrgs] = useState<OrgFull[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchOrganizations(page, 10).then((res) => {
      setOrgs(res.data);
      setTotal(res.total);
      setLoading(false);
    });
  }, [page]);

  const statusBadge = (status: string) => {
    if (status === 'active') return <span className="badge badge-success">نشط</span>;
    return <span className="badge badge-error">معلق</span>;
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">{t('admin.organizations')}</h1>
        <p className="text-white/40 text-sm mt-1">إجمالي المكاتب: {total}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex justify-center p-8">
            <div className="animate-spin w-8 h-8 border-2 border-[#14b8a6] border-t-transparent rounded-full" />
          </div>
        ) : orgs.length === 0 ? (
          <div className="col-span-full text-center p-8 text-white/30">{t('common.no_results')}</div>
        ) : (
          orgs.map((org) => (
            <div key={org.id} className="card card-hover p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#14b8a6]/15 flex items-center justify-center shrink-0">
                  <Building size={20} className="text-[#14b8a6]" />
                </div>
                <div>
                  <h3 className="text-white font-medium">{org.name}</h3>
                  <p className="text-xs text-white/40">{org.owner_name}</p>
                </div>
                <div className="mr-auto">{statusBadge(org.status)}</div>
              </div>
              <div className="flex items-center gap-4 text-sm text-white/40">
                <span className="flex items-center gap-1"><Users size={14} /> {org.member_count} أعضاء</span>
                <span>تأسس: {org.created_at}</span>
              </div>
            </div>
          ))
        )}
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
