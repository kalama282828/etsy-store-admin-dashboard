
-- Add promotion banner columns to site_settings table
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS promotion_banner_text text DEFAULT 'Özel İndirim! Tüm paketlerde %20 indirim fırsatını kaçırmayın.',
ADD COLUMN IF NOT EXISTS promotion_banner_active boolean DEFAULT false;
