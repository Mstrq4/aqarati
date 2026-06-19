// Aqarati — Shared type definitions

// ─── Identity ────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  phone: string;
  status: 'active' | 'suspended' | 'deleted';
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  user_id: string;
  full_name: string;
  avatar_url?: string;
  language: 'ar' | 'en';
  country_code: string;
  timezone: string;
  verified: boolean;
}

export interface Device {
  id: string;
  user_id: string;
  push_token?: string;
  platform: 'ios' | 'android' | 'huawei' | 'web';
  last_active: string;
}

// ─── Organization ────────────────────────────────────────
export type OrgRole = 'owner' | 'manager' | 'agent' | 'viewer';

export interface Organization {
  id: string;
  name: string;
  country_code: string;
  owner_user_id: string;
  status: 'active' | 'suspended';
  created_at: string;
}

export interface OrganizationMember {
  organization_id: string;
  user_id: string;
  role: OrgRole;
  status: 'active' | 'invited' | 'suspended';
  joined_at: string;
}

// ─── Property ────────────────────────────────────────────
export type PropertyVisibility = 'private' | 'organization' | 'public';
export type PropertyPurpose = 'sale' | 'rent' | 'investment';
export type PropertyStatus = 'draft' | 'active' | 'reserved' | 'sold' | 'rented' | 'archived';
export type PropertyType = 'apartment' | 'villa' | 'land' | 'commercial' | 'office' | 'warehouse' | 'farm' | 'floor' | 'building' | 'rest_house' | 'shop' | 'other';

export interface Property {
  id: string;
  owner_user_id: string;
  organization_id?: string;
  visibility: PropertyVisibility;
  purpose: PropertyPurpose;
  property_type: PropertyType;
  title: string;
  description?: string;
  status: PropertyStatus;
  completeness_score: number;
  created_at: string;
  updated_at: string;
}

export interface PropertyLocation {
  property_id: string;
  country_code: string;
  region?: string;
  city: string;
  district?: string;
  address_text?: string;
  lat?: number;
  lng?: number;
}

export interface PropertyDetails {
  property_id: string;
  area_sqm?: number;
  bedrooms?: number;
  bathrooms?: number;
  street_width?: number;
  age_years?: number;
  floor_number?: number;
  furnished?: boolean;
  features: Record<string, any>;
}

export interface PropertyPrice {
  id: string;
  property_id: string;
  price_amount: number;
  currency: string;
  negotiable: boolean;
  valid_from: string;
}

export interface PropertyMedia {
  id: string;
  property_id: string;
  type: 'image' | 'video' | 'document';
  storage_key: string;
  thumbnail_key?: string;
  sort_order: number;
  is_primary: boolean;
  metadata: Record<string, any>;
  created_at: string;
}

// ─── Contacts ────────────────────────────────────────────
export type ContactRole = 'owner' | 'agent' | 'client' | 'source';

export interface Contact {
  id: string;
  owner_user_id: string;
  name: string;
  phone?: string;
  email?: string;
  type: string;
  notes?: string;
  created_at: string;
}

export interface PropertyContact {
  property_id: string;
  contact_id: string;
  role: ContactRole;
}

// ─── Tags ────────────────────────────────────────────────
export interface Tag {
  id: string;
  name: string;
  color?: string;
  owner_user_id: string;
  organization_id?: string;
}

// ─── Favorites & Notes ───────────────────────────────────
export interface Favorite {
  user_id: string;
  property_id: string;
  created_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  property_id?: string;
  contact_id?: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// ─── Reminders ───────────────────────────────────────────
export type ReminderType = 'follow_up' | 'expiry' | 'incomplete' | 'custom';

export interface Reminder {
  id: string;
  user_id: string;
  property_id?: string;
  type: ReminderType;
  title: string;
  due_at: string;
  completed: boolean;
  created_at: string;
}

// ─── Search ──────────────────────────────────────────────
export interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  filters: SearchFilters;
  notify: boolean;
  created_at: string;
}

export interface SearchFilters {
  query?: string;
  country?: string;
  region?: string;
  city?: string;
  district?: string;
  property_type?: PropertyType[];
  purpose?: PropertyPurpose[];
  min_price?: number;
  max_price?: number;
  min_area?: number;
  max_area?: number;
  bedrooms?: number;
  visibility?: PropertyVisibility[];
  status?: PropertyStatus[];
  sort_by?: 'newest' | 'price_asc' | 'price_desc' | 'area_asc' | 'area_desc' | 'updated';
}

// ─── Sharing ─────────────────────────────────────────────
export interface ShareTemplate {
  id: string;
  user_id: string;
  organization_id?: string;
  name: string;
  body_template: string;
  created_at: string;
}

export interface ShareEvent {
  id: string;
  property_id: string;
  user_id: string;
  channel: 'whatsapp' | 'copy' | 'link';
  template_id?: string;
  recipient_contact_id?: string;
  created_at: string;
}

// ─── Billing ─────────────────────────────────────────────
export type PlanTier = 'free' | 'pro' | 'office';
export type SubscriptionStatus = 'active' | 'canceled' | 'expired' | 'trial';

export interface Plan {
  id: string;
  name: string;
  tier: PlanTier;
  price_monthly_sar: number;
  price_yearly_sar: number;
  max_properties: number;
  max_images_per_property: number;
  max_organization_members: number;
  max_saved_searches: number;
  ai_enabled: boolean;
  export_enabled: boolean;
  features: string[];
  is_active: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  organization_id?: string;
  plan_id: string;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
}

export interface Payment {
  id: string;
  subscription_id: string;
  amount_sar: number;
  provider: string;
  provider_reference?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  raw_payload?: Record<string, any>;
  created_at: string;
}

// ─── Admin ───────────────────────────────────────────────
export interface AdminAuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  property_id?: string;
  user_id?: string;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  resolution?: string;
  created_at: string;
  updated_at: string;
}

export interface Rating {
  id: string;
  user_id: string;
  property_id: string;
  score: number;
  review?: string;
  created_at: string;
}

// ─── Pagination ──────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// ─── API ─────────────────────────────────────────────────
export type ApiResponse<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
};
