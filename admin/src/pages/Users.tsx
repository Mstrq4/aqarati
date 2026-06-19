import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchUsers, suspendUser, deleteUser } from '../api/client';
import { Search, Filter, MoreVertical, Ban, Trash2, CheckCircle } from 'lucide-react';
import type { User, UserProfile } from '../shared';

type UserWithProfile = User & { profile: UserProfile };

export default function Users() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetchUsers(page, 10, search, statusFilter).then((res) => {
      setUsers(res.data);
      setTotal(res.total);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [page, statusFilter]);

  const handleSearch = () => { setPage(1); load(); };

  const handleSuspend = async (id: string) => {
    await suspendUser(id);
    setActionMenu(null);
    load();
  };

  const handleDelete = async (id: string) => {
    await deleteUser(id);
    setActionMenu(null);
    load();
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: 'badge-success',
      suspended: 'badge-error',
      deleted: 'badge-muted',
    };
    const labels: Record<string, string> = {
      active: 'نشط',
      suspended: 'معلق',
      deleted: 'محذوف',
    };
    return <span className={`badge ${map[status] || 'badge-muted'}`}>{labels[status] || status}</span>;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('admin.users')}</h1>
          <p className="text-white/40 text-sm mt-1">إجمالي المستخدمين: {total}</p>
        </div>
      </div>

      {/* Filters */}
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
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input-field w-auto"
        >
          <option value="">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="suspended">معلق</option>
          <option value="deleted">محذوف</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e3028]">
                <th className="text-right text-xs text-white/40 font-medium p-4">المستخدم</th>
                <th className="text-right text-xs text-white/40 font-medium p-4">البريد الإلكتروني</th>
                <th className="text-right text-xs text-white/40 font-medium p-4">رقم الجوال</th>
                <th className="text-right text-xs text-white/40 font-medium p-4">الحالة</th>
                <th className="text-right text-xs text-white/40 font-medium p-4">تاريخ التسجيل</th>
                <th className="text-right text-xs text-white/40 font-medium p-4">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-white/30">
                    <div className="animate-spin w-6 h-6 border-2 border-[#14b8a6] border-t-transparent rounded-full mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-white/30">{t('common.no_results')}</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-[#1e3028]/50 hover:bg-white/[0.01]">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#14b8a6]/20 flex items-center justify-center text-sm font-bold text-[#14b8a6]">
                          {u.profile.full_name.charAt(0)}
                        </div>
                        <span className="text-sm text-white">{u.profile.full_name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-white/60">{u.email}</td>
                    <td className="p-4 text-sm text-white/60" dir="ltr">{u.phone}</td>
                    <td className="p-4">{statusBadge(u.status)}</td>
                    <td className="p-4 text-sm text-white/40">{u.created_at}</td>
                    <td className="p-4 relative">
                      <button
                        onClick={() => setActionMenu(actionMenu === u.id ? null : u.id)}
                        className="p-1.5 rounded hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button>
                      {actionMenu === u.id && (
                        <div className="absolute left-0 top-10 z-10 w-40 bg-[#1c2d26] border border-[#1e3028] rounded-md shadow-xl overflow-hidden">
                          {u.status !== 'suspended' ? (
                            <button onClick={() => handleSuspend(u.id)} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-yellow-400 hover:bg-white/5">
                              <Ban size={14} /> تعليق
                            </button>
                          ) : (
                            <button onClick={() => handleSuspend(u.id)} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-green-400 hover:bg-white/5">
                              <CheckCircle size={14} /> تفعيل
                            </button>
                          )}
                          <button onClick={() => handleDelete(u.id)} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-white/5">
                            <Trash2 size={14} /> حذف
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-white/40">
          عرض {(page - 1) * 10 + 1} - {Math.min(page * 10, total)} من {total}
        </span>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn-secondary text-sm disabled:opacity-30">السابق</button>
          <button disabled={page * 10 >= total} onClick={() => setPage(page + 1)} className="btn-secondary text-sm disabled:opacity-30">التالي</button>
        </div>
      </div>
    </div>
  );
}
