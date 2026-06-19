'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTranslation } from '@aqarati/shared';

const GRAPHQL_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/graphql';

interface PlanDetail {
  id: string;
  name: string;
  nameAr?: string | null;
  tier: string;
  description?: string | null;
  descriptionAr?: string | null;
  priceMonthlySar?: number | null;
  priceYearlySar?: number | null;
  maxProperties: number;
  maxImagesPerProperty: number;
  maxOrganizationMembers: number;
  aiEnabled: boolean;
  exportEnabled: boolean;
  features: string[];
  isFeatured?: boolean;
  isPopular?: boolean;
  badgeLabelAr?: string | null;
}

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const [lang, setLang] = useState<'ar' | 'en'>(i18n.language as 'ar' | 'en');
  const [scrolled, setScrolled] = useState(false);
  const [plans, setPlans] = useState<PlanDetail[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    // Fetch real plans from API
    fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: '{ publicPlans { id name nameAr tier description descriptionAr priceMonthlySar priceYearlySar maxProperties maxImagesPerProperty maxOrganizationMembers aiEnabled exportEnabled features isFeatured isPopular badgeLabelAr } }'
      }),
    })
      .then(r => r.json())
      .then(data => {
        setPlans(data?.data?.publicPlans || []);
        setPlansLoading(false);
      })
      .catch(() => setPlansLoading(false));

    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
    return () => { window.removeEventListener('scroll', handleScroll); observer.disconnect(); };
  }, []);

  const toggleLang = () => {
    const newLang = lang === 'ar' ? 'en' : 'ar';
    setLang(newLang);
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <div className="min-h-screen" style={{ direction: dir, fontFamily: lang === 'ar' ? "'Almarai', sans-serif" : "'Inter', sans-serif" }}>
      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all ${scrolled ? 'bg-[#020907]/90 backdrop-blur-md border-b border-white/[0.04]' : ''}`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-white">🏠 {t('app_name')}</div>
          <div className="flex items-center gap-4">
            <button onClick={toggleLang} className="text-white/60 hover:text-white text-sm transition-colors">
              {lang === 'ar' ? 'English' : 'العربية'}
            </button>
            <Link href="/login" className="text-white/70 hover:text-white text-sm transition-colors">
              {t('common.login')}
            </Link>
            <Link href="/register" className="px-4 py-2 bg-[#10b981] text-white rounded-lg text-sm font-medium hover:bg-[#0d9668] transition-colors">
              {t('common.register')}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 max-w-6xl mx-auto text-center animate-on-scroll">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
          {t('hero.title')}
        </h1>
        <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10">
          {t('hero.subtitle')}
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/register" className="px-8 py-3 bg-[#10b981] text-white rounded-xl text-lg font-medium hover:bg-[#0d9668] transition-colors">
            {t('hero.cta')}
          </Link>
        </div>
      </section>

      {/* Plans */}
      <section className="py-20 px-6 max-w-6xl mx-auto animate-on-scroll">
        <h2 className="text-3xl font-bold text-white text-center mb-4">{t('plans.title')}</h2>
        <p className="text-white/40 text-center mb-12">{t('plans.subtitle')}</p>

        {plansLoading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin w-8 h-8 border-2 border-[#10b981] border-t-transparent rounded-full" />
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center p-12 text-white/30">{t('common.no_results')}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div key={plan.id} className={`relative rounded-2xl p-6 bg-[rgba(20,31,26,0.4)] border border-white/[0.04] hover:border-[#10b981]/30 transition-all ${plan.isPopular ? 'ring-1 ring-[#10b981]/40' : ''}`}>
                {plan.isPopular && (
                  <span className="absolute -top-3 right-4 px-3 py-1 bg-[#10b981] text-white text-xs rounded-full font-medium">
                    {plan.badgeLabelAr || t('plans.popular')}
                  </span>
                )}
                {plan.isFeatured && !plan.isPopular && (
                  <span className="absolute -top-3 right-4 px-3 py-1 bg-[#f59e0b] text-white text-xs rounded-full font-medium">
                    {t('plans.featured')}
                  </span>
                )}
                <h3 className="text-xl font-bold text-white mb-1">
                  {lang === 'ar' ? (plan.nameAr || plan.name) : plan.name}
                </h3>
                <p className="text-white/30 text-sm mb-4">
                  {lang === 'ar' ? (plan.descriptionAr || plan.description || '') : (plan.description || '')}
                </p>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-white">{plan.priceMonthlySar?.toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}</span>
                  <span className="text-white/40 text-sm ml-1">{t('plans.sar_month')}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features?.slice(0, 6).map((f: string, i: number) => (
                    <li key={i} className="flex items-center gap-2 text-white/60 text-sm">
                      <span className="text-[#10b981]">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="block w-full text-center py-2.5 bg-[#10b981]/10 text-[#10b981] rounded-lg text-sm font-medium hover:bg-[#10b981]/20 transition-colors">
                  {t('plans.start_free')}
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Features */}
      <section className="py-20 px-6 max-w-6xl mx-auto animate-on-scroll">
        <h2 className="text-3xl font-bold text-white text-center mb-12">{t('features.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="rounded-2xl p-6 bg-[rgba(20,31,26,0.4)] border border-white/[0.04]">
              <div className="text-2xl mb-3">{t(`features.${i}.icon`)}</div>
              <h3 className="text-lg font-bold text-white mb-2">{t(`features.${i}.title`)}</h3>
              <p className="text-white/40 text-sm">{t(`features.${i}.desc`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto text-center text-white/20 text-sm">
          © {new Date().getFullYear()} {t('app_name')}. {t('footer.rights')}
        </div>
      </footer>
    </div>
  );
}
