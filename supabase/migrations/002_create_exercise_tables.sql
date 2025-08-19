-- Migration: Create exercise analytics tables
-- Created: 2025-01-08
-- Description: Sets up tables for tracking exercise attempts, results, and explanation requests

-- Create exercise_attempts table
CREATE TABLE IF NOT EXISTS exercise_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'fill_in_blank', 'translation', 'pronunciation', 'listening', 'speaking')),
  concept TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  target_language TEXT NOT NULL,
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  time_spent_ms INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create explanation_requests table
CREATE TABLE IF NOT EXISTS explanation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  attempt_id UUID REFERENCES exercise_attempts(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('basic', 'grammar_rules', 'more_examples')),
  explanation_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create concept_progress table for tracking mastery
CREATE TABLE IF NOT EXISTS concept_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  concept TEXT NOT NULL,
  target_language TEXT NOT NULL,
  total_attempts INTEGER DEFAULT 0,
  correct_attempts INTEGER DEFAULT 0,
  average_score DECIMAL(5,2) DEFAULT 0,
  mastery_level DECIMAL(5,2) DEFAULT 0,
  needs_review BOOLEAN DEFAULT TRUE,
  last_attempt_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, concept, target_language)
);

-- Enable Row Level Security
ALTER TABLE exercise_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE explanation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exercise_attempts
CREATE POLICY "Users can view own exercise attempts" 
  ON exercise_attempts FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exercise attempts" 
  ON exercise_attempts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for explanation_requests
CREATE POLICY "Users can view own explanation requests" 
  ON explanation_requests FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own explanation requests" 
  ON explanation_requests FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own explanation requests" 
  ON explanation_requests FOR UPDATE 
  USING (auth.uid() = user_id);

-- RLS Policies for concept_progress
CREATE POLICY "Users can view own concept progress" 
  ON concept_progress FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own concept progress" 
  ON concept_progress FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own concept progress" 
  ON concept_progress FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create trigger for concept_progress updated_at
CREATE TRIGGER update_concept_progress_updated_at
  BEFORE UPDATE ON concept_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to update concept progress
CREATE OR REPLACE FUNCTION update_concept_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update concept progress after exercise attempt
  INSERT INTO concept_progress (
    user_id, 
    concept, 
    target_language, 
    total_attempts, 
    correct_attempts, 
    average_score,
    mastery_level,
    needs_review,
    last_attempt_at
  )
  VALUES (
    NEW.user_id,
    NEW.concept,
    NEW.target_language,
    1,
    CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
    NEW.score,
    CASE WHEN NEW.is_correct THEN LEAST(100, NEW.score + 10) ELSE GREATEST(0, NEW.score - 5) END,
    NEW.score < 70,
    NOW()
  )
  ON CONFLICT (user_id, concept, target_language)
  DO UPDATE SET
    total_attempts = concept_progress.total_attempts + 1,
    correct_attempts = concept_progress.correct_attempts + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
    average_score = (concept_progress.average_score * concept_progress.total_attempts + NEW.score) / (concept_progress.total_attempts + 1),
    mastery_level = CASE 
      WHEN NEW.is_correct THEN LEAST(100, concept_progress.mastery_level + 5)
      ELSE GREATEST(0, concept_progress.mastery_level - 2)
    END,
    needs_review = (concept_progress.average_score * concept_progress.total_attempts + NEW.score) / (concept_progress.total_attempts + 1) < 70,
    last_attempt_at = NOW(),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update concept progress
CREATE TRIGGER update_concept_progress_trigger
  AFTER INSERT ON exercise_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_concept_progress();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS exercise_attempts_user_id_idx ON exercise_attempts(user_id);
CREATE INDEX IF NOT EXISTS exercise_attempts_concept_idx ON exercise_attempts(concept);
CREATE INDEX IF NOT EXISTS exercise_attempts_created_at_idx ON exercise_attempts(created_at);
CREATE INDEX IF NOT EXISTS explanation_requests_user_id_idx ON explanation_requests(user_id);
CREATE INDEX IF NOT EXISTS explanation_requests_attempt_id_idx ON explanation_requests(attempt_id);
CREATE INDEX IF NOT EXISTS concept_progress_user_id_concept_idx ON concept_progress(user_id, concept);
CREATE INDEX IF NOT EXISTS concept_progress_needs_review_idx ON concept_progress(user_id, needs_review) WHERE needs_review = true;