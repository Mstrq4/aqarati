// Aqarati Mobile — GraphQL API Client
// Connects React Native app to the real Rust backend

const GRAPHQL_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/graphql';

let authToken: string | null = null;

export function setToken(token: string | null) {
  authToken = token;
}

export function getToken(): string | null {
  return authToken;
}

async function graphql<T = any>(query: string, variables?: Record<string, any>): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  const res = await fetch(GRAPHQL_URL, { method: 'POST', headers, body: JSON.stringify({ query, variables }) });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}

// ─── Auth ────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<string> {
  const data = await graphql<{ login: { token: string; user: any } }>(
    'mutation($email: String!, $password: String!) { login(email: $email, password: $password) { token user { id email fullName } } }',
    { email, password }
  );
  setToken(data.login.token);
  return data.login.token;
}

export async function register(email: string, password: string, fullName: string, phone?: string) {
  const data = await graphql<{ register: { token: string; user: any } }>(
    'mutation($email: String!, $password: String!, $fullName: String!, $phone: String) { register(input: { email: $email, password: $password, fullName: $fullName, phone: $phone }) { token user { id email fullName } } }',
    { email, password, fullName, phone }
  );
  setToken(data.register.token);
  return data.register;
}

export async function getMe() {
  return graphql('{ me { id email fullName language status } }');
}

export function logout() {
  setToken(null);
}

// ─── Properties ──────────────────────────────────────────

export async function getMyProperties(limit = 20, offset = 0) {
  return graphql(`{ myProperties(limit: ${limit}, offset: ${offset}) { id title propertyType purpose status createdAt priceAmount city } }`);
}

export async function getProperty(id: string) {
  return graphql(`{ property(id: "${id}") { id title propertyType purpose description status priceAmount areaSqm bedrooms bathrooms city } }`);
}

export async function createProperty(input: Record<string, any>) {
  return graphql('mutation($input: CreatePropertyInput!) { createProperty(input: $input) { id title status } }', { input });
}

// ─── Plans ───────────────────────────────────────────────

export async function getPublicPlans() {
  return graphql('{ publicPlans { id name nameAr tier description descriptionAr priceMonthlySar maxProperties features isFeatured isPopular badgeLabelAr } }');
}

// ─── Search ──────────────────────────────────────────────

export async function searchProperties(query?: string, city?: string, propertyType?: string, purpose?: string, minPrice?: number, maxPrice?: number) {
  const filters: string[] = [];
  if (query) filters.push(`query: "${query}"`);
  if (city) filters.push(`city: "${city}"`);
  if (propertyType) filters.push(`propertyType: "${propertyType}"`);
  if (purpose) filters.push(`purpose: "${purpose}"`);
  if (minPrice) filters.push(`minPrice: ${minPrice}`);
  if (maxPrice) filters.push(`maxPrice: ${maxPrice}`);
  const filterStr = filters.length > 0 ? `(${filters.join(', ')})` : '';
  return graphql(`{ searchProperties${filterStr} { id title propertyType purpose status createdAt priceAmount city } }`);
}

// ─── Password Recovery ───────────────────────────────────

export async function forgotPassword(email: string) {
  return graphql('mutation($email: String!) { forgotPassword(email: $email) }', { email });
}

export async function resetPassword(token: string, newPassword: string) {
  return graphql('mutation($token: String!, $newPassword: String!) { resetPassword(token: $token, newPassword: $newPassword) }', { token, newPassword });
}
