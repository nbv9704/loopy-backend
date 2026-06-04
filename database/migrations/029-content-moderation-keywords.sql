-- ============================================================================
-- Migration 029: Content Moderation Keywords
-- ============================================================================
-- Purpose: Add content moderation system with keyword management
-- Date: 2026-06-04
-- Dependencies: None
-- ============================================================================

-- Create content_moderation_keywords table
CREATE TABLE content_moderation_keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword TEXT NOT NULL UNIQUE,
  category TEXT DEFAULT 'general' CHECK (category IN ('profanity', 'hate_speech', 'spam', 'general')),
  language TEXT DEFAULT 'all' CHECK (language IN ('vi', 'en', 'all')),
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for active keyword lookups (performance)
CREATE INDEX idx_moderation_keywords_active ON content_moderation_keywords(is_active);
CREATE INDEX idx_moderation_keywords_language ON content_moderation_keywords(language);

-- Add updated_at trigger
CREATE TRIGGER handle_keywords_updated_at 
BEFORE UPDATE ON content_moderation_keywords 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE content_moderation_keywords ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admins can manage keywords" 
ON content_moderation_keywords 
FOR ALL 
USING ((SELECT is_admin FROM user_profiles WHERE id = auth.uid()) = TRUE);

-- Public read for active keywords (for client-side preview/warnings)
CREATE POLICY "Anyone can read active keywords" 
ON content_moderation_keywords 
FOR SELECT 
USING (is_active = TRUE);

-- ============================================================================
-- Seed Initial Keywords (English + Vietnamese)
-- ============================================================================

-- Note: All keywords are lowercase as they will be normalized during validation

-- English Profanity
INSERT INTO content_moderation_keywords (keyword, category, language) VALUES
  ('fuck', 'profanity', 'en'),
  ('fucking', 'profanity', 'en'),
  ('fucked', 'profanity', 'en'),
  ('fucker', 'profanity', 'en'),
  ('shit', 'profanity', 'en'),
  ('shitting', 'profanity', 'en'),
  ('shitty', 'profanity', 'en'),
  ('bitch', 'profanity', 'en'),
  ('bitches', 'profanity', 'en'),
  ('bitching', 'profanity', 'en'),
  ('asshole', 'profanity', 'en'),
  ('bastard', 'profanity', 'en'),
  ('damn', 'profanity', 'en'),
  ('crap', 'profanity', 'en'),
  ('piss', 'profanity', 'en'),
  ('dick', 'profanity', 'en'),
  ('cock', 'profanity', 'en'),
  ('pussy', 'profanity', 'en'),
  ('whore', 'profanity', 'en'),
  ('slut', 'profanity', 'en'),
  ('nigger', 'hate_speech', 'en'),
  ('nigga', 'hate_speech', 'en'),
  ('faggot', 'hate_speech', 'en'),
  ('retard', 'hate_speech', 'en'),
  ('retarded', 'hate_speech', 'en')
ON CONFLICT (keyword) DO NOTHING;

-- Vietnamese Profanity (Base forms)
INSERT INTO content_moderation_keywords (keyword, category, language) VALUES
  -- Core vulgar words
  ('dm', 'profanity', 'vi'),
  ('dmm', 'profanity', 'vi'),
  ('dit', 'profanity', 'vi'),
  ('dit me', 'profanity', 'vi'),
  ('dit may', 'profanity', 'vi'),
  ('du', 'profanity', 'vi'),
  ('du ma', 'profanity', 'vi'),
  ('lon', 'profanity', 'vi'),
  ('cac', 'profanity', 'vi'),
  ('buoi', 'profanity', 'vi'),
  ('dcm', 'profanity', 'vi'),
  ('dcmm', 'profanity', 'vi'),
  ('dkm', 'profanity', 'vi'),
  ('dkmm', 'profanity', 'vi'),
  
  -- Common variations and abbreviations
  ('vcl', 'profanity', 'vi'),
  ('vl', 'profanity', 'vi'),
  ('cc', 'profanity', 'vi'),
  ('cl', 'profanity', 'vi'),
  ('cmm', 'profanity', 'vi'),
  ('cmn', 'profanity', 'vi'),
  ('cmnr', 'profanity', 'vi'),
  
  -- More explicit terms
  ('cut', 'profanity', 'vi'),
  ('cho', 'profanity', 'vi'),
  ('cho me', 'profanity', 'vi'),
  ('con cho', 'profanity', 'vi'),
  ('me may', 'profanity', 'vi'),
  ('thang cho', 'profanity', 'vi'),
  ('thang ngu', 'profanity', 'vi'),
  ('ngu', 'profanity', 'vi'),
  ('ngoc', 'profanity', 'vi'),
  ('lac', 'profanity', 'vi'),
  ('cave', 'profanity', 'vi'),
  
  -- Vulgar expressions
  ('bo di', 'profanity', 'vi'),
  ('di cho', 'profanity', 'vi'),
  ('chet di', 'profanity', 'vi'),
  ('dan ba', 'profanity', 'vi'),
  ('di me', 'profanity', 'vi')
ON CONFLICT (keyword) DO NOTHING;

-- Common spam patterns
INSERT INTO content_moderation_keywords (keyword, category, language) VALUES
  ('click here', 'spam', 'en'),
  ('buy now', 'spam', 'en'),
  ('make money', 'spam', 'en'),
  ('casino', 'spam', 'all'),
  ('viagra', 'spam', 'all'),
  ('penis enlargement', 'spam', 'en'),
  ('weight loss', 'spam', 'en'),
  ('crypto investment', 'spam', 'en')
ON CONFLICT (keyword) DO NOTHING;

-- ============================================================================
-- Verification Queries (commented out - for reference)
-- ============================================================================

-- Verify table created:
-- SELECT * FROM content_moderation_keywords LIMIT 10;

-- Count keywords by category:
-- SELECT category, language, COUNT(*) 
-- FROM content_moderation_keywords 
-- GROUP BY category, language 
-- ORDER BY category, language;

-- Total active keywords:
-- SELECT COUNT(*) as total_active_keywords 
-- FROM content_moderation_keywords 
-- WHERE is_active = TRUE;
