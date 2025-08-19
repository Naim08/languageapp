-- Fix RLS policies for exercise_questions table
-- Allow all users to read questions (they're public content)

-- Enable RLS if not already enabled
ALTER TABLE exercise_questions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "exercise_questions_read_all" ON exercise_questions;
DROP POLICY IF EXISTS "exercise_questions_insert_service" ON exercise_questions;
DROP POLICY IF EXISTS "exercise_questions_update_service" ON exercise_questions;
DROP POLICY IF EXISTS "exercise_questions_delete_service" ON exercise_questions;

-- Create new policies
-- Allow everyone (including anonymous users) to read questions
CREATE POLICY "exercise_questions_read_all" ON exercise_questions
    FOR SELECT
    USING (true);

-- Only service role can insert
CREATE POLICY "exercise_questions_insert_service" ON exercise_questions
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Only service role can update
CREATE POLICY "exercise_questions_update_service" ON exercise_questions
    FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Only service role can delete
CREATE POLICY "exercise_questions_delete_service" ON exercise_questions
    FOR DELETE
    TO service_role
    USING (true);

-- Also fix generated_images table RLS
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "generated_images_read_all" ON generated_images;
DROP POLICY IF EXISTS "generated_images_insert_service" ON generated_images;
DROP POLICY IF EXISTS "generated_images_update_service" ON generated_images;

-- Allow everyone to read images
CREATE POLICY "generated_images_read_all" ON generated_images
    FOR SELECT
    USING (true);

-- Only service role can insert
CREATE POLICY "generated_images_insert_service" ON generated_images
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Only service role can update
CREATE POLICY "generated_images_update_service" ON generated_images
    FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);