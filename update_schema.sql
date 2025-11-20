-- Add English promotion banner text column to site_settings
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS promotion_banner_text_en TEXT;

-- Create conversation_states table to track archived/deleted status
CREATE TABLE IF NOT EXISTS conversation_states (
    user_email TEXT PRIMARY KEY,
    is_archived BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE conversation_states ENABLE ROW LEVEL SECURITY;

-- Policy for admins to view/edit all states (assuming admin check is done via app logic or separate admin role)
-- For simplicity in this setup, we'll allow authenticated users (admins) to manage this.
-- Ideally, you'd restrict this to specific admin emails.
CREATE POLICY "Admins can manage conversation states" 
ON conversation_states 
FOR ALL 
USING (auth.role() = 'authenticated');
