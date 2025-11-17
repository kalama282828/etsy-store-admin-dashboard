

export interface Customer {
  id?: number;
  name: string;
  email: string;
  avatar: string;
  plan: 'Basic' | 'Pro' | 'Premium';
  status: 'Active' | 'Churned' | 'Trial';
  spent: number;
  joinDate: string;
}

export interface Package {
  id?: number;
  name: string;
  price: number;
  features: string[];
  isPopular: boolean;
  subscribers?: number;
}

export interface RegisteredUser {
  id: string;
  email: string;
  etsy_store_url: string;
  created_at: string;
}

export interface Lead {
  id: number;
  name: string;
  email: string;
  store_url: string;
  selected_package: string;
  created_at: string;
}

// New types for editable site content
export interface HeroContent {
  title: string;
  subtitle: string;
  formPlaceholder: string;
  formButton: string;
}

export interface FeatureCardContent {
  title: string;
  description: string;
}

export interface FeaturesContent {
  title: string;
  subtitle: string;
  cards: FeatureCardContent[];
}

export interface PricingContent {
  title: string;
  subtitle: string;
}

export interface ProofContent {
  title: string;
  subtitle: string;
}

export interface SiteContent {
  hero: HeroContent;
  features: FeaturesContent;
  pricing: PricingContent;
  proof: ProofContent;
}

export interface ConversionSettings {
  id?: number;
  is_enabled: boolean;
  templates: string[];
  min_interval: number;
}
// FIX: Add FileObject type definition as it's not exported from @supabase/supabase-js in some versions.
export interface FileObject {
  name: string;
  id: string;
  updated_at?: string;
  created_at?: string;
  last_accessed_at?: string;
  metadata?: Record<string, any>;
}

export interface SiteSettings {
  id?: number;
  site_name: string;
  logo_url: string | null;
  page_title?: string | null;
}
