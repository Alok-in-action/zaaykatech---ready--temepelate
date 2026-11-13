export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'restaurant_owner' | 'agent' | 'super_admin';
export type RestaurantStatus = 'draft' | 'preview' | 'published' | 'expired' | 'suspended';
export type SiteStatus = 'trialing' | 'trial_ending' | 'grace_period' | 'expired' | 'active' | 'payment_overdue';
export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled';
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';
export type AnalyticsEventType =
  | 'qr_scan'
  | 'menu_view'
  | 'item_view'
  | 'whatsapp_click'
  | 'call_click'
  | 'direction_click'
  | 'review_click';

export interface Profile {
  id: string;
  auth_user_id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface RestaurantBranding {
  logo_url: string | null;
  hero_media_type: 'image' | 'video';
  hero_media_url: string | null;
  hero_poster_url: string | null;
  tagline: string;
}

export interface RestaurantContact {
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
}

export interface RestaurantAddress {
  street: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  google_maps_url: string | null;
}

export interface RestaurantSocialLinks {
  instagram: string | null;
  facebook: string | null;
  google_review: string | null;
}

export interface RestaurantTheme {
  primary_color: string;
  accent_color: string;
  background_color: string;
  card_style: string;
}

export interface Restaurant {
  id: string;
  owner_profile_id: string;
  agent_id: string | null;
  slug: string;
  name: string;
  status: RestaurantStatus;
  onboarding_source: string;
  trial_ends_at: string;
  published_at: string | null;
  site_status: SiteStatus;
  subscription_end_date: string | null;
  branding: RestaurantBranding;
  contact: RestaurantContact;
  address: RestaurantAddress;
  social_links: RestaurantSocialLinks;
  theme: RestaurantTheme;
  created_at: string;
  updated_at: string;
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  slug: string;
  description: string | null;
  position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  price_paise: number | null;
  variant_prices: Record<string, number> | null;
  image_url: string | null;
  tags: string[];
  allergens: string[] | null;
  is_veg: boolean | null;
  is_available: boolean;
  is_signature: boolean;
  is_most_ordered: boolean;
  is_monsoon: boolean;
  custom_tag: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface QRCodeRecord {
  id: string;
  restaurant_id: string;
  short_code: string;
  scan_count: number;
  asset_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  price_paise: number;
  duration_days: number;
  features: Record<string, Json>;
  is_active: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  restaurant_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  started_at: string;
  expires_at: string;
  renewal_amount_paise: number;
  payment_provider: string;
  external_payment_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  restaurant_id: string;
  subscription_id: string | null;
  provider: string;
  external_payment_id: string;
  idempotency_key: string;
  amount_paise: number;
  status: PaymentStatus;
  raw_webhook_payload: Json | null;
  created_at: string;
}

export interface SiteAnalytics {
  id: string;
  restaurant_id: string;
  event_type: AnalyticsEventType;
  menu_item_id: string | null;
  session_id: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  restaurant_id: string | null;
  action: string;
  metadata: Record<string, Json>;
  created_at: string;
}

