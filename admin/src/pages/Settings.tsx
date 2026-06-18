import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Globe, Bell, Shield, Palette } from 'lucide-react';

export default function Settings() {
  const { t } = useTranslation();
  const [saved, setSaved] = useState(false);

  const [config, setConfig] = useState({
    site_name: 'عقاراتي',
    site_description: 'دفتر عقاراتك الذكي',
    default_language: 'ar',
    enable_registration: true,
    enable_social_login: true,
    max_properties_per_user: 100,
    enable_auto_moderation: true,
    notification_email: 'admin@aqarati.sa',
    smtp_host: 'smtp.example.com',
    smtp_port: '587',
    maintenance_mode: false,
    api_rate_limit: '100',
    max_upload_size_mb: '10',
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputClass = "input-field";

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('admin.settings')}</h1>
          <p className="text-white/40 text-sm mt-1">إعدادات المنصة</p>
        </div>
        <button onClick={handleSave} className={`btn-primary flex items-center gap-2 text-sm ${saved ? 'opacity-50' : ''}`}>
          <Save size={16} /> {saved ? 'تم الحفظ' : t('common.save')}
        </button>
      </div>

      {/* General Settings */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Globe size={18} className="text-[#14b8a6]" />
          <h2 className="text-white font-semibold">إعدادات عامة</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-white/50 mb-1 block">اسم الموقع</label>
            <input className={inputClass} value={config.site_name} onChange={(e) => setConfig({ ...config, site_name: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">وصف الموقع</label>
            <input className={inputClass} value={config.site_description} onChange={(e) => setConfig({ ...config, site_description: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">اللغة الافتراضية</label>
            <select className={inputClass} value={config.default_language} onChange={(e) => setConfig({ ...config, default_language: e.target.value })}>
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">الحد الأقصى للعقارات لكل مستخدم</label>
            <input type="number" className={inputClass} value={config.max_properties_per_user} onChange={(e) => setConfig({ ...config, max_properties_per_user: Number(e.target.value) })} />
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={18} className="text-[#14b8a6]" />
          <h2 className="text-white font-semibold">الميزات والأمان</h2>
        </div>
        <div className="space-y-3">
          <label className="flex items-center justify-between py-2 border-b border-[#1e3028] last:border-0">
            <span className="text-sm text-white/70">تفعيل التسجيل</span>
            <input type="checkbox" checked={config.enable_registration} onChange={(e) => setConfig({ ...config, enable_registration: e.target.checked })} className="accent-[#14b8a6] w-5 h-5" />
          </label>
          <label className="flex items-center justify-between py-2 border-b border-[#1e3028] last:border-0">
            <span className="text-sm text-white/70">تفعيل تسجيل الدخول الاجتماعي</span>
            <input type="checkbox" checked={config.enable_social_login} onChange={(e) => setConfig({ ...config, enable_social_login: e.target.checked })} className="accent-[#14b8a6] w-5 h-5" />
          </label>
          <label className="flex items-center justify-between py-2 border-b border-[#1e3028] last:border-0">
            <span className="text-sm text-white/70">المراجعة التلقائية للعقارات</span>
            <input type="checkbox" checked={config.enable_auto_moderation} onChange={(e) => setConfig({ ...config, enable_auto_moderation: e.target.checked })} className="accent-[#14b8a6] w-5 h-5" />
          </label>
          <label className="flex items-center justify-between py-2 border-b border-[#1e3028] last:border-0">
            <span className="text-sm text-white/70">وضع الصيانة</span>
            <input type="checkbox" checked={config.maintenance_mode} onChange={(e) => setConfig({ ...config, maintenance_mode: e.target.checked })} className="accent-[#ef4444] w-5 h-5" />
          </label>
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell size={18} className="text-[#14b8a6]" />
          <h2 className="text-white font-semibold">الإشعارات والبريد</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-white/50 mb-1 block">البريد الإلكتروني للإشعارات</label>
            <input className={inputClass} value={config.notification_email} onChange={(e) => setConfig({ ...config, notification_email: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">خادم SMTP</label>
            <input className={inputClass} value={config.smtp_host} onChange={(e) => setConfig({ ...config, smtp_host: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">منفذ SMTP</label>
            <input className={inputClass} value={config.smtp_port} onChange={(e) => setConfig({ ...config, smtp_port: e.target.value })} />
          </div>
        </div>
      </div>

      {/* Limits */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Palette size={18} className="text-[#14b8a6]" />
          <h2 className="text-white font-semibold">الحدود والقيود</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-white/50 mb-1 block">حد الطلبات/دقيقة</label>
            <input type="number" className={inputClass} value={config.api_rate_limit} onChange={(e) => setConfig({ ...config, api_rate_limit: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">أقصى حجم للرفع (ميغابايت)</label>
            <input type="number" className={inputClass} value={config.max_upload_size_mb} onChange={(e) => setConfig({ ...config, max_upload_size_mb: e.target.value })} />
          </div>
        </div>
      </div>
    </div>
  );
}
