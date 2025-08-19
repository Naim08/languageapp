-- Add missing columns to generated_images table for quality tracking and source

-- Add source column to track where the image came from
ALTER TABLE generated_images 
ADD COLUMN IF NOT EXISTS source TEXT;

-- Add quality score column for Gemini Vision assessment
ALTER TABLE generated_images 
ADD COLUMN IF NOT EXISTS quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100);

-- Add quality assessment column for storing recommendation
ALTER TABLE generated_images 
ADD COLUMN IF NOT EXISTS quality_assessment TEXT CHECK (
  quality_assessment IN ('excellent', 'good', 'acceptable', 'poor', 'replace') 
  OR quality_assessment IS NULL
);

-- Add created_at column if it doesn't exist (some scripts expect this)
ALTER TABLE generated_images 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update the unique constraint to include source
ALTER TABLE generated_images 
DROP CONSTRAINT IF EXISTS generated_images_word_language_style_key;

ALTER TABLE generated_images 
ADD CONSTRAINT generated_images_word_language_style_key 
UNIQUE(word, language, style);

-- Add index for source column for faster filtering
CREATE INDEX IF NOT EXISTS idx_generated_images_source 
ON generated_images(source);

-- Add index for quality assessment for finding images that need replacement
CREATE INDEX IF NOT EXISTS idx_generated_images_quality 
ON generated_images(quality_assessment);

-- Update the table comment
COMMENT ON TABLE generated_images IS 'Stores metadata for images used in language learning exercises, including quality assessments';
COMMENT ON COLUMN generated_images.source IS 'Source of the image (pixabay, unsplash, pexels, placeholder, etc.)';
COMMENT ON COLUMN generated_images.quality_score IS 'Quality score from 0-100 as assessed by Gemini Vision';
COMMENT ON COLUMN generated_images.quality_assessment IS 'Quality recommendation: excellent, good, acceptable, poor, or replace';