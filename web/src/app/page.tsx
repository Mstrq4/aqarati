'use client';

import { useEffect, useState } from 'react';
import { fetchPublicPlans, PublicPlanData } from '@/api/client';

export default function HomePage() {
  const [plans, setPlans] = useState<PublicPlanData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicPlans()
      .then(setPlans)
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#020907]">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[#1e3028]">
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            دفتر عقاراتك
            <span className="text-emerald-400 block mt-2">الذكي</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
            أسرع طريقة لحفظ العروض العقارية ومشاركتها ومتابعتها.
            منصة عقاراتي للوسطاء والمكاتب العقارية في السعودية.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/register"
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition"
            >
              ابدأ مجاناً
            </a>
            <a
              href="/login"
              className="border border-[#1e3028] hover:border-emerald-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition"
            >
              تسجيل الدخول
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          لماذا عقاراتي؟
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: '📱', title: 'حفظ سريع', desc: 'احفظ أي عرض عقاري في ثوانٍ من أي مكان' },
            { icon: '🔗', title: 'مشاركة ذكية', desc: 'شارك العقار برابط واحد مع صور وتفاصيل كاملة' },
            { icon: '📊', title: 'إدارة متكاملة', desc: 'نظّم عقاراتك وتابع العملاء والتذكيرات' },
          ].map((f) => (
            <div key={f.title} className="bg-[#141f1a] border border-[#1e3028] rounded-xl p-6 text-center hover:border-emerald-500 transition">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section className="max-w-5xl mx-auto px-4 py-16 border-t border-[#1e3028]">
        <h2 className="text-3xl font-bold text-white text-center mb-4">
          الباقات والأسعار
        </h2>
        <p className="text-gray-400 text-center mb-12">
          اختر الباقة المناسبة لك ولمكتبك
        </p>

        {loading ? (
          <div className="text-center text-gray-400 py-8">جاري تحميل الباقات...</div>
        ) : plans.length === 0 ? (
          <div className="text-center text-gray-500 py-8">لا توجد باقات متاحة حالياً</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-[#141f1a] border border-[#1e3028] rounded-xl p-6 hover:border-emerald-500 transition"
              >
                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{plan.description || plan.tier}</p>

                <div className="mb-6">
                  {plan.priceMonthlySar ? (
                    <div>
                      <span className="text-3xl font-bold text-emerald-400">{plan.priceMonthlySar}</span>
                      <span className="text-gray-400 text-sm mr-1">ر.س/شهرياً</span>
                    </div>
                  ) : (
                    <span className="text-2xl font-bold text-emerald-400">مجاناً</span>
                  )}
                  {plan.priceYearlySar && (
                    <p className="text-gray-500 text-xs mt-1">
                      {plan.priceYearlySar} ر.س سنوياً
                    </p>
                  )}
                </div>

                <ul className="space-y-2 mb-6 text-sm">
                  <li className="text-gray-300">🏠 {plan.maxProperties} عقار</li>
                  <li className="text-gray-300">📷 {plan.maxImagesPerProperty} صورة للعقار</li>
                  <li className="text-gray-300">
                    {plan.aiEnabled ? '🤖 الذكاء الاصطناعي مفعل' : '🤖 بدون ذكاء اصطناعي'}
                  </li>
                  {plan.features?.filter((f) => f.included).slice(0, 3).map((f) => (
                    <li key={f.id} className="text-gray-300">✅ {f.name}</li>
                  ))}
                </ul>

                <a
                  href="/register"
                  className="block w-full bg-emerald-600 hover:bg-emerald-500 text-white text-center rounded-lg py-3 font-semibold transition"
                >
                  ابدأ الآن
                </a>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1e3028] py-8 mt-16">
        <div className="max-w-5xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© 2026 عقاراتي | Aqarati. جميع الحقوق محفوظة.</p>
        </div>
      </footer>
    </div>
  );
}
