'use client';

import { useState, useEffect } from 'react';
import { translations } from '@aqarati/shared';
import Link from 'next/link';

const GRAPHQL_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/graphql';

function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('aq-token') : null; }

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

async function gql(query: string, variables?: any) {
  const headers: any = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(GRAPHQL_URL, { method: 'POST', headers, body: JSON.stringify({ query, variables }) });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}

export default function Dashboard() {
  const { t, lang } = useI18n();
  const [user, setUser] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    if (!getToken()) {
      window.location.href = '/login';
      return;
    }
    Promise.all([
      gql('{ me { id email fullName language status } }'),
      gql('{ myProperties(limit: 10) { id title propertyType purpose status createdAt priceAmount city } }'),
    ]).then(([u, p]) => {
      setUser(u?.me);
      setProperties(p?.myProperties || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-[#020907]">
      <div className="animate-spin w-8 h-8 border-2 border-[#10b981] border-t-transparent rounded-full" />
    </div>;
  }

  return (
    <div className="min-h-screen bg-[#020907]" style={{ direction: dir }}>
      <nav className="border-b border-white/[0.04] px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-xl font-bold text-white">🏠 {t('common.app_name')}</Link>
        <div className="flex items-center gap-4">
          <span className="text-white/60 text-sm">{user?.fullName}</span>
          <Link href="/dashboard/properties" className="text-white/60 hover:text-white text-sm">{t('property.my_properties')}</Link>
          <button onClick={() => { localStorage.removeItem('aq-token'); window.location.href = '/'; }}
            className="text-white/40 hover:text-white text-sm">{t('auth.sign_out')}</button>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-white mb-2">{t('dashboard.welcome')}{user?.fullName && `, ${user.fullName}`}</h1>
        <p className="text-white/40 mb-8">{t('dashboard.overview')}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="rounded-2xl p-6 bg-[rgba(20,31,26,0.4)] border border-white/[0.04]">
            <div className="text-3xl font-bold text-[#10b981]">{properties.length}</div>
            <div className="text-white/40 text-sm mt-1">{t('property.my_properties')}</div>
          </div>
          <div className="rounded-2xl p-6 bg-[rgba(20,31,26,0.4)] border border-white/[0.04]">
            <div className="text-3xl font-bold text-[#8b5cf6]">{user?.status === 'active' ? '✓' : '—'}</div>
            <div className="text-white/40 text-sm mt-1">{t('common.status')}</div>
          </div>
          <Link href="/dashboard/properties/new" className="rounded-2xl p-6 bg-[rgba(20,31,26,0.4)] border border-white/[0.04] hover:border-[#10b981]/30 transition-all flex items-center justify-center">
            <span className="text-[#10b981] text-sm font-medium">+ {t('property.add_new')}</span>
          </Link>
        </div>

        <h2 className="text-lg font-bold text-white mb-4">{t('property.recent')}</h2>
        {properties.length === 0 ? (
          <div className="text-center p-8 text-white/30 rounded-2xl bg-[rgba(20,31,26,0.4)]">{t('common.no_results')}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {properties.map((p: any) => (
              <div key={p.id} className="rounded-2xl p-5 bg-[rgba(20,31,26,0.4)] border border-white/[0.04] hover:border-[#10b981]/20 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-white font-medium">{p.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${p.status === 'active' ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-white/10 text-white/40'}`}>{p.status}</span>
                </div>
                <div className="text-white/30 text-sm">{p.propertyType} · {p.purpose} {p.priceAmount ? `· ${p.priceAmount} SAR` : ''}</div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
