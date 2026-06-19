'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { translations } from '@aqarati/shared';

function useI18n() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const t = (key: string) => {
    const keys = key.split('.');
    let val: any = translations[lang];
    for (const k of keys) { val = val?.[k]; }
    return val || key;
  };
  return { t, lang, setLang };
}

const GRAPHQL_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/graphql';

interface PlanDetail {
  id: string; name: string; nameAr?: string | null; tier: string;
  description?: string | null; descriptionAr?: string | null;
  priceMonthlySar?: number | null; priceYearlySar?: number | null;
  maxProperties: number; maxImagesPerProperty: number; aiEnabled: boolean;
  exportEnabled: boolean; features: string[]; isFeatured?: boolean;
  isPopular?: boolean; badgeLabelAr?: string | null;
}

export default function HomePage() {
  const { t, lang, setLang } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [plans, setPlans] = useState<PlanDetail[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    fetch(GRAPHQL_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '{ publicPlans { id name nameAr tier priceMonthlySar description descriptionAr maxProperties aiEnabled exportEnabled features isFeatured isPopular badgeLabelAr } }' })
    }).then(r => r.json()).then(d => { setPlans(d?.data?.publicPlans || []); setPlansLoading(false); }).catch(() => setPlansLoading(false));
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleLang = () => setLang(lang === 'ar' ? 'en' : 'ar');

  return (
    <div className="min-h-screen bg-[#020907]" style={{ direction: dir, fontFamily: lang === 'ar' ? "'Almarai', sans-serif" : "'Inter', sans-serif" }}>
      <nav className={`fixed top-0 w-full z-50 transition-all ${scrolled ? 'bg-[#020907]/90 backdrop-blur-md border-b border-white/[0.04]' : ''}`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-white">🏠 {t('common.app_name')}</div>
          <div className="flex items-center gap-4">
            <button onClick={toggleLang} className="text-white/60 hover:text-white text-sm">{lang === 'ar' ? 'English' : 'العربية'}</button>
            <Link href="/login" className="text-white/70 hover:text-white text-sm">{t('auth.sign_in')}</Link>
            <Link href="/register" className="px-4 py-2 bg-[#10b981] text-white rounded-lg text-sm font-medium">{t('auth.sign_up')}</Link>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-6 max-w-6xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">{t('common.app_name')}</h1>
        <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10">{t('common.tagline')}</p>
        <Link href="/register" className="px-8 py-3 bg-[#10b981] text-white rounded-xl text-lg font-medium">{t('auth.sign_up')}</Link>
      </section>

      <section className="py-20 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-white text-center mb-4">{t('admin.plans')}</h2>
        {plansLoading ? (
          <div className="flex justify-center p-12"><div className="animate-spin w-8 h-8 border-2 border-[#10b981] border-t-transparent rounded-full" /></div>
        ) : plans.length === 0 ? (
          <div className="text-center p-12 text-white/30">{t('common.no_results')}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {plans.map(p => (
              <div key={p.id} className={`relative rounded-2xl p-6 bg-[rgba(20,31,26,0.4)] border border-white/[0.04] ${p.isPopular ? 'ring-1 ring-[#10b981]/40' : ''}`}>
                {p.isPopular && <span className="absolute -top-3 right-4 px-3 py-1 bg-[#10b981] text-white text-xs rounded-full">{p.badgeLabelAr || t('plans.popular')}</span>}
                <h3 className="text-xl font-bold text-white mb-1">{lang === 'ar' ? (p.nameAr || p.name) : p.name}</h3>
                <p className="text-white/30 text-sm mb-4">{lang === 'ar' ? (p.descriptionAr || p.description || '') : (p.description || '')}</p>
                <div className="mb-6"><span className="text-3xl font-bold text-white">{p.priceMonthlySar?.toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}</span><span className="text-white/40 text-sm ml-1">{t('plans.sar_month')}</span></div>
                <ul className="space-y-2 mb-6">{(p.features || []).slice(0, 5).map((f: string, i: number) => (<li key={i} className="flex items-center gap-2 text-white/60 text-sm"><span className="text-[#10b981]">✓</span> {f}</li>))}</ul>
                <Link href="/register" className="block w-full text-center py-2.5 bg-[#10b981]/10 text-[#10b981] rounded-lg text-sm font-medium">{t('auth.sign_up')}</Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="py-12 px-6 border-t border-white/[0.04] text-center text-white/20 text-sm">
        © {new Date().getFullYear()} {t('common.app_name')}
      </footer>
    </div>
  );
}
