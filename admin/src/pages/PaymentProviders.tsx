import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchPaymentProviders, toggleProvider, updateProviderConfig } from '../api/client';
import { ToggleLeft, ToggleRight, Settings2, X, Save } from 'lucide-react';

interface Provider {
  id: string;
  name: string;
  enabled: boolean;
  config: Record<string, string>;
}

export default function PaymentProviders() {
  const { t } = useTranslation();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [configuring, setConfiguring] = useState<Provider | null>(null);
  const [configForm, setConfigForm] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const data = await fetchPaymentProviders();
    setProviders(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (id: string) => {
    await toggleProvider(id);
    load();
  };

  const openConfig = (provider: Provider) => {
    setConfiguring(provider);
    setConfigForm({ ...provider.config });
  };

  const saveConfig = async () => {
    if (configuring) {
      await updateProviderConfig(configuring.id, configForm);
      setConfiguring(null);
      load();
    }
  };

  const providerIcon = (id: string) => {
    const map: Record<string, string> = { mada: '💳', stc_pay: '📱', apple_pay: '🍎', urpay: '💵', hyperpay: '🔗', moyasar: '🏦', tamara: '📦', tabby: '🛍️' };
    return map[id] || '💳';
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
      <div>
        <h1 className="text-2xl font-bold text-white">{t('admin.payment_providers')}</h1>
        <p className="text-white/40 text-sm mt-1">إدارة مزودي خدمات الدفع</p>
      </div>

      {/* Config Modal */}
      {configuring && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setConfiguring(null)} />
          <div className="relative bg-[#0a1a14] border border-[#1e3028] rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">إعدادات {configuring.name}</h2>
              <button onClick={() => setConfiguring(null)} className="text-white/40 hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              {Object.keys(configForm).length === 0 ? (
                <p className="text-white/40 text-sm">لا توجد إعدادات لهذا المزود</p>
              ) : (
                Object.entries(configForm).map(([key, val]) => (
                  <div key={key}>
                    <label className="text-xs text-white/50 mb-1 block">{key}</label>
                    <input className="input-field" value={val || ''} onChange={(e) => setConfigForm({ ...configForm, [key]: e.target.value })} />
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setConfiguring(null)} className="btn-secondary text-sm">{t('common.cancel')}</button>
              <button onClick={saveConfig} className="btn-primary text-sm flex items-center gap-1"><Save size={14} /> {t('common.save')}</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map((p) => (
          <div key={p.id} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{providerIcon(p.id)}</span>
                <span className="text-white font-medium">{p.name}</span>
              </div>
              <button onClick={() => handleToggle(p.id)} className="text-2xl transition-colors">
                {p.enabled ? <ToggleRight size={28} className="text-[#14b8a6]" /> : <ToggleLeft size={28} className="text-white/20" />}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className={`badge ${p.enabled ? 'badge-success' : 'badge-muted'}`}>
                {p.enabled ? t('admin.enable') : t('admin.disable')}
              </span>
              <button onClick={() => openConfig(p)} className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors">
                <Settings2 size={14} /> إعدادات
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
