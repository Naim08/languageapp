-- Create a function to truncate the exercise_questions table quickly
CREATE OR REPLACE FUNCTION truncate_questions() RETURNS TEXT AS $$
BEGIN
  -- Temporarily disable RLS for faster operation
  ALTER TABLE exercise_questions DISABLE ROW LEVEL SECURITY;
  
  -- Truncate the table (instant operation)
  TRUNCATE TABLE exercise_questions RESTART IDENTITY CASCADE;
  
  -- Re-enable RLS
  ALTER TABLE exercise_questions ENABLE ROW LEVEL SECURITY;
  
  RETURN 'Table truncated successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;