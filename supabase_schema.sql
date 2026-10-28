-- ==============================================================================
-- VISITING CARD SCANNER - COMPLETE SUPABASE DATABASE SCHEMA
-- ==============================================================================
-- To execute this in Supabase:
-- 1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/falczjbcyenjsbpvmwjw/sql
-- 2. Click "New Query", paste this entire script, and click "Run" (or Ctrl + Enter).
-- ==============================================================================

-- 1. Create Visiting Cards Table with all essential & optional fields
CREATE TABLE IF NOT EXISTS public.visiting_cards (
    -- Unique identifier
    id TEXT PRIMARY KEY,
    
    -- Mandatory Core Fields
    person_name TEXT NOT NULL,
    business_name TEXT NOT NULL,
    contact_number TEXT NOT NULL,
    
    -- Dynamic Multi-Number & Contact Arrays
    mobile_numbers TEXT[] DEFAULT '{}',
    landline_number TEXT,
    landline_numbers TEXT[] DEFAULT '{}',
    whatsapp_number TEXT,
    
    -- Professional & Digital Contacts
    job_title TEXT,
    email TEXT,
    emails TEXT[] DEFAULT '{}',
    website TEXT,
    websites TEXT[] DEFAULT '{}',
    
    -- Categorization & Specializations
    business_category TEXT,     -- e.g. "Tools, Hardware & Machinery", "Agriculture & Farming"
    business_description TEXT,  -- e.g. "Importers of Power Tools & Spares"
    
    -- Physical Location
    address TEXT,
    pincode TEXT,               -- e.g. "600066", "421302"
    
    -- Metadata & Media
    notes TEXT,                 -- e.g. "Met at Bangalore Trade Summit 2026"
    tags TEXT[] DEFAULT '{}',   -- e.g. ARRAY['client', 'vendor', 'investor']
    image_url TEXT,             -- Original card photo URL or path
    raw_text TEXT,              -- Full unedited OCR text for search & reference
    
    -- Multi-user support (optional, links to Supabase Auth if used later)
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration for existing tables:
ALTER TABLE public.visiting_cards ADD COLUMN IF NOT EXISTS mobile_numbers TEXT[] DEFAULT '{}';
ALTER TABLE public.visiting_cards ADD COLUMN IF NOT EXISTS landline_number TEXT;
ALTER TABLE public.visiting_cards ADD COLUMN IF NOT EXISTS landline_numbers TEXT[] DEFAULT '{}';
ALTER TABLE public.visiting_cards ADD COLUMN IF NOT EXISTS emails TEXT[] DEFAULT '{}';
ALTER TABLE public.visiting_cards ADD COLUMN IF NOT EXISTS websites TEXT[] DEFAULT '{}';
ALTER TABLE public.visiting_cards ADD COLUMN IF NOT EXISTS pincode TEXT;
ALTER TABLE public.visiting_cards ADD COLUMN IF NOT EXISTS business_description TEXT;

-- 2. Trigger to automatically update `updated_at` on modification
CREATE OR REPLACE FUNCTION update_visiting_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_visiting_cards_updated_at ON public.visiting_cards;
CREATE TRIGGER trigger_visiting_cards_updated_at
BEFORE UPDATE ON public.visiting_cards
FOR EACH ROW
EXECUTE FUNCTION update_visiting_cards_updated_at();

-- 3. High-Performance Indexes for Fast Search
CREATE INDEX IF NOT EXISTS idx_visiting_cards_person_name 
ON public.visiting_cards (person_name);

CREATE INDEX IF NOT EXISTS idx_visiting_cards_business_name 
ON public.visiting_cards (business_name);

CREATE INDEX IF NOT EXISTS idx_visiting_cards_contact_number 
ON public.visiting_cards (contact_number);

CREATE INDEX IF NOT EXISTS idx_visiting_cards_category 
ON public.visiting_cards (business_category);

CREATE INDEX IF NOT EXISTS idx_visiting_cards_created_at 
ON public.visiting_cards (created_at DESC);

-- 4. Full-Text Search (FTS) Index for Instant Multi-Field Search
-- Allows searching across person, company, designation, address, and notes all at once
CREATE INDEX IF NOT EXISTS idx_visiting_cards_fts ON public.visiting_cards 
USING gin(to_tsvector('english', 
    COALESCE(person_name, '') || ' ' || 
    COALESCE(business_name, '') || ' ' || 
    COALESCE(job_title, '') || ' ' || 
    COALESCE(business_category, '') || ' ' || 
    COALESCE(address, '') || ' ' || 
    COALESCE(notes, '')
));

-- 5. Row Level Security (RLS) Configuration
ALTER TABLE public.visiting_cards ENABLE ROW LEVEL SECURITY;

-- Allow public access via Anon Key / Service Role Key
DROP POLICY IF EXISTS "Allow public read visiting_cards" ON public.visiting_cards;
CREATE POLICY "Allow public read visiting_cards" 
ON public.visiting_cards FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert visiting_cards" ON public.visiting_cards;
CREATE POLICY "Allow public insert visiting_cards" 
ON public.visiting_cards FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update visiting_cards" ON public.visiting_cards;
CREATE POLICY "Allow public update visiting_cards" 
ON public.visiting_cards FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete visiting_cards" ON public.visiting_cards;
CREATE POLICY "Allow public delete visiting_cards" 
ON public.visiting_cards FOR DELETE USING (true);

-- 6. Storage Bucket for Card Photos (Optional)
-- You can also store card images in Supabase Storage under a bucket named 'card-images'
INSERT INTO storage.buckets (id, name, public)
VALUES ('card-images', 'card-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can view card photos" ON storage.objects;
CREATE POLICY "Public can view card photos" 
ON storage.objects FOR SELECT USING (bucket_id = 'card-images');

DROP POLICY IF EXISTS "Public can upload card photos" ON storage.objects;
CREATE POLICY "Public can upload card photos" 
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'card-images');
