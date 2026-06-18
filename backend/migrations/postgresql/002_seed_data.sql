-- Aqarati Seed Data — Default plans, payment providers, admin user
-- Run after schema migration

-- ─── Default Plans ───────────────────────────────────────

INSERT INTO plans (id, name, tier, description, price_monthly_sar, price_yearly_sar, max_properties, max_images_per_property, max_organization_members, max_saved_searches, ai_enabled, export_enabled, features) VALUES
(
  '00000000-0000-0000-0000-000000000001',
  'مجاني',
  'free',
  'الباقة المجانية للوسيط الفردي',
  0, 0,
  10, 5, 0, 3,
  FALSE, FALSE,
  '["إضافة عقارات", "رفع صور", "مشاركة واتساب", "فلاتر بحث", "تذكيرات"]'
),
(
  '00000000-0000-0000-0000-000000000002',
  'احترافي',
  'pro',
  'للمحترفين الباحثين عن أدوات أقوى',
  49, 490,
  100, 20, 5, 10,
  TRUE, TRUE,
  '["كل مميزات المجاني", "تصدير CSV/XLSX", "صياغة إعلان بالذكاء الاصطناعي", "استخراج بيانات من الصور", "بحث طبيعي", "دعم أولوية"]'
),
(
  '00000000-0000-0000-0000-000000000003',
  'مكتب',
  'office',
  'للمكاتب العقارية والفرق',
  149, 1490,
  500, 50, 20, 30,
  TRUE, TRUE,
  '["كل مميزات الاحترافي", "مساحة مكتب كاملة", "صلاحيات الأدوار", "عقارات مشتركة", "دعم مخصص", "تصدير كامل"]'
);

-- ─── Default Payment Providers (disabled by default) ─────

INSERT INTO payment_providers (id, provider_key, display_name, is_enabled, config, supported_methods) VALUES
(
  '00000000-0000-0000-0000-000000000011',
  'mada',
  'مدى',
  FALSE,
  '{"merchant_id": "", "api_key": "", "environment": "sandbox"}',
  '["card", "apple_pay"]'
),
(
  '00000000-0000-0000-0000-000000000012',
  'stc_pay',
  'STC Pay',
  FALSE,
  '{"merchant_id": "", "api_key": "", "environment": "sandbox"}',
  '["wallet", "card"]'
),
(
  '00000000-0000-0000-0000-000000000013',
  'apple_pay',
  'Apple Pay',
  FALSE,
  '{"merchant_id": "", "certificate": "", "environment": "sandbox"}',
  '["apple_pay"]'
),
(
  '00000000-0000-0000-0000-000000000014',
  'urpay',
  'UrPay',
  FALSE,
  '{"merchant_id": "", "api_key": "", "environment": "sandbox"}',
  '["card", "wallet"]'
),
(
  '00000000-0000-0000-0000-000000000015',
  'hyperpay',
  'HyperPay',
  FALSE,
  '{"entity_id": "", "access_token": "", "environment": "sandbox"}',
  '["card", "mada", "apple_pay"]'
),
(
  '00000000-0000-0000-0000-000000000016',
  'moyasar',
  'Moyasar',
  FALSE,
  '{"api_key": "", "publishable_key": "", "environment": "sandbox"}',
  '["card", "mada", "apple_pay"]'
),
(
  '00000000-0000-0000-0000-000000000017',
  'tamara',
  'تمارا',
  FALSE,
  '{"api_key": "", "environment": "sandbox"}',
  '["bnpl"]'
),
(
  '00000000-0000-0000-0000-000000000018',
  'tabby',
  'تابي',
  FALSE,
  '{"api_key": "", "environment": "sandbox"}',
  '["bnpl"]'
);
