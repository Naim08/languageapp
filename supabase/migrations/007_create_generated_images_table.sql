-- Create table for storing generated image metadata
CREATE TABLE IF NOT EXISTS generated_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  word TEXT NOT NULL,
  language TEXT NOT NULL,
  category TEXT,
  image_url TEXT NOT NULL,
  style TEXT DEFAULT 'simple',
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- Ensure unique combinations
  UNIQUE(word, language, style)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_generated_images_word_language 
ON generated_images(word, language);

CREATE INDEX IF NOT EXISTS idx_generated_images_category 
ON generated_images(category);

-- Create function to increment usage count
CREATE OR REPLACE FUNCTION increment_image_usage(image_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE generated_images 
  SET usage_count = usage_count + 1,
      last_used_at = NOW()
  WHERE id = image_id;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;

-- Allow public read access to generated images
CREATE POLICY "Allow public read access to generated images" ON generated_images
  FOR SELECT USING (true);

-- Allow authenticated users to insert/update their own images
CREATE POLICY "Allow authenticated users to manage images" ON generated_images
  FOR ALL USING (auth.role() = 'authenticated');

-- Add comment
COMMENT ON TABLE generated_images IS 'Stores metadata for AI-generated images used in language learning exercises'; 