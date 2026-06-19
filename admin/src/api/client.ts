// Mock API client for admin panel
// Replace with real API calls in production

import type {
  User,
  UserProfile,
  Property,
  Organization,
  Plan,
  Payment,
  Report,
  AdminAuditLog,
  PaginatedResponse,
} from '@aqarati/shared';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Dashboard Stats ─────────────────────────────────────
export interface DashboardStats {
  total_users: number;
  total_properties: number;
  total_organizations: number;
  total_revenue_sar: number;
  active_subscriptions: number;
  pending_reports: number;
}

export interface RecentActivity {
  id: string;
  action: string;
  target: string;
  user: string;
  time: string;
}

let mockStats: DashboardStats = {
  total_users: 1250,
  total_properties: 3420,
  total_organizations: 87,
  total_revenue_sar: 456000,
  active_subscriptions: 340,
  pending_reports: 12,
};

const mockRecentActivity: RecentActivity[] = [
  { id: '1', action: 'تسجيل مستخدم جديد', target: 'user_123', user: 'أحمد محمد', time: 'منذ 5 دقائق' },
  { id: '2', action: 'إضافة عقار', target: 'prop_456', user: 'سارة علي', time: 'منذ 12 دقيقة' },
  { id: '3', action: 'ترقية اشتراك', target: 'sub_789', user: 'خالد أحمد', time: 'منذ 30 دقيقة' },
  { id: '4', action: 'تقديم بلاغ', target: 'rep_101', user: 'نورة عبدالله', time: 'منذ ساعة' },
  { id: '5', action: 'إنشاء مكتب جديد', target: 'org_202', user: 'محمد العمري', time: 'منذ ساعتين' },
];

// ─── Users ────────────────────────────────────────────────
let mockUsers: (User & { profile: UserProfile })[] = [
  {
    id: '1', email: 'ahmed@example.com', phone: '+966501234567', status: 'active',
    created_at: '2024-01-15', updated_at: '2024-06-01',
    profile: { user_id: '1', full_name: 'أحمد محمد', language: 'ar', country_code: 'SA', timezone: 'Asia/Riyadh', verified: true },
  },
  {
    id: '2', email: 'sara@example.com', phone: '+966502345678', status: 'active',
    created_at: '2024-02-20', updated_at: '2024-05-15',
    profile: { user_id: '2', full_name: 'سارة علي', language: 'ar', country_code: 'SA', timezone: 'Asia/Riyadh', verified: true },
  },
  {
    id: '3', email: 'john@example.com', phone: '+966503456789', status: 'suspended',
    created_at: '2024-03-10', updated_at: '2024-06-10',
    profile: { user_id: '3', full_name: 'John Doe', language: 'en', country_code: 'SA', timezone: 'Asia/Riyadh', verified: false },
  },
  {
    id: '4', email: 'noura@example.com', phone: '+966504567890', status: 'active',
    created_at: '2024-04-05', updated_at: '2024-06-12',
    profile: { user_id: '4', full_name: 'نورة عبدالله', language: 'ar', country_code: 'SA', timezone: 'Asia/Riyadh', verified: true },
  },
  {
    id: '5', email: 'khaled@example.com', phone: '+966505678901', status: 'deleted',
    created_at: '2023-11-01', updated_at: '2024-05-01',
    profile: { user_id: '5', full_name: 'خالد أحمد', language: 'ar', country_code: 'SA', timezone: 'Asia/Riyadh', verified: false },
  },
];

// ─── Properties ───────────────────────────────────────────
let mockProperties: (Property & { location: any; details: any; price: any })[] = [
  {
    id: '1', owner_user_id: '1', visibility: 'public', purpose: 'sale', property_type: 'villa',
    title: 'فيلا فاخرة في حي الياسمين', status: 'active', completeness_score: 95,
    created_at: '2024-05-01', updated_at: '2024-06-10',
    location: { city: 'الرياض', district: 'الياسمين' },
    details: { area_sqm: 350, bedrooms: 5, bathrooms: 4 },
    price: { price_amount: 2500000, currency: 'SAR', negotiable: true },
  },
  {
    id: '2', owner_user_id: '2', visibility: 'public', purpose: 'rent', property_type: 'apartment',
    title: 'شقة للإيجار في جدة', status: 'active', completeness_score: 80,
    created_at: '2024-05-15', updated_at: '2024-06-08',
    location: { city: 'جدة', district: 'الروضة' },
    details: { area_sqm: 120, bedrooms: 3, bathrooms: 2 },
    price: { price_amount: 45000, currency: 'SAR', negotiable: false },
  },
  {
    id: '3', owner_user_id: '1', visibility: 'private', purpose: 'investment', property_type: 'land',
    title: 'أرض استثمارية', status: 'draft', completeness_score: 40,
    created_at: '2024-06-01', updated_at: '2024-06-01',
    location: { city: 'الدمام', district: 'الشاطئ' },
    details: { area_sqm: 800, bedrooms: 0, bathrooms: 0 },
    price: { price_amount: 1200000, currency: 'SAR', negotiable: true },
  },
  {
    id: '4', owner_user_id: '3', visibility: 'public', purpose: 'sale', property_type: 'commercial',
    title: 'محل تجاري في الرياض', status: 'reserved', completeness_score: 90,
    created_at: '2024-04-20', updated_at: '2024-06-05',
    location: { city: 'الرياض', district: 'العليا' },
    details: { area_sqm: 200, bedrooms: 0, bathrooms: 1 },
    price: { price_amount: 1800000, currency: 'SAR', negotiable: true },
  },
  {
    id: '5', owner_user_id: '4', visibility: 'public', purpose: 'sale', property_type: 'apartment',
    title: 'شقة تمليك فاخرة', status: 'sold', completeness_score: 100,
    created_at: '2024-03-10', updated_at: '2024-05-28',
    location: { city: 'الرياض', district: 'النرجس' },
    details: { area_sqm: 180, bedrooms: 4, bathrooms: 3 },
    price: { price_amount: 950000, currency: 'SAR', negotiable: false },
  },
];

// ─── Organizations ────────────────────────────────────────
let mockOrganizations: (Organization & { member_count: number; owner_name: string })[] = [
  { id: '1', name: 'مكتب العقارية الأولى', country_code: 'SA', owner_user_id: '1', status: 'active', created_at: '2024-01-01', member_count: 12, owner_name: 'أحمد محمد' },
  { id: '2', name: 'مكتب النخبة العقاري', country_code: 'SA', owner_user_id: '2', status: 'active', created_at: '2024-02-15', member_count: 8, owner_name: 'سارة علي' },
  { id: '3', name: 'مكتب الصفوة', country_code: 'SA', owner_user_id: '5', status: 'suspended', created_at: '2023-11-01', member_count: 5, owner_name: 'خالد أحمد' },
];

// ─── Plans ────────────────────────────────────────────────
let mockPlans: Plan[] = [
  { id: '1', name: 'مجاني', tier: 'free', price_monthly_sar: 0, price_yearly_sar: 0, max_properties: 5, max_images_per_property: 3, max_organization_members: 1, max_saved_searches: 3, ai_enabled: false, export_enabled: false, features: ['5 عقارات', '3 صور لكل عقار', 'مشاركة عبر واتساب'], is_active: true, created_at: '2024-01-01' },
  { id: '2', name: 'احترافي', tier: 'pro', price_monthly_sar: 49, price_yearly_sar: 490, max_properties: 50, max_images_per_property: 10, max_organization_members: 1, max_saved_searches: 20, ai_enabled: true, export_enabled: true, features: ['50 عقار', '10 صور لكل عقار', 'ذكاء اصطناعي', 'تصدير البيانات', 'مشاركة متقدمة'], is_active: true, created_at: '2024-01-01' },
  { id: '3', name: 'مكتب', tier: 'office', price_monthly_sar: 149, price_yearly_sar: 1490, max_properties: 200, max_images_per_property: 20, max_organization_members: 10, max_saved_searches: 50, ai_enabled: true, export_enabled: true, features: ['200 عقار', '20 صورة لكل عقار', '10 أعضاء', 'ذكاء اصطناعي', 'تصدير', 'دعم فني مميز'], is_active: true, created_at: '2024-01-01' },
];

// ─── Reports ──────────────────────────────────────────────
let mockReports: (Report & { reporter_name: string })[] = [
  { id: '1', reporter_id: '2', property_id: '4', reason: 'معلومات غير صحيحة', description: 'السعر غير مطابق للواقع', status: 'pending', created_at: '2024-06-10', updated_at: '2024-06-10', reporter_name: 'سارة علي' },
  { id: '2', reporter_id: '4', property_id: '1', reason: 'إعلان مكرر', status: 'reviewing', created_at: '2024-06-08', updated_at: '2024-06-09', reporter_name: 'نورة عبدالله' },
  { id: '3', reporter_id: '1', user_id: '3', reason: 'سلوك مشبوه', description: 'المستخدم يرسل رسائل مزعجة', status: 'resolved', resolution: 'تم تعليق الحساب', created_at: '2024-06-01', updated_at: '2024-06-05', reporter_name: 'أحمد محمد' },
];

// ─── Audit Log ────────────────────────────────────────────
const mockAuditLogs: AdminAuditLog[] = Array.from({ length: 20 }, (_, i) => ({
  id: String(i + 1),
  admin_id: 'admin_1',
  action: ['create', 'update', 'delete', 'suspend', 'activate'][i % 5],
  target_type: ['user', 'property', 'organization', 'plan', 'report'][i % 5],
  target_id: `target_${i + 1}`,
  details: { note: `Admin action ${i + 1}` },
  ip_address: '192.168.1.1',
  created_at: new Date(Date.now() - i * 3600000).toISOString(),
}));

// ─── Payment Providers ────────────────────────────────────
let mockProviders: { id: string; name: string; enabled: boolean; config: Record<string, string> }[] = [
  { id: 'mada', name: 'مدى', enabled: true, config: { merchant_id: '12345', api_key: '****' } },
  { id: 'stc_pay', name: 'STC Pay', enabled: true, config: { api_key: '****' } },
  { id: 'apple_pay', name: 'Apple Pay', enabled: false, config: {} },
  { id: 'urpay', name: 'UrPay', enabled: false, config: {} },
  { id: 'hyperpay', name: 'HyperPay', enabled: true, config: { entity_id: 'abc123', access_token: '****' } },
  { id: 'moyasar', name: 'Moyasar', enabled: true, config: { publishable_key: 'pk_****', secret_key: '****' } },
  { id: 'tamara', name: 'تمارا', enabled: false, config: {} },
  { id: 'tabby', name: 'تابي', enabled: false, config: {} },
];

// ─── API functions ────────────────────────────────────────

export async function fetchDashboardStats(): Promise<DashboardStats> {
  await delay(300);
  return { ...mockStats };
}

export async function fetchRecentActivity(): Promise<RecentActivity[]> {
  await delay(200);
  return [...mockRecentActivity];
}

export async function fetchUsers(page = 1, perPage = 10, search = '', status = ''): Promise<PaginatedResponse<typeof mockUsers[0]>> {
  await delay(300);
  let filtered = [...mockUsers];
  if (search) filtered = filtered.filter((u) => u.profile.full_name.includes(search) || u.email.includes(search));
  if (status) filtered = filtered.filter((u) => u.status === status);
  return { data: filtered.slice((page - 1) * perPage, page * perPage), total: filtered.length, page, per_page: perPage, total_pages: Math.ceil(filtered.length / perPage) };
}

export async function suspendUser(userId: string): Promise<void> {
  await delay(200);
  const user = mockUsers.find((u) => u.id === userId);
  if (user) user.status = user.status === 'suspended' ? 'active' : 'suspended';
}

export async function deleteUser(userId: string): Promise<void> {
  await delay(200);
  mockUsers = mockUsers.filter((u) => u.id !== userId);
  mockStats.total_users--;
}

export async function fetchProperties(page = 1, perPage = 10, search = '', status = '', visibility = ''): Promise<PaginatedResponse<typeof mockProperties[0]>> {
  await delay(300);
  let filtered = [...mockProperties];
  if (search) filtered = filtered.filter((p) => p.title.includes(search) || p.id.includes(search));
  if (status) filtered = filtered.filter((p) => p.status === status);
  if (visibility) filtered = filtered.filter((p) => p.visibility === visibility);
  return { data: filtered.slice((page - 1) * perPage, page * perPage), total: filtered.length, page, per_page: perPage, total_pages: Math.ceil(filtered.length / perPage) };
}

export async function fetchOrganizations(page = 1, perPage = 10): Promise<PaginatedResponse<typeof mockOrganizations[0]>> {
  await delay(300);
  return { data: mockOrganizations.slice((page - 1) * perPage, page * perPage), total: mockOrganizations.length, page, per_page: perPage, total_pages: Math.ceil(mockOrganizations.length / perPage) };
}

export async function fetchPlans(): Promise<Plan[]> {
  await delay(200);
  return [...mockPlans];
}

export async function createPlan(plan: Omit<Plan, 'id' | 'created_at'>): Promise<Plan> {
  await delay(200);
  const newPlan: Plan = { ...plan, id: String(Date.now()), created_at: new Date().toISOString() };
  mockPlans.push(newPlan);
  return newPlan;
}

export async function updatePlan(id: string, data: Partial<Plan>): Promise<Plan> {
  await delay(200);
  const idx = mockPlans.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error('Plan not found');
  mockPlans[idx] = { ...mockPlans[idx], ...data };
  return mockPlans[idx];
}

export async function deletePlan(id: string): Promise<void> {
  await delay(200);
  mockPlans = mockPlans.filter((p) => p.id !== id);
}

export async function fetchReports(page = 1, perPage = 10): Promise<PaginatedResponse<typeof mockReports[0]>> {
  await delay(200);
  return { data: mockReports.slice((page - 1) * perPage, page * perPage), total: mockReports.length, page, per_page: perPage, total_pages: Math.ceil(mockReports.length / perPage) };
}

export async function updateReportStatus(id: string, status: string, resolution?: string): Promise<void> {
  await delay(200);
  const report = mockReports.find((r) => r.id === id);
  if (report) {
    report.status = status as any;
    if (resolution) report.resolution = resolution;
  }
}

export async function fetchAuditLogs(page = 1, perPage = 15): Promise<PaginatedResponse<AdminAuditLog>> {
  await delay(200);
  return { data: mockAuditLogs.slice((page - 1) * perPage, page * perPage), total: mockAuditLogs.length, page, per_page: perPage, total_pages: Math.ceil(mockAuditLogs.length / perPage) };
}

export async function fetchPaymentProviders(): Promise<typeof mockProviders> {
  await delay(200);
  return [...mockProviders];
}

export async function toggleProvider(id: string): Promise<void> {
  await delay(200);
  const provider = mockProviders.find((p) => p.id === id);
  if (provider) provider.enabled = !provider.enabled;
}

export async function updateProviderConfig(id: string, config: Record<string, string>): Promise<void> {
  await delay(200);
  const provider = mockProviders.find((p) => p.id === id);
  if (provider) provider.config = { ...provider.config, ...config };
}
