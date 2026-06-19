'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    // Scroll animation observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.animate-on-scroll').forEach((el) => observer.observe(el));
    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  const t = (key: string) => {
    const strings: Record<string, Record<string, string>> = {
      heroTitle: { ar: 'دفتر عقاراتك الذكي', en: 'Your Smart Property Notebook' },
      heroSub: { ar: 'أسرع طريقة لحفظ العروض العقارية ومشاركتها ومتابعتها دون تعقيد', en: 'The fastest way to save, share, and track real estate listings — without the complexity' },
      startFree: { ar: 'ابدأ الآن مجاناً', en: 'Start Free' },
      downloadApp: { ar: 'تحميل التطبيق', en: 'Download App' },
      features: { ar: 'المميزات', en: 'Features' },
      feature1Title: { ar: '⚡ إضافة سريعة', en: '⚡ Quick Add' },
      feature1Desc: { ar: 'أضف عقاراً في أقل من دقيقة واحدة مع الحقول الأساسية فقط', en: 'Add a property in under 60 seconds with just the essential fields' },
      feature2Title: { ar: '📱 مشاركة فورية', en: '📱 Instant Sharing' },
      feature2Desc: { ar: 'شارك العروض مباشرة عبر واتساب برسالة منسقة جاهزة', en: 'Share listings directly via WhatsApp with a ready-made formatted message' },
      feature3Title: { ar: '🏢 مكتب ذكي', en: '🏢 Smart Office' },
      feature3Desc: { ar: 'نظم فريقك وعروضك في مساحة عمل واحدة مع صلاحيات متقدمة', en: 'Organize your team and listings in one workspace with advanced permissions' },
      feature4Title: { ar: '🔍 بحث ذكي', en: '🔍 Smart Search' },
      feature4Desc: { ar: 'فلاتر متقدمة وبحث محفوظ مع تنبيهات عند توفر نتائج جديدة', en: 'Advanced filters and saved searches with alerts for new results' },
      feature5Title: { ar: '🌙 الوضع الليلي', en: '🌙 Dark Mode' },
      feature5Desc: { ar: 'واجهة داكنة أنيقة مريحة للعين مع دعم كامل للغة العربية', en: 'Elegant dark interface, easy on the eyes, with full Arabic language support' },
      feature6Title: { ar: '🔒 أمان وخصوصية', en: '🔒 Security & Privacy' },
      feature6Desc: { ar: 'بياناتك محمية بمعايير أمنية متقدمة ومتوافقة مع الأنظمة السعودية', en: 'Your data is protected with advanced security standards compliant with Saudi regulations' },
      ctaTitle: { ar: 'جاهز تبدأ تنظم عقاراتك؟', en: 'Ready to organize your properties?' },
      ctaSub: { ar: 'انضم لآلاف الوسطاء السعوديين الذين يستخدمون عقاراتي يومياً', en: 'Join thousands of Saudi agents who use Aqarati daily' },
      footer: { ar: '© 2026 عقاراتي. جميع الحقوق محفوظة.', en: '© 2026 Aqarati. All rights reserved.' },
      footerPrivacy: { ar: 'سياسة الخصوصية', en: 'Privacy Policy' },
      footerTerms: { ar: 'شروط الاستخدام', en: 'Terms of Service' },
      footerContact: { ar: 'اتصل بنا', en: 'Contact Us' },
      poweredBy: { ar: 'مدعوم من', en: 'Powered by' },
    };
    return strings[key]?.[lang] || key;
  };

  const features = [
    { icon: '⚡', title: t('feature1Title'), desc: t('feature1Desc') },
    { icon: '📱', title: t('feature2Title'), desc: t('feature2Desc') },
    { icon: '🏢', title: t('feature3Title'), desc: t('feature3Desc') },
    { icon: '🔍', title: t('feature4Title'), desc: t('feature4Desc') },
    { icon: '🌙', title: t('feature5Title'), desc: t('feature5Desc') },
    { icon: '🔒', title: t('feature6Title'), desc: t('feature6Desc') },
  ];

  return (
    <div className="min-h-screen bg-[#020907] text-white">
      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-[#020907]/90 backdrop-blur-lg border-b border-[#1e3028]' : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#14b8a6] to-[#0d9488] flex items-center justify-center">
              <span className="text-white text-lg font-bold">ع</span>
            </div>
            <span className="text-xl font-bold font-arabic tracking-tight">
              عقاراتي
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="px-3 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white/90 hover:bg-white/5 transition-all"
            >
              {lang === 'ar' ? 'EN' : 'عربي'}
            </button>
            <Link
              href="https://app.aqarati.app"
              className="btn-primary text-sm px-5 py-2.5"
            >
              {lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#14b8a6]/10 rounded-full blur-3xl" />
        <div className="absolute top-20 right-0 w-[300px] h-[300px] bg-[#2dd4bf]/5 rounded-full blur-2xl" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#14b8a6]/10 border border-[#14b8a6]/20 mb-8 animate-on-scroll">
            <span className="w-2 h-2 rounded-full bg-[#14b8a6] animate-pulse" />
            <span className="text-sm text-[#14b8a6] font-medium">
              {lang === 'ar' ? 'متوفر الآن على Android و iOS' : 'Available on Android & iOS'}
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold font-arabic leading-tight mb-6 animate-on-scroll">
            {lang === 'ar' ? (
              <>
                دفتر{' '}
                <span className="gradient-text">عقاراتك</span>
                <br />
                الذكي
              </>
            ) : (
              <>
                Your Smart{' '}
                <span className="gradient-text">Property</span>
                <br />
                Notebook
              </>
            )}
          </h1>

          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 animate-on-scroll font-arabic leading-relaxed">
            {t('heroSub')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-on-scroll">
            <Link href="https://app.aqarati.app/signup" className="btn-primary text-lg px-8 py-4 w-full sm:w-auto text-center">
              {t('startFree')}
            </Link>
            <Link href="#download" className="btn-secondary text-lg px-8 py-4 w-full sm:w-auto text-center">
              {t('downloadApp')}
            </Link>
          </div>

          {/* App preview */}
          <div className="mt-16 animate-on-scroll">
            <div className="relative max-w-sm mx-auto">
              <div className="absolute inset-0 bg-gradient-to-t from-[#14b8a6]/20 to-transparent rounded-3xl blur-xl" />
              <div className="relative bg-[#141f1a]/80 backdrop-blur border border-[#1e3028] rounded-3xl p-6 shadow-2xl">
                {/* Mock phone screen */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-white/40">{lang === 'ar' ? 'عقاراتي' : 'Aqarati'}</div>
                      <div className="text-lg font-bold text-white">{lang === 'ar' ? 'مرحباً بك' : 'Welcome'}</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[#14b8a6]/20 flex items-center justify-center">
                      <span className="text-white font-bold">ع</span>
                    </div>
                  </div>
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: '24', label: lang === 'ar' ? 'عقار' : 'Props' },
                      { value: '12', label: lang === 'ar' ? 'نشط' : 'Active' },
                      { value: '5', label: lang === 'ar' ? 'مسودة' : 'Drafts' },
                    ].map((stat, i) => (
                      <div key={i} className="bg-[#1c2d26] rounded-xl p-3 text-center">
                        <div className="text-lg font-bold text-[#14b8a6]">{stat.value}</div>
                        <div className="text-xs text-white/40">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                  {/* Property cards */}
                  {[
                    { title: lang === 'ar' ? 'فيلا فاخرة - النرجس' : 'Luxury Villa - Al Narjis', price: '2,500,000', type: lang === 'ar' ? 'بيع' : 'Sale' },
                    { title: lang === 'ar' ? 'شقة مفروشة - الملقا' : 'Furnished Apt - Al Malqa', price: '85,000', type: lang === 'ar' ? 'إيجار' : 'Rent' },
                  ].map((item, i) => (
                    <div key={i} className="bg-[#1c2d26] rounded-xl p-3 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#14b8a6]/30 to-[#0d9488]/30 flex items-center justify-center text-xl">
                        🏠
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{item.title}</div>
                        <div className="text-xs text-white/40">{item.price} {lang === 'ar' ? 'ر.س' : 'SAR'}</div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-md bg-[#14b8a6]/20 text-[#14b8a6] font-medium">
                        {item.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-on-scroll">
            <h2 className="text-3xl md:text-4xl font-extrabold font-arabic mb-4">
              {t('features')}
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              {lang === 'ar'
                ? 'كل ما تحتاجه لإدارة عقاراتك بكفاءة في تطبيق واحد'
                : 'Everything you need to manage your properties efficiently in one app'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, i) => (
              <div
                key={i}
                className="glass-card p-8 animate-on-scroll hover:border-[#14b8a6]/30 transition-all duration-300 hover:-translate-y-1"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="text-3xl mb-4">{feat.icon}</div>
                <h3 className="text-lg font-bold font-arabic mb-2 text-white">{feat.title}</h3>
                <p className="text-white/50 font-arabic leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 gradient-bg opacity-10" />
        <div className="relative max-w-3xl mx-auto text-center glass-card p-12 glow">
          <h2 className="text-3xl md:text-4xl font-extrabold font-arabic mb-4">{t('ctaTitle')}</h2>
          <p className="text-white/60 text-lg mb-8 font-arabic">{t('ctaSub')}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="https://app.aqarati.app/signup" className="btn-primary text-lg px-8 py-4 w-full sm:w-auto text-center">
              {t('startFree')}
            </Link>
            <Link href="https://app.aqarati.app/download" className="btn-secondary text-lg px-8 py-4 w-full sm:w-auto text-center">
              {t('downloadApp')}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1e3028] py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#14b8a6] to-[#0d9488] flex items-center justify-center">
                <span className="text-white text-sm font-bold">ع</span>
              </div>
              <span className="text-lg font-bold font-arabic">عقاراتي</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-white/40">
              <Link href="/privacy" className="hover:text-white/70 transition-colors">{t('footerPrivacy')}</Link>
              <Link href="/terms" className="hover:text-white/70 transition-colors">{t('footerTerms')}</Link>
              <Link href="mailto:hello@aqarati.app" className="hover:text-white/70 transition-colors">{t('footerContact')}</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-[#1e3028]/50 text-center text-sm text-white/30">
            {t('footer')}
          </div>
        </div>
      </footer>
    </div>
  );
}
