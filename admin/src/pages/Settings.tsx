import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Globe, Bell, Shield, Palette, Loader2 } from 'lucide-react';
import { fetchSettings, updateSetting, type SettingEntry } from '../api/client';

export default function Settings() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');

  // Load real settings from backend
  useEffect(() => {
    fetchSettings()
      .then((entries: SettingEntry[]) => {
        const map: Record<string, string> = {};
        entries.forEach((e) => { map[e.key] = e.value; });
        setSettings(map);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (key: string, value: string) => {
    setSaving((prev) => ({ ...prev, [key]: true }));
    setError('');
    try {
      await updateSetting(key, value);
      setSaved((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => setSaved((prev) => ({ ...prev, [key]: false })), 2000);
    } catch (err: any) {
      setError(err.message || 'فشل حفظ الإعداد');
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }));
    }
  };

  const getVal = (key: string, fallback: string = '') => settings[key] || fallback;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[#14b8a6]" />
      </div>
    );
  }

  const inputClass = "input-field";

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('admin.settings')}</h1>
          <p className="text-white/40 text-sm mt-1">إعدادات المنصة</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800 text-red-300 rounded-lg p-3 text-sm">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-400 hover:text-red-300">×</button>
        </div>
      )}

      {/* General Settings */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Globe size={18} className="text-[#14b8a6]" />
          <h2 className="text-white font-semibold">إعدادات عامة</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'site_name', label: 'اسم الموقع', type: 'text' as const },
            { key: 'site_description', label: 'وصف الموقع', type: 'text' as const },
            { key: 'site_url', label: 'رابط الموقع', type: 'text' as const },
            { key: 'default_language', label: 'اللغة الافتراضية', type: 'select' as const },
            { key: 'contact_email', label: 'البريد الإلكتروني للتواصل', type: 'text' as const },
            { key: 'support_phone', label: 'رقم الدعم', type: 'text' as const },
          ].map(({ key, label, type }) => (
            <div key={key}>
              <label className="text-xs text-white/50 mb-1 block">{label}</label>
              <div className="flex gap-2">
                {type === 'select' ? (
                  <select
                    className={inputClass + ' flex-1'}
                    value={getVal(key, 'ar')}
                    onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                  >
                    <option value="ar">العربية</option>
                    <option value="en">English</option>
                  </select>
                ) : (
                  <input
                    className={inputClass + ' flex-1'}
                    value={getVal(key)}
                    onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                  />
                )}
                <button
                  onClick={() => handleSave(key, settings[key] || '')}
                  disabled={saving[key]}
                  className="btn-primary flex items-center gap-1 text-xs px-3"
                >
                  {saving[key] ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : saved[key] ? (
                    '✓'
                  ) : (
                    <Save size={14} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={18} className="text-[#14b8a6]" />
          <h2 className="text-white font-semibold">الميزات والأمان</h2>
        </div>
        <div className="space-y-3">
          {[
            { key: 'enable_registration', label: 'تفعيل التسجيل' },
            { key: 'enable_social_login', label: 'تفعيل تسجيل الدخول الاجتماعي' },
            { key: 'enable_auto_moderation', label: 'المراجعة التلقائية للعقارات' },
            { key: 'maintenance_mode', label: 'وضع الصيانة' },
            { key: 'require_email_verification', label: 'التحقق من البريد الإلكتروني' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center justify-between py-2 border-b border-[#1e3028] last:border-0">
              <span className="text-sm text-white/70">{label}</span>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={getVal(key, 'false') === 'true'}
                  onChange={(e) => {
                    const val = e.target.checked ? 'true' : 'false';
                    setSettings({ ...settings, [key]: val });
                    handleSave(key, val);
                  }}
                  className="accent-[#14b8a6] w-5 h-5"
                />
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell size={18} className="text-[#14b8a6]" />
          <h2 className="text-white font-semibold">الإشعارات والبريد</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'smtp_host', label: 'خادم SMTP' },
            { key: 'smtp_port', label: 'منفذ SMTP' },
            { key: 'smtp_username', label: 'اسم مستخدم SMTP' },
            { key: 'notification_email', label: 'البريد المرسل' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs text-white/50 mb-1 block">{label}</label>
              <div className="flex gap-2">
                <input
                  className={inputClass + ' flex-1'}
                  value={getVal(key)}
                  onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                />
                <button
                  onClick={() => handleSave(key, settings[key] || '')}
                  disabled={saving[key]}
                  className="btn-primary flex items-center gap-1 text-xs px-3"
                >
                  {saving[key] ? <Loader2 size={14} className="animate-spin" /> : saved[key] ? '✓' : <Save size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Limits */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Palette size={18} className="text-[#14b8a6]" />
          <h2 className="text-white font-semibold">الحدود والقيود</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'api_rate_limit', label: 'حد الطلبات/دقيقة' },
            { key: 'max_upload_size_mb', label: 'أقصى حجم للرفع (ميغابايت)' },
            { key: 'max_properties_per_user', label: 'الحد الأقصى للعقارات لكل مستخدم' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs text-white/50 mb-1 block">{label}</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  className={inputClass + ' flex-1'}
                  value={getVal(key, '0')}
                  onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                />
                <button
                  onClick={() => handleSave(key, settings[key] || '0')}
                  disabled={saving[key]}
                  className="btn-primary flex items-center gap-1 text-xs px-3"
                >
                  {saving[key] ? <Loader2 size={14} className="animate-spin" /> : saved[key] ? '✓' : <Save size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
