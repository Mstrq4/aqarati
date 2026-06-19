// Aqarati Admin — GraphQL API Client
// Connects to the real Rust backend GraphQL endpoint

const GRAPHQL_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/graphql';

function getToken(): string | null {
  return localStorage.getItem('aq-token');
}

async function graphql<T = any>(query: string, variables?: Record<string, any>): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) {
    const msg = json.errors[0]?.message || 'GraphQL error';
    throw new Error(msg);
  }
  return json.data;
}

// ─── Plan Types ──────────────────────────────────────────

export interface PlanDetail {
  id: string;
  name: string;
  nameAr?: string | null;
  nameEn?: string | null;
  slug?: string | null;
  tier: string;
  description?: string | null;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  priceMonthlySar?: number | null;
  priceYearlySar?: number | null;
  currency?: string | null;
  billingInterval?: string | null;
  trialDays?: number | null;
  maxProperties: number;
  maxImagesPerProperty: number;
  maxTotalImages?: number | null;
  maxStorageMb?: number | null;
  maxOrganizationMembers: number;
  maxTeamMembers?: number | null;
  maxSavedSearches: number;
  maxAiRequestsPerMonth?: number | null;
  featuredListingsLimit?: number | null;
  aiEnabled: boolean;
  exportEnabled: boolean;
  supportLevel?: string | null;
  status?: string | null;
  visibility?: string | null;
  displayOrder?: number | null;
  isFeatured?: boolean | null;
  isPopular?: boolean | null;
  isRecommended?: boolean | null;
  badgeLabelAr?: string | null;
  badgeLabelEn?: string | null;
  features: string[];
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface PlanFeature {
  id: string;
  planId: string;
  featureKey: string;
  labelAr: string;
  labelEn?: string | null;
  isEnabled: boolean;
  valueLimit?: string | null;
  displayOrder?: number | null;
  tooltipAr?: string | null;
  tooltipEn?: string | null;
  isIncluded: boolean;
}

// ─── Plan Queries ────────────────────────────────────────

export async function fetchAdminPlans(): Promise<PlanDetail[]> {
  const data = await graphql<{ adminPlans: PlanDetail[] }>(
    `{ adminPlans { id name nameAr nameEn slug tier description descriptionAr descriptionEn priceMonthlySar priceYearlySar currency billingInterval trialDays maxProperties maxImagesPerProperty maxTotalImages maxStorageMb maxOrganizationMembers maxTeamMembers maxSavedSearches maxAiRequestsPerMonth featuredListingsLimit aiEnabled exportEnabled supportLevel status visibility displayOrder isFeatured isPopular isRecommended badgeLabelAr badgeLabelEn features createdAt updatedAt } }`
  );
  return data.adminPlans;
}

export async function fetchPublicPlans(): Promise<PlanDetail[]> {
  const data = await graphql<{ publicPlans: PlanDetail[] }>(
    `{ publicPlans { id name nameAr nameEn tier description descriptionAr descriptionEn priceMonthlySar priceYearlySar maxProperties maxImagesPerProperty maxOrganizationMembers aiEnabled exportEnabled status displayOrder isFeatured isPopular isRecommended badgeLabelAr badgeLabelEn features } }`
  );
  return data.publicPlans;
}

// ─── Plan Mutations ──────────────────────────────────────

export async function adminCreatePlan(input: Record<string, any>): Promise<PlanDetail> {
  const data = await graphql<{ adminCreatePlan: PlanDetail }>(
    `mutation ($input: CreatePlanInput!) { adminCreatePlan(input: $input) { id name nameAr nameEn slug tier description descriptionAr descriptionEn priceMonthlySar priceYearlySar currency billingInterval trialDays maxProperties maxImagesPerProperty maxTotalImages maxStorageMb maxOrganizationMembers maxTeamMembers maxSavedSearches maxAiRequestsPerMonth featuredListingsLimit aiEnabled exportEnabled supportLevel visibility displayOrder isFeatured isPopular isRecommended badgeLabelAr badgeLabelEn features createdAt updatedAt } }`,
    { input }
  );
  return data.adminCreatePlan;
}

export async function adminUpdatePlan(id: string, input: Record<string, any>): Promise<PlanDetail> {
  const data = await graphql<{ adminUpdatePlan: PlanDetail }>(
    `mutation ($id: ID!, $input: UpdatePlanInput!) { adminUpdatePlan(id: $id, input: $input) { id name nameAr nameEn slug tier description descriptionAr descriptionEn priceMonthlySar priceYearlySar currency billingInterval trialDays maxProperties maxImagesPerProperty maxTotalImages maxStorageMb maxOrganizationMembers maxTeamMembers maxSavedSearches maxAiRequestsPerMonth featuredListingsLimit aiEnabled exportEnabled supportLevel visibility displayOrder isFeatured isPopular isRecommended badgeLabelAr badgeLabelEn features createdAt updatedAt } }`,
    { id, input }
  );
  return data.adminUpdatePlan;
}

export async function adminArchivePlan(id: string): Promise<boolean> {
  const data = await graphql<{ adminArchivePlan: boolean }>(
    `mutation ($id: ID!) { adminArchivePlan(id: $id) }`,
    { id }
  );
  return data.adminArchivePlan;
}

export async function adminDeletePlan(id: string): Promise<boolean> {
  const data = await graphql<{ adminDeletePlan: boolean }>(
    `mutation ($id: ID!) { adminDeletePlan(id: $id) }`,
    { id }
  );
  return data.adminDeletePlan;
}

export async function adminSetPlanFeatured(id: string, featured: boolean): Promise<PlanDetail> {
  const data = await graphql<{ adminSetPlanFeatured: PlanDetail }>(
    `mutation ($id: ID!, $featured: Boolean!) { adminSetPlanFeatured(id: $id, featured: $featured) { id name isFeatured } }`,
    { id, featured }
  );
  return data.adminSetPlanFeatured;
}

export async function adminSetPlanPopular(id: string, popular: boolean): Promise<PlanDetail> {
  const data = await graphql<{ adminSetPlanPopular: PlanDetail }>(
    `mutation ($id: ID!, $popular: Boolean!) { adminSetPlanPopular(id: $id, popular: $popular) { id name isPopular } }`,
    { id, popular }
  );
  return data.adminSetPlanPopular;
}

export async function adminSetPlanRecommended(id: string, recommended: boolean): Promise<PlanDetail> {
  const data = await graphql<{ adminSetPlanRecommended: PlanDetail }>(
    `mutation ($id: ID!, $recommended: Boolean!) { adminSetPlanRecommended(id: $id, recommended: $recommended) { id name isRecommended } }`,
    { id, recommended }
  );
  return data.adminSetPlanRecommended;
}

export async function adminSetPlanVisibility(id: string, visibility: string): Promise<PlanDetail> {
  const data = await graphql<{ adminSetPlanVisibility: PlanDetail }>(
    `mutation ($id: ID!, $visibility: String!) { adminSetPlanVisibility(id: $id, visibility: $visibility) { id name visibility } }`,
    { id, visibility }
  );
  return data.adminSetPlanVisibility;
}

export async function adminReorderPlans(planIds: string[]): Promise<boolean> {
  const data = await graphql<{ adminReorderPlans: boolean }>(
    `mutation ($planIds: [ID!]!) { adminReorderPlans(planIds: $planIds) }`,
    { planIds }
  );
  return data.adminReorderPlans;
}

// ─── Plan Feature Mutations ──────────────────────────────

export async function adminCreatePlanFeature(input: Record<string, any>): Promise<PlanFeature> {
  const data = await graphql<{ adminCreatePlanFeature: PlanFeature }>(
    `mutation ($input: CreatePlanFeatureInput!) { adminCreatePlanFeature(input: $input) { id planId featureKey labelAr labelEn isEnabled valueLimit displayOrder tooltipAr tooltipEn isIncluded } }`,
    { input }
  );
  return data.adminCreatePlanFeature;
}

export async function adminUpdatePlanFeature(id: string, input: Record<string, any>): Promise<PlanFeature> {
  const data = await graphql<{ adminUpdatePlanFeature: PlanFeature }>(
    `mutation ($id: ID!, $input: UpdatePlanFeatureInput!) { adminUpdatePlanFeature(id: $id, input: $input) { id planId featureKey labelAr labelEn isEnabled valueLimit displayOrder tooltipAr tooltipEn isIncluded } }`,
    { id, input }
  );
  return data.adminUpdatePlanFeature;
}

export async function adminDeletePlanFeature(id: string): Promise<boolean> {
  const data = await graphql<{ adminDeletePlanFeature: boolean }>(
    `mutation ($id: ID!) { adminDeletePlanFeature(id: $id) }`,
    { id }
  );
  return data.adminDeletePlanFeature;
}

// ─── Auth ────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<string> {
  const data = await graphql<{ login: { token: string } }>(
    `mutation ($email: String!, $password: String!) { login(email: $email, password: $password) { token } }`,
    { email, password }
  );
  localStorage.setItem('aq-token', data.login.token);
  return data.login.token;
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function logout(): void {
  localStorage.removeItem('aq-token');
}

// ─── Dashboard ────────────────────────────────────────────

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
  user: string;
  target: string;
  time: string;
  created_at: string;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const data = await graphql<{ adminDashboard: DashboardStats }>(
    `{ adminDashboard { totalUsers totalProperties totalOrganizations totalRevenueSar activeSubscriptions pendingReports } }`
  );
  // Map snake_case from GraphQL to camelCase for frontend
  const d = data.adminDashboard || {};
  return {
    total_users: (d as any).totalUsers || 0,
    total_properties: (d as any).totalProperties || 0,
    total_organizations: (d as any).totalOrganizations || 0,
    total_revenue_sar: (d as any).totalRevenueSar || 0,
    active_subscriptions: (d as any).activeSubscriptions || 0,
    pending_reports: (d as any).pendingReports || 0,
  };
}

export async function fetchRecentActivity(): Promise<RecentActivity[]> {
  // Uses adminAuditLog query for recent activity
  const data = await graphql<{ adminAuditLog: RecentActivity[] }>(
    `{ adminAuditLog(limit: 10) { id action user target createdAt } }`
  );
  return (data.adminAuditLog || []).map((e: any) => ({
    id: e.id,
    action: e.action,
    user: e.user || 'System',
    target: e.target || '',
    time: e.createdAt,
    created_at: e.createdAt,
  }));
}

// ─── Users ────────────────────────────────────────────────

export async function fetchUsers(
  page: number,
  limit: number,
  search?: string,
  statusFilter?: string
): Promise<{ data: any[]; total: number }> {
  const offset = (page - 1) * limit;
  const data = await graphql<{ adminUsers: any[] }>(
    `{ adminUsers(limit: ${limit}, offset: ${offset}) { id email phone fullName language status } }`
  );
  const users = (data.adminUsers || []).map((u: any) => ({
    id: u.id,
    email: u.email || '',
    phone: u.phone || '',
    status: u.status || 'active',
    created_at: '',
    updated_at: '',
    profile: {
      user_id: u.id,
      full_name: u.fullName || '',
      avatar_url: undefined,
      language: u.language || 'ar',
      country_code: 'SA',
      timezone: 'Asia/Riyadh',
      verified: false,
    },
  }));
  return { data: users, total: users.length };
}

export async function suspendUser(id: string): Promise<void> {
  await graphql(
    `mutation ($id: ID!) { adminSuspendUser(id: $id) }`,
    { id }
  );
}

export async function deleteUser(id: string): Promise<void> {
  await graphql(
    `mutation ($id: ID!) { adminDeleteUser(id: $id) }`,
    { id }
  );
}

// ─── Payment Providers ────────────────────────────────────

export interface PaymentProvider {
  id: string;
  providerKey: string;
  displayName: string;
  isEnabled: boolean;
  supportedMethods: string[];
}

export async function fetchPaymentProviders(): Promise<any[]> {
  const data = await graphql<{ paymentProviders: any[] }>(
    `{ paymentProviders { id providerKey displayName isEnabled supportedMethods } }`
  );
  return (data.paymentProviders || []).map((p: any) => ({
    id: p.id,
    name: p.displayName,
    enabled: p.isEnabled,
    config: {} as Record<string, string>,
  }));
}

export async function toggleProvider(id: string): Promise<void> {
  const data = await graphql<{ paymentProviders: any[] }>(
    `{ paymentProviders { id providerKey isEnabled } }`
  );
  const provider = (data.paymentProviders || []).find((p: any) => p.id === id);
  if (provider) {
    await graphql(
      `mutation ($key: String!, $enabled: Boolean!) { adminTogglePaymentProvider(providerKey: $key, isEnabled: $enabled) { id } }`,
      { key: provider.providerKey, enabled: !provider.isEnabled }
    );
  }
}

export async function updateProviderConfig(id: string, config: Record<string, string>): Promise<void> {
  await graphql(
    `mutation ($key: String!, $config: JSON!) { adminUpdateProviderConfig(providerKey: $key, config: $config) }`,
    { key: id, config }
  );
}

// ─── Audit Log ────────────────────────────────────────────

// Note: AdminAuditLog type is imported from ../shared by pages.
// This function returns data compatible with ../shared's AdminAuditLog.

export async function fetchAuditLogs(
  page: number,
  limit: number
): Promise<{ data: any[]; total: number }> {
  const offset = (page - 1) * limit;
  const data = await graphql<{ adminAuditLog: any[] }>(
    `{ adminAuditLog(limit: ${limit}, offset: ${offset}) { id adminId action targetType targetId details createdAt } }`
  );
  const logs = (data.adminAuditLog || []).map((e: any) => ({
    id: e.id,
    admin_id: e.adminId || '',
    action: e.action,
    target_type: e.targetType || '',
    target_id: e.targetId,
    details: typeof e.details === 'string' ? JSON.parse(e.details || '{}') : (e.details || {}),
    created_at: e.createdAt,
  }));
  return { data: logs, total: logs.length };
}

// ─── Properties ───────────────────────────────────────────

export interface AdminProperty {
  id: string;
  title: string;
  propertyType: string;
  purpose: string;
  priceAmount: number | null;
  city: string;
  status: string;
  visibility: string;
  createdAt: string;
  ownerName: string;
}

export async function fetchProperties(
  page: number,
  limit: number,
  search?: string,
  statusFilter?: string,
  visibilityFilter?: string
): Promise<{ data: any[]; total: number }> {
  const offset = (page - 1) * limit;
  const data = await graphql<{ adminProperties: any[] }>(
    `{ adminProperties(limit: ${limit}, offset: ${offset}) { id title propertyType purpose priceAmount city status visibility createdAt ownerName } }`
  );
  return { data: data.adminProperties || [], total: (data.adminProperties || []).length };
}

// ─── Organizations ────────────────────────────────────────

export interface AdminOrganization {
  id: string;
  name: string;
  country_code: string;
  owner_user_id: string;
  status: string;
  created_at: string;
  member_count: number;
  owner_name: string;
}

export async function fetchOrganizations(
  page: number,
  limit: number
): Promise<{ data: AdminOrganization[]; total: number }> {
  const offset = (page - 1) * limit;
  const data = await graphql<{ adminOrganizations: AdminOrganization[] }>(
    `{ adminOrganizations(limit: ${limit}, offset: ${offset}) { id name status createdAt memberCount ownerName } }`
  );
  const orgs = (data.adminOrganizations || []).map((o: any) => ({
    id: o.id,
    name: o.name,
    country_code: 'SA',
    owner_user_id: '',
    status: o.status || 'active',
    created_at: o.createdAt,
    member_count: o.memberCount || 0,
    owner_name: o.ownerName || '',
  }));
  return { data: orgs, total: orgs.length };
}

// ─── Reports ──────────────────────────────────────────────

export interface AdminReport {
  id: string;
  property_id?: string;
  reported_user_id?: string;
  reason: string;
  description?: string;
  status: string;
  created_at: string;
  reporter_name: string;
}

export async function fetchReports(
  page: number,
  limit: number
): Promise<{ data: any[]; total: number }> {
  const offset = (page - 1) * limit;
  const data = await graphql<{ adminReports: any[] }>(
    `{ adminReports(limit: ${limit}, offset: ${offset}) { id reason description status createdAt reporterName } }`
  );
  const reports = (data.adminReports || []).map((r: any) => ({
    id: r.id,
    reason: r.reason,
    description: r.description,
    status: r.status,
    created_at: r.createdAt,
    reporter_name: r.reporterName || 'Unknown',
  }));
  return { data: reports, total: reports.length };
}

export async function updateReportStatus(
  id: string,
  status: string,
  resolution?: string
): Promise<void> {
  await graphql(
    `mutation ($id: ID!, $status: String!, $resolution: String) { adminUpdateReportStatus(id: $id, status: $status, resolution: $resolution) }`,
    { id, status, resolution: resolution || null }
  );
}

// ─── Settings ──────────────────────────────────────────

export interface SettingEntry {
  key: string;
  value: string;
  updatedAt: string;
}

export async function fetchSettings(): Promise<SettingEntry[]> {
  const data = await graphql<{ adminSettings: any[] }>(
    `query AdminSettings { adminSettings { key value updatedAt } }`
  );
  return (data.adminSettings || []).map((s: any) => ({
    key: s.key,
    value: s.value,
    updatedAt: s.updatedAt || s.updated_at || '',
  }));
}

export async function updateSetting(key: string, value: string): Promise<SettingEntry> {
  const data = await graphql<{ adminUpdateSetting: any }>(
    `mutation UpdateSetting($key: String!, $value: String!) { adminUpdateSetting(key: $key, value: $value) { key value updatedAt } }`,
    { key, value }
  );
  const s = data.adminUpdateSetting;
  return { key: s.key, value: s.value, updatedAt: s.updatedAt || s.updated_at || '' };
}
