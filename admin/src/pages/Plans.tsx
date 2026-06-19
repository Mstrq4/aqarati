import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchPlans, createPlan, updatePlan, deletePlan } from '../api/client';
import { Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import type { Plan } from '@aqarati/shared';

const emptyPlan: Omit<Plan, 'id' | 'created_at'> = {
  name: '', tier: 'free', price_monthly_sar: 0, price_yearly_sar: 0,
  max_properties: 0, max_images_per_property: 0, max_organization_members: 1,
  max_saved_searches: 0, ai_enabled: false, export_enabled: false,
  features: [], is_active: true,
};

export default function Plans() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<typeof emptyPlan>({ ...emptyPlan });
  const [featureInput, setFeatureInput] = useState('');

  const load = async () => {
    setLoading(true);
    const data = await fetchPlans();
    setPlans(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({ ...emptyPlan, tier: 'free' });
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (plan: Plan) => {
    setForm({
      name: plan.name, tier: plan.tier, price_monthly_sar: plan.price_monthly_sar,
      price_yearly_sar: plan.price_yearly_sar, max_properties: plan.max_properties,
      max_images_per_property: plan.max_images_per_property,
      max_organization_members: plan.max_organization_members,
      max_saved_searches: plan.max_saved_searches, ai_enabled: plan.ai_enabled,
      export_enabled: plan.export_enabled, features: [...plan.features],
      is_active: plan.is_active,
    });
    setEditing(plan);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (editing) {
      await updatePlan(editing.id, form);
    } else {
      await createPlan(form);
    }
    setShowForm(false);
    setEditing(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الباقة؟')) {
      await deletePlan(id);
      load();
    }
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setForm({ ...form, features: [...form.features, featureInput.trim()] });
      setFeatureInput('');
    }
  };

  const tierColors: Record<string, string> = {
    free: 'badge-muted', pro: 'badge-info', office: 'badge-warning',
  };
  const tierLabels: Record<string, string> = {
    free: 'مجاني', pro: 'احترافي', office: 'مكتب',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-[#14b8a6] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('admin.plans')}</h1>
          <p className="text-white/40 text-sm mt-1">إدارة باقات الاشتراك</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> {t('admin.add_plan')}
        </button>
      </div>

      {/* Plan form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowForm(false)} />
          <div className="relative bg-[#0a1a14] border border-[#1e3028] rounded-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">
                {editing ? t('admin.edit_plan') : t('admin.add_plan')}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-white/50 mb-1 block">اسم الباقة</label>
                <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">المستوى</label>
                <select className="input-field" value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value as any })}>
                  <option value="free">مجاني</option>
                  <option value="pro">احترافي</option>
                  <option value="office">مكتب</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/50 mb-1 block">السعر الشهري (ر.س)</label>
                  <input type="number" className="input-field" value={form.price_monthly_sar} onChange={(e) => setForm({ ...form, price_monthly_sar: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">السعر السنوي (ر.س)</label>
                  <input type="number" className="input-field" value={form.price_yearly_sar} onChange={(e) => setForm({ ...form, price_yearly_sar: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/50 mb-1 block">عدد العقارات</label>
                  <input type="number" className="input-field" value={form.max_properties} onChange={(e) => setForm({ ...form, max_properties: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">الصور لكل عقار</label>
                  <input type="number" className="input-field" value={form.max_images_per_property} onChange={(e) => setForm({ ...form, max_images_per_property: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/50 mb-1 block">أعضاء المكتب</label>
                  <input type="number" className="input-field" value={form.max_organization_members} onChange={(e) => setForm({ ...form, max_organization_members: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">البحوث المحفوظة</label>
                  <input type="number" className="input-field" value={form.max_saved_searches} onChange={(e) => setForm({ ...form, max_saved_searches: Number(e.target.value) })} />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-white/70">
                  <input type="checkbox" checked={form.ai_enabled} onChange={(e) => setForm({ ...form, ai_enabled: e.target.checked })} className="accent-[#14b8a6]" />
                  ذكاء اصطناعي
                </label>
                <label className="flex items-center gap-2 text-sm text-white/70">
                  <input type="checkbox" checked={form.export_enabled} onChange={(e) => setForm({ ...form, export_enabled: e.target.checked })} className="accent-[#14b8a6]" />
                  تصدير البيانات
                </label>
                <label className="flex items-center gap-2 text-sm text-white/70">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="accent-[#14b8a6]" />
                  نشطة
                </label>
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">الميزات</label>
                <div className="flex gap-2 mb-2">
                  <input className="input-field flex-1" value={featureInput} onChange={(e) => setFeatureInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addFeature()} placeholder="أضف ميزة..." />
                  <button onClick={addFeature} className="btn-secondary text-xs">إضافة</button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {form.features.map((f, i) => (
                    <span key={i} className="badge badge-info flex items-center gap-1">
                      {f}
                      <button onClick={() => setForm({ ...form, features: form.features.filter((_, j) => j !== i) })} className="hover:text-red-400">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">{t('common.cancel')}</button>
              <button onClick={handleSave} className="btn-primary text-sm flex items-center gap-1"><Save size={14} /> {t('common.save')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div key={plan.id} className={`card p-5 ${!plan.is_active ? 'opacity-50' : ''}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-white font-bold text-lg">{plan.name}</h3>
                <span className={`badge ${tierColors[plan.tier]} mt-1`}>{tierLabels[plan.tier]}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(plan)} className="p-1.5 rounded hover:bg-white/5 text-white/40 hover:text-white/80 transition-colors">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleDelete(plan.id)} className="p-1.5 rounded hover:bg-white/5 text-white/40 hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="text-2xl font-bold text-white mb-1">
              {plan.price_monthly_sar} <span className="text-sm text-white/40">ر.س/شهر</span>
            </div>
            <p className="text-xs text-white/30 mb-3">{plan.price_yearly_sar} ر.س/سنة</p>

            <div className="space-y-1.5 mb-3">
              <p className="text-sm text-white/50">{plan.max_properties} عقار</p>
              <p className="text-sm text-white/50">{plan.max_images_per_property} صورة لكل عقار</p>
              <p className="text-sm text-white/50">{plan.max_organization_members} عضو في المكتب</p>
              <p className="text-sm text-white/50">{plan.max_saved_searches} بحث محفوظ</p>
            </div>

            {plan.features.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {plan.features.map((f, i) => (
                  <span key={i} className="badge badge-success text-xs">{f}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
