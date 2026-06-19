import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  fetchAdminPlans, adminCreatePlan, adminUpdatePlan,
  adminArchivePlan, adminDeletePlan,
  adminSetPlanFeatured, adminSetPlanPopular, adminSetPlanRecommended,
  adminSetPlanVisibility,
  type PlanDetail, type PlanFeature,
} from '../api/client';
import {
  Plus, Edit2, Trash2, X, Save, Archive, Eye, EyeOff,
  Star, TrendingUp, Award, GripVertical,
} from 'lucide-react';

// ─── Form State ──────────────────────────────────────────

interface PlanForm {
  name: string; nameAr: string; nameEn: string; slug: string; tier: string;
  description: string; descriptionAr: string; descriptionEn: string;
  priceMonthlySar: number; priceYearlySar: number;
  maxProperties: number; maxImagesPerProperty: number;
  maxTotalImages: number; maxStorageMb: number;
  maxOrganizationMembers: number; maxTeamMembers: number;
  maxSavedSearches: number; maxAiRequestsPerMonth: number;
  aiEnabled: boolean; exportEnabled: boolean;
  supportLevel: string; visibility: string;
  displayOrder: number; trialDays: number;
  isFeatured: boolean; isPopular: boolean; isRecommended: boolean;
  badgeLabelAr: string; badgeLabelEn: string;
  features: string[];
}

const emptyForm: PlanForm = {
  name: '', nameAr: '', nameEn: '', slug: '', tier: 'free',
  description: '', descriptionAr: '', descriptionEn: '',
  priceMonthlySar: 0, priceYearlySar: 0,
  maxProperties: 10, maxImagesPerProperty: 5,
  maxTotalImages: 50, maxStorageMb: 100,
  maxOrganizationMembers: 1, maxTeamMembers: 1,
  maxSavedSearches: 3, maxAiRequestsPerMonth: 50,
  aiEnabled: false, exportEnabled: false,
  supportLevel: 'basic', visibility: 'public',
  displayOrder: 0, trialDays: 0,
  isFeatured: false, isPopular: false, isRecommended: false,
  badgeLabelAr: '', badgeLabelEn: '',
  features: [],
};

function planToForm(p: PlanDetail): PlanForm {
  return {
    name: p.name || '', nameAr: p.nameAr || '', nameEn: p.nameEn || '',
    slug: p.slug || '', tier: p.tier || 'free',
    description: p.description || '', descriptionAr: p.descriptionAr || '',
    descriptionEn: p.descriptionEn || '',
    priceMonthlySar: p.priceMonthlySar ?? 0, priceYearlySar: p.priceYearlySar ?? 0,
    maxProperties: p.maxProperties ?? 10, maxImagesPerProperty: p.maxImagesPerProperty ?? 5,
    maxTotalImages: p.maxTotalImages ?? 50, maxStorageMb: p.maxStorageMb ?? 100,
    maxOrganizationMembers: p.maxOrganizationMembers ?? 1,
    maxTeamMembers: p.maxTeamMembers ?? 1,
    maxSavedSearches: p.maxSavedSearches ?? 3,
    maxAiRequestsPerMonth: p.maxAiRequestsPerMonth ?? 50,
    aiEnabled: p.aiEnabled ?? false, exportEnabled: p.exportEnabled ?? false,
    supportLevel: p.supportLevel || 'basic', visibility: p.visibility || 'public',
    displayOrder: p.displayOrder ?? 0, trialDays: p.trialDays ?? 0,
    isFeatured: p.isFeatured ?? false, isPopular: p.isPopular ?? false,
    isRecommended: p.isRecommended ?? false,
    badgeLabelAr: p.badgeLabelAr || '', badgeLabelEn: p.badgeLabelEn || '',
    features: p.features || [],
  };
}

// ─── Component ───────────────────────────────────────────

export default function Plans() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<PlanDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PlanForm>({ ...emptyForm });
  const [featureInput, setFeatureInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminPlans();
      setPlans(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load plans');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // ─── Form handlers ────────────────────────────────────

  const openCreate = () => {
    setForm({ ...emptyForm, tier: 'free' });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (plan: PlanDetail) => {
    setForm(planToForm(plan));
    setEditingId(plan.id);
    setShowForm(true);
  };

  const set = (field: keyof PlanForm, value: any) => setForm(f => ({ ...f, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const input: any = { ...form };
      // Remove empty slug to let backend auto-generate
      if (!input.slug) delete input.slug;
      if (editingId) {
        // Only send changed fields for update
        await adminUpdatePlan(editingId, input);
        showToast('success', t('admin.plan_updated'));
      } else {
        await adminCreatePlan(input);
        showToast('success', t('admin.plan_created'));
      }
      setShowForm(false);
      setEditingId(null);
      load();
    } catch (e: any) {
      showToast('error', e.message || 'Save failed');
    }
    setSaving(false);
  };

  // ─── Plan actions ──────────────────────────────────────

  const handleArchive = async (plan: PlanDetail) => {
    if (!confirm(t('admin.plan_delete_confirm'))) return;
    try {
      await adminArchivePlan(plan.id);
      showToast('success', t('admin.plan_archived'));
      load();
    } catch (e: any) { showToast('error', e.message); }
  };

  const handleDelete = async (plan: PlanDetail) => {
    if (!confirm(t('admin.plan_delete_confirm'))) return;
    try {
      await adminDeletePlan(plan.id);
      showToast('success', t('admin.plan_deleted'));
      load();
    } catch (e: any) {
      showToast('error', e.message || t('admin.plan_delete_blocked'));
    }
  };

  const toggleFeatured = async (plan: PlanDetail) => {
    try { await adminSetPlanFeatured(plan.id, !plan.isFeatured); load(); }
    catch (e: any) { showToast('error', e.message); }
  };

  const togglePopular = async (plan: PlanDetail) => {
    try { await adminSetPlanPopular(plan.id, !plan.isPopular); load(); }
    catch (e: any) { showToast('error', e.message); }
  };

  const toggleRecommended = async (plan: PlanDetail) => {
    try { await adminSetPlanRecommended(plan.id, !plan.isRecommended); load(); }
    catch (e: any) { showToast('error', e.message); }
  };

  const toggleVisibility = async (plan: PlanDetail) => {
    const next = plan.visibility === 'public' ? 'hidden' : 'public';
    try { await adminSetPlanVisibility(plan.id, next); load(); }
    catch (e: any) { showToast('error', e.message); }
  };

  const addFeature = () => {
    const f = featureInput.trim();
    if (!f) return;
    setForm({ ...form, features: [...form.features, f] });
    setFeatureInput('');
  };

  const removeFeature = (idx: number) => {
    setForm({ ...form, features: form.features.filter((_, i) => i !== idx) });
  };

  // ─── Helper: badge styles ──────────────────────────────

  const statusBadge = (status?: string | null) => {
    const map: Record<string, string> = {
      active: 'badge-success', draft: 'badge-muted',
      archived: 'badge-warning',
    };
    return `badge ${map[status || ''] || 'badge-muted'}`;
  };

  const tierBadge = (tier: string) => {
    const map: Record<string, string> = { free: 'badge-muted', pro: 'badge-info', office: 'badge-warning' };
    return `badge ${map[tier] || 'badge-muted'}`;
  };

  // ─── Render ────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="skeleton w-8 h-8 rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p style={{ color: 'var(--aq-danger)' }} className="text-sm">{error}</p>
        <button onClick={load} className="btn-secondary text-sm">{t('common.retry')}</button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--aq-text-primary)' }}>
            {t('admin.plans')}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--aq-text-muted)' }}>
            {t('subscription.current_plan')}
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> {t('admin.add_plan')}
        </button>
      </div>

      {/* Empty state */}
      {plans.length === 0 && (
        <div className="card p-8 text-center">
          <p style={{ color: 'var(--aq-text-muted)' }} className="mb-3">{t('admin.plan_no_plans')}</p>
          <button onClick={openCreate} className="btn-primary text-sm">{t('admin.plan_create_first')}</button>
        </div>
      )}

      {/* Plans table */}
      {plans.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ direction: 'inherit' }}>
              <thead>
                <tr style={{ borderBottomColor: 'var(--aq-border)', borderBottomWidth: '1px' }}>
                  <th className="p-3 text-start" style={{ color: 'var(--aq-text-muted)' }}>
                    {t('admin.plan_name')}
                  </th>
                  <th className="p-3 text-start" style={{ color: 'var(--aq-text-muted)' }}>
                    {t('admin.plan_tier')}
                  </th>
                  <th className="p-3 text-start" style={{ color: 'var(--aq-text-muted)' }}>
                    {t('admin.plan_price_monthly')}
                  </th>
                  <th className="p-3 text-start" style={{ color: 'var(--aq-text-muted)' }}>
                    {t('admin.plan_status')}
                  </th>
                  <th className="p-3 text-start" style={{ color: 'var(--aq-text-muted)' }}>
                    {t('admin.plan_display_order')}
                  </th>
                  <th className="p-3 text-start" style={{ color: 'var(--aq-text-muted)' }}>
                  </th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr
                    key={plan.id}
                    style={{ borderBottomColor: 'var(--aq-border-subtle)', borderBottomWidth: '1px' }}
                    className="transition-colors"
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--aq-surface-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                  >
                    <td className="p-3" style={{ color: 'var(--aq-text-primary)' }}>
                      <div className="font-medium">{plan.nameAr || plan.name}</div>
                      {plan.slug && (
                        <span style={{ color: 'var(--aq-text-muted)', fontSize: '12px' }}>
                          /{plan.slug}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={tierBadge(plan.tier)}>
                        {plan.tier}
                      </span>
                    </td>
                    <td className="p-3" style={{ color: 'var(--aq-text-primary)' }}>
                      {plan.priceMonthlySar ? (
                        <span>{plan.priceMonthlySar} {t('property.currency')}</span>
                      ) : (
                        <span style={{ color: 'var(--aq-text-muted)' }}>—</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className={statusBadge(plan.status)}>
                          {plan.status || 'active'}
                        </span>
                        {plan.isFeatured && (
                          <span className="badge badge-warning flex items-center gap-1">
                            <Star size={10} /> {t('admin.plan_featured')}
                          </span>
                        )}
                        {plan.isPopular && (
                          <span className="badge badge-info flex items-center gap-1">
                            <TrendingUp size={10} /> {t('admin.plan_popular')}
                          </span>
                        )}
                        {plan.isRecommended && (
                          <span className="badge badge-success flex items-center gap-1">
                            <Award size={10} /> {t('admin.plan_recommended')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3" style={{ color: 'var(--aq-text-secondary)' }}>
                      {plan.displayOrder ?? '—'}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        {/* Edit */}
                        <button
                          onClick={() => openEdit(plan)}
                          className="p-1.5 rounded transition-colors"
                          style={{ color: 'var(--aq-text-muted)' }}
                          title={t('admin.edit_plan')}
                        >
                          <Edit2 size={14} />
                        </button>
                        {/* Featured */}
                        <button
                          onClick={() => toggleFeatured(plan)}
                          className="p-1.5 rounded transition-colors"
                          style={{ color: plan.isFeatured ? 'var(--aq-warning)' : 'var(--aq-text-muted)' }}
                          title={t('admin.plan_featured')}
                        >
                          <Star size={14} />
                        </button>
                        {/* Popular */}
                        <button
                          onClick={() => togglePopular(plan)}
                          className="p-1.5 rounded transition-colors"
                          style={{ color: plan.isPopular ? 'var(--aq-info)' : 'var(--aq-text-muted)' }}
                          title={t('admin.plan_popular')}
                        >
                          <TrendingUp size={14} />
                        </button>
                        {/* Recommended */}
                        <button
                          onClick={() => toggleRecommended(plan)}
                          className="p-1.5 rounded transition-colors"
                          style={{ color: plan.isRecommended ? 'var(--aq-success)' : 'var(--aq-text-muted)' }}
                          title={t('admin.plan_recommended')}
                        >
                          <Award size={14} />
                        </button>
                        {/* Visibility */}
                        <button
                          onClick={() => toggleVisibility(plan)}
                          className="p-1.5 rounded transition-colors"
                          style={{ color: 'var(--aq-text-muted)' }}
                          title={plan.visibility === 'public' ? 'Hide' : 'Show'}
                        >
                          {plan.visibility === 'public' ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                        {/* Archive */}
                        <button
                          onClick={() => handleArchive(plan)}
                          className="p-1.5 rounded transition-colors"
                          style={{ color: 'var(--aq-text-muted)' }}
                          title={t('admin.archive_plan')}
                        >
                          <Archive size={14} />
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(plan)}
                          className="p-1.5 rounded transition-colors"
                          style={{ color: 'var(--aq-text-muted)' }}
                          title={t('admin.delete_plan')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Modal Form ─────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowForm(false)} />
          <div
            className="relative w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto"
            style={{
              backgroundColor: 'var(--aq-surface)',
              borderColor: 'var(--aq-border)',
              borderWidth: '1px',
              borderRadius: 'var(--aq-radius-lg)',
            }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: 'var(--aq-text-primary)' }}>
                {editingId ? t('admin.edit_plan') : t('admin.add_plan')}
              </h2>
              <button onClick={() => setShowForm(false)} style={{ color: 'var(--aq-text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Plan names */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--aq-text-muted)' }}>
                    {t('admin.plan_name_ar')}
                  </label>
                  <input className="input-field" value={form.nameAr} onChange={(e) => set('nameAr', e.target.value)}
                    placeholder={t('admin.plan_name_ar')} />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--aq-text-muted)' }}>
                    {t('admin.plan_name_en')}
                  </label>
                  <input className="input-field" value={form.nameEn} onChange={(e) => set('nameEn', e.target.value)}
                    placeholder={t('admin.plan_name_en')} />
                </div>
              </div>

              {/* Slug + Tier */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--aq-text-muted)' }}>
                    {t('admin.plan_slug')}
                  </label>
                  <input className="input-field" value={form.slug} onChange={(e) => set('slug', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--aq-text-muted)' }}>
                    {t('admin.plan_tier')}
                  </label>
                  <select className="input-field" value={form.tier} onChange={(e) => set('tier', e.target.value)}>
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="office">Office</option>
                  </select>
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--aq-text-muted)' }}>
                    {t('admin.plan_price_monthly')}
                  </label>
                  <input type="number" className="input-field" value={form.priceMonthlySar}
                    onChange={(e) => set('priceMonthlySar', Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--aq-text-muted)' }}>
                    {t('admin.plan_price_yearly')}
                  </label>
                  <input type="number" className="input-field" value={form.priceYearlySar}
                    onChange={(e) => set('priceYearlySar', Number(e.target.value))} />
                </div>
              </div>

              {/* Quotas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--aq-text-muted)' }}>
                    {t('admin.plan_quota_properties')}
                  </label>
                  <input type="number" className="input-field" value={form.maxProperties}
                    onChange={(e) => set('maxProperties', Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--aq-text-muted)' }}>
                    {t('admin.plan_quota_images')}
                  </label>
                  <input type="number" className="input-field" value={form.maxImagesPerProperty}
                    onChange={(e) => set('maxImagesPerProperty', Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--aq-text-muted)' }}>
                    {t('admin.plan_quota_members')}
                  </label>
                  <input type="number" className="input-field" value={form.maxOrganizationMembers}
                    onChange={(e) => set('maxOrganizationMembers', Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--aq-text-muted)' }}>
                    {t('admin.plan_quota_searches')}
                  </label>
                  <input type="number" className="input-field" value={form.maxSavedSearches}
                    onChange={(e) => set('maxSavedSearches', Number(e.target.value))} />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--aq-text-secondary)' }}>
                  <input type="checkbox" checked={form.aiEnabled} onChange={(e) => set('aiEnabled', e.target.checked)}
                    style={{ accentColor: 'var(--aq-brand)' }} />
                  {t('admin.plan_ai_enabled')}
                </label>
                <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--aq-text-secondary)' }}>
                  <input type="checkbox" checked={form.exportEnabled} onChange={(e) => set('exportEnabled', e.target.checked)}
                    style={{ accentColor: 'var(--aq-brand)' }} />
                  {t('admin.plan_export_enabled')}
                </label>
                <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--aq-text-secondary)' }}>
                  <input type="checkbox" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)}
                    style={{ accentColor: 'var(--aq-brand)' }} />
                  {t('admin.plan_featured')}
                </label>
                <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--aq-text-secondary)' }}>
                  <input type="checkbox" checked={form.isPopular} onChange={(e) => set('isPopular', e.target.checked)}
                    style={{ accentColor: 'var(--aq-brand)' }} />
                  {t('admin.plan_popular')}
                </label>
                <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--aq-text-secondary)' }}>
                  <input type="checkbox" checked={form.isRecommended} onChange={(e) => set('isRecommended', e.target.checked)}
                    style={{ accentColor: 'var(--aq-brand)' }} />
                  {t('admin.plan_recommended')}
                </label>
              </div>

              {/* Display order + trial + visibility */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--aq-text-muted)' }}>
                    {t('admin.plan_display_order')}
                  </label>
                  <input type="number" className="input-field" value={form.displayOrder}
                    onChange={(e) => set('displayOrder', Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--aq-text-muted)' }}>
                    {t('admin.plan_trial_days')}
                  </label>
                  <input type="number" className="input-field" value={form.trialDays}
                    onChange={(e) => set('trialDays', Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--aq-text-muted)' }}>
                    {t('admin.plan_visibility')}
                  </label>
                  <select className="input-field" value={form.visibility}
                    onChange={(e) => set('visibility', e.target.value)}>
                    <option value="public">Public</option>
                    <option value="internal">Internal</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </div>
              </div>

              {/* Features */}
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--aq-text-muted)' }}>
                  {t('admin.plan_features')}
                </label>
                <div className="flex gap-2 mb-2">
                  <input className="input-field flex-1" value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addFeature()}
                    placeholder={t('admin.plan_add_feature')} />
                  <button onClick={addFeature} className="btn-secondary text-xs">
                    {t('common.add')}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {form.features.map((f, i) => (
                    <span key={i} className="badge badge-info flex items-center gap-1">
                      {f}
                      <button onClick={() => removeFeature(i)} style={{ color: 'var(--aq-danger)' }}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">
                {t('common.cancel')}
              </button>
              <button onClick={handleSave} disabled={saving}
                className="btn-primary text-sm flex items-center gap-1">
                <Save size={14} /> {saving ? t('common.loading') : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 z-50 flex justify-center w-full pointer-events-none"
          style={{ [document.dir === 'rtl' ? 'right' : 'left']: 0 }}>
          <div
            className="px-4 py-2 rounded-md text-sm pointer-events-auto"
            style={{
              backgroundColor: toast.type === 'success' ? 'var(--aq-success-muted)' : 'var(--aq-danger-muted)',
              color: toast.type === 'success' ? 'var(--aq-success)' : 'var(--aq-danger)',
              border: `1px solid ${toast.type === 'success' ? 'var(--aq-success-border)' : 'var(--aq-danger-border)'}`,
            }}
          >
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  );
}
