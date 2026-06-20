// Aqarati Customer Web — GraphQL API Client
// Connects to the real Rust backend GraphQL endpoint

const GRAPHQL_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/graphql';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
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

// ─── Types ────────────────────────────────────────────

export interface UserData {
  id: string;
  email: string;
  phone?: string | null;
  fullName?: string | null;
  language?: string | null;
  status?: string | null;
}

export interface AuthPayload {
  token: string;
  user: UserData;
}

export interface PropertyData {
  id: string;
  title: string;
  propertyType: string;
  purpose: string;
  priceAmount?: number | null;
  city?: string | null;
  status: string;
  visibility: string;
  mainImageUrl?: string | null;
  createdAt: string;
}

export interface SubscriptionData {
  id: string;
  planName: string;
  tier: string;
  status: string;
  currentPeriodEnd: string;
}

export interface OrganizationData {
  id: string;
  name: string;
  role: string;
  memberCount: number;
  propertyCount: number;
}

export interface ContactData {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  type: string;
}

export interface ReminderData {
  id: string;
  title: string;
  dueAt: string;
  completed: boolean;
  propertyId?: string | null;
}

export interface SavedSearchData {
  id: string;
  name: string;
  filters: string;
  notify: boolean;
}

export interface PublicPlanData {
  id: string;
  name: string;
  tier: string;
  description?: string | null;
  priceMonthlySar?: number | null;
  priceYearlySar?: number | null;
  maxProperties: number;
  maxImagesPerProperty: number;
  aiEnabled: boolean;
  features?: PlanFeatureData[];
}

export interface PlanFeatureData {
  id: string;
  name: string;
  included: boolean;
}

// ─── Auth ─────────────────────────────────────────────

export async function login(email: string, password: string): Promise<AuthPayload> {
  const data = await graphql<{ login: AuthPayload }>(
    `mutation Login($email: String!, $password: String!) {
      login(email: $email, password: $password) { token user { id email phone fullName language status } }
    }`,
    { email, password }
  );
  if (data.login?.token) {
    localStorage.setItem('aq-token', data.login.token);
    document.cookie = `aq-token=${data.login.token}; path=/; max-age=2592000; SameSite=Lax`;
  }
  return data.login;
}

export async function register(email: string, password: string, fullName: string, phone?: string): Promise<AuthPayload> {
  const data = await graphql<{ register: AuthPayload }>(
    `mutation Register($email: String!, $password: String!, $fullName: String!, $phone: String) {
      register(email: $email, password: $password, fullName: $fullName, phone: $phone) { token user { id email fullName } }
    }`,
    { email, password, fullName, phone }
  );
  if (data.register?.token) {
    localStorage.setItem('aq-token', data.register.token);
    document.cookie = `aq-token=${data.register.token}; path=/; max-age=2592000; SameSite=Lax`;
  }
  return data.register;
}

export async function forgotPassword(email: string): Promise<boolean> {
  const data = await graphql<{ forgotPassword: boolean }>(
    `mutation ForgotPassword($email: String!) { forgotPassword(email: $email) }`,
    { email }
  );
  return data.forgotPassword;
}

export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  const data = await graphql<{ resetPassword: boolean }>(
    `mutation ResetPassword($token: String!, $newPassword: String!) { resetPassword(token: $token, newPassword: $newPassword) }`,
    { token, newPassword }
  );
  return data.resetPassword;
}

export async function me(): Promise<UserData | null> {
  const data = await graphql<{ me: UserData }>(
    `query Me { me { id email phone fullName language status } }`
  );
  return data.me || null;
}

export function logout(): void {
  localStorage.removeItem('aq-token');
  document.cookie = 'aq-token=; path=/; max-age=0';
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

// ─── Properties ───────────────────────────────────────

export interface CreatePropertyInput {
  title: string;
  propertyType: string;
  purpose: string;
  priceAmount?: number;
  city?: string;
  description?: string;
  areaSqm?: number;
  bedrooms?: number;
  bathrooms?: number;
  ownerPhone: string;
  visibility?: string;
}

export async function createProperty(input: CreatePropertyInput): Promise<PropertyData> {
  const data = await graphql<{ createProperty: PropertyData }>(
    `mutation CreateProperty($input: CreatePropertyInput!) {
      createProperty(input: $input) { id title propertyType purpose status createdAt }
    }`,
    { input }
  );
  return data.createProperty;
}

export async function fetchMyProperties(): Promise<PropertyData[]> {
  const data = await graphql<{ myProperties: PropertyData[] }>(
    `query MyProperties { myProperties { id title propertyType purpose priceAmount city status visibility mainImageUrl createdAt } }`
  );
  return data.myProperties || [];
}

export async function fetchProperty(id: string): Promise<PropertyData | null> {
  const data = await graphql<{ property: PropertyData }>(
    `query Property($id: ID!) { property(id: $id) { id title propertyType purpose priceAmount city status visibility mainImageUrl createdAt } }`,
    { id }
  );
  return data.property || null;
}

// ─── Subscription ─────────────────────────────────────

export async function fetchMySubscription(): Promise<SubscriptionData | null> {
  const data = await graphql<{ mySubscription: SubscriptionData }>(
    `query MySubscription { mySubscription { id planName tier status currentPeriodEnd } }`
  );
  return data.mySubscription || null;
}

// ─── Organizations ────────────────────────────────────

export async function fetchMyOrganizations(): Promise<OrganizationData[]> {
  const data = await graphql<{ myOrganizations: OrganizationData[] }>(
    `query MyOrganizations { myOrganizations { id name role memberCount propertyCount } }`
  );
  return data.myOrganizations || [];
}

// ─── Contacts ─────────────────────────────────────────

export async function fetchMyContacts(): Promise<ContactData[]> {
  const data = await graphql<{ myContacts: ContactData[] }>(
    `query MyContacts { myContacts { id name phone email type } }`
  );
  return data.myContacts || [];
}

// ─── Reminders ────────────────────────────────────────

export async function fetchMyReminders(): Promise<ReminderData[]> {
  const data = await graphql<{ myReminders: ReminderData[] }>(
    `query MyReminders { myReminders { id title dueAt completed propertyId } }`
  );
  return data.myReminders || [];
}

// ─── Saved Searches ───────────────────────────────────

export async function fetchMySavedSearches(): Promise<SavedSearchData[]> {
  const data = await graphql<{ mySavedSearches: SavedSearchData[] }>(
    `query MySavedSearches { mySavedSearches { id name filters notify } }`
  );
  return data.mySavedSearches || [];
}

// ─── Public Plans ─────────────────────────────────────

export async function fetchPublicPlans(): Promise<PublicPlanData[]> {
  const data = await graphql<{ publicPlans: PublicPlanData[] }>(
    `query PublicPlans {
      publicPlans {
        id name tier description priceMonthlySar priceYearlySar maxProperties maxImagesPerProperty aiEnabled
        features { id name included }
      }
    }`
  );
  return data.publicPlans || [];
}
