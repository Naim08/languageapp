-- Create table for tracking user feedback on images
CREATE TABLE IF NOT EXISTS image_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  word TEXT NOT NULL,
  good_count INTEGER DEFAULT 0,
  bad_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique combinations
  UNIQUE(image_url, word)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_image_feedback_word 
ON image_feedback(word);

CREATE INDEX IF NOT EXISTS idx_image_feedback_url 
ON image_feedback(image_url);

-- Add RLS policies
ALTER TABLE image_feedback ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read feedback
CREATE POLICY "Allow authenticated users to read feedback" ON image_feedback
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert/update feedback
CREATE POLICY "Allow authenticated users to manage feedback" ON image_feedback
  FOR ALL USING (auth.role() = 'authenticated');

-- Add source column to generated_images if it doesn't exist
ALTER TABLE generated_images 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'unknown';

-- Add comment
COMMENT ON TABLE image_feedback IS 'Tracks user feedback on image quality for continuous improvement';