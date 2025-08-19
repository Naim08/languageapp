-- Migration: Create exercise question bank
-- Created: 2025-01-08
-- Description: Sets up curated question bank with smart selection capabilities

-- Create exercise_questions table
CREATE TABLE IF NOT EXISTS exercise_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'fill_in_blank', 'translation', 'pronunciation', 'listening', 'speaking')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  target_language TEXT NOT NULL,
  question_text TEXT NOT NULL,
  correct_answer TEXT,
  options JSONB, -- For multiple choice: [{"id": "a", "text": "...", "isCorrect": true}]
  hints TEXT, -- For fill-in-blank
  audio_url TEXT, -- For pronunciation/listening
  image_url TEXT, -- For visual questions
  tags TEXT[], -- Additional categorization ["grammar", "everyday", "formal"]
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_question_history table to track what user has seen
CREATE TABLE IF NOT EXISTS user_question_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES exercise_questions(id) ON DELETE CASCADE,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  times_seen INTEGER DEFAULT 1,
  
  UNIQUE(user_id, question_id)
);

-- Enable Row Level Security
ALTER TABLE exercise_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_question_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exercise_questions (readable by all authenticated users)
CREATE POLICY "Authenticated users can view questions" 
  ON exercise_questions FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Allow service role to insert questions (for content imports)
CREATE POLICY "Service role can insert questions" 
  ON exercise_questions FOR INSERT 
  WITH CHECK (auth.role() = 'service_role');

-- RLS Policies for user_question_history
CREATE POLICY "Users can view own question history" 
  ON user_question_history FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own question history" 
  ON user_question_history FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own question history" 
  ON user_question_history FOR UPDATE 
  USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS exercise_questions_concept_idx ON exercise_questions(concept);
CREATE INDEX IF NOT EXISTS exercise_questions_difficulty_idx ON exercise_questions(difficulty);
CREATE INDEX IF NOT EXISTS exercise_questions_language_idx ON exercise_questions(target_language);
CREATE INDEX IF NOT EXISTS exercise_questions_composite_idx ON exercise_questions(concept, target_language, difficulty, question_type);
CREATE INDEX IF NOT EXISTS user_question_history_user_question_idx ON user_question_history(user_id, question_id);
CREATE INDEX IF NOT EXISTS user_question_history_last_seen_idx ON user_question_history(user_id, last_seen_at);

-- Insert comprehensive Spanish question bank for immediate use
INSERT INTO exercise_questions (concept, question_type, difficulty, target_language, question_text, correct_answer, options, hints) VALUES

-- NUMBERS (1-10) - Beginner
('numbers_1_10', 'multiple_choice', 'beginner', 'Spanish', 'How do you say "3" in Spanish?', 'tres', 
'[{"id": "a", "text": "dos", "isCorrect": false, "explanation": "Dos means two"}, {"id": "b", "text": "tres", "isCorrect": true, "explanation": "Tres is three"}, {"id": "c", "text": "cuatro", "isCorrect": false, "explanation": "Cuatro means four"}, {"id": "d", "text": "cinco", "isCorrect": false, "explanation": "Cinco means five"}]'::jsonb, NULL),

('numbers_1_10', 'multiple_choice', 'beginner', 'Spanish', 'What number is "siete"?', '7', 
'[{"id": "a", "text": "6", "isCorrect": false, "explanation": "Seis is six"}, {"id": "b", "text": "7", "isCorrect": true, "explanation": "Siete is seven"}, {"id": "c", "text": "8", "isCorrect": false, "explanation": "Ocho is eight"}, {"id": "d", "text": "9", "isCorrect": false, "explanation": "Nueve is nine"}]'::jsonb, NULL),

('numbers_1_10', 'fill_in_blank', 'beginner', 'Spanish', 'Write the number: _____ (8)', 'ocho', NULL, 'Think about the sound "oh-cho"'),

('numbers_1_10', 'multiple_choice', 'beginner', 'Spanish', 'How do you say "10" in Spanish?', 'diez', 
'[{"id": "a", "text": "nueve", "isCorrect": false, "explanation": "Nueve is nine"}, {"id": "b", "text": "diez", "isCorrect": true, "explanation": "Diez is ten"}, {"id": "c", "text": "once", "isCorrect": false, "explanation": "Once is eleven"}, {"id": "d", "text": "doce", "isCorrect": false, "explanation": "Doce is twelve"}]'::jsonb, NULL),

-- GREETINGS - Beginner
('greetings', 'multiple_choice', 'beginner', 'Spanish', 'How do you say "Good morning"?', 'Buenos días', 
'[{"id": "a", "text": "Buenas noches", "isCorrect": false, "explanation": "This means good night"}, {"id": "b", "text": "Buenos días", "isCorrect": true, "explanation": "Buenos días means good morning"}, {"id": "c", "text": "Buenas tardes", "isCorrect": false, "explanation": "This means good afternoon"}, {"id": "d", "text": "Hola", "isCorrect": false, "explanation": "This just means hello"}]'::jsonb, NULL),

('greetings', 'multiple_choice', 'beginner', 'Spanish', 'What is the response to "¿Cómo estás?"', 'Bien, gracias', 
'[{"id": "a", "text": "Hola", "isCorrect": false, "explanation": "This is just hello"}, {"id": "b", "text": "Bien, gracias", "isCorrect": true, "explanation": "This means well, thank you"}, {"id": "c", "text": "Adiós", "isCorrect": false, "explanation": "This means goodbye"}, {"id": "d", "text": "Buenos días", "isCorrect": false, "explanation": "This means good morning"}]'::jsonb, NULL),

('greetings', 'fill_in_blank', 'beginner', 'Spanish', 'Complete: _____ me llamo María. (Hello)', 'Hola', NULL, 'Basic greeting before introducing yourself'),

-- FAMILY MEMBERS - Beginner
('family_members', 'multiple_choice', 'beginner', 'Spanish', 'How do you say "mother"?', 'madre', 
'[{"id": "a", "text": "padre", "isCorrect": false, "explanation": "Padre means father"}, {"id": "b", "text": "madre", "isCorrect": true, "explanation": "Madre means mother"}, {"id": "c", "text": "hermana", "isCorrect": false, "explanation": "Hermana means sister"}, {"id": "d", "text": "abuela", "isCorrect": false, "explanation": "Abuela means grandmother"}]'::jsonb, NULL),

('family_members', 'multiple_choice', 'beginner', 'Spanish', 'What does "hermano" mean?', 'brother', 
'[{"id": "a", "text": "sister", "isCorrect": false, "explanation": "Sister is hermana"}, {"id": "b", "text": "brother", "isCorrect": true, "explanation": "Hermano means brother"}, {"id": "c", "text": "cousin", "isCorrect": false, "explanation": "Cousin is primo"}, {"id": "d", "text": "uncle", "isCorrect": false, "explanation": "Uncle is tío"}]'::jsonb, NULL),

('family_members', 'fill_in_blank', 'beginner', 'Spanish', 'My father: Mi _____', 'padre', NULL, 'Male parent in Spanish'),

-- COLORS - Beginner
('colors', 'multiple_choice', 'beginner', 'Spanish', 'How do you say "red"?', 'rojo', 
'[{"id": "a", "text": "azul", "isCorrect": false, "explanation": "Azul means blue"}, {"id": "b", "text": "rojo", "isCorrect": true, "explanation": "Rojo means red"}, {"id": "c", "text": "verde", "isCorrect": false, "explanation": "Verde means green"}, {"id": "d", "text": "amarillo", "isCorrect": false, "explanation": "Amarillo means yellow"}]'::jsonb, NULL),

('colors', 'multiple_choice', 'beginner', 'Spanish', 'What color is "blanco"?', 'white', 
'[{"id": "a", "text": "black", "isCorrect": false, "explanation": "Black is negro"}, {"id": "b", "text": "white", "isCorrect": true, "explanation": "Blanco means white"}, {"id": "c", "text": "gray", "isCorrect": false, "explanation": "Gray is gris"}, {"id": "d", "text": "brown", "isCorrect": false, "explanation": "Brown is marrón"}]'::jsonb, NULL),

('colors', 'fill_in_blank', 'beginner', 'Spanish', 'The sky is blue: El cielo es _____', 'azul', NULL, 'Color of a clear sky'),

-- PRESENT TENSE -AR VERBS - Beginner/Intermediate  
('present_tense_basic', 'fill_in_blank', 'beginner', 'Spanish', 'I speak: Yo _____ (hablar)', 'hablo', NULL, 'First person singular -ar verb'),

('present_tense_basic', 'multiple_choice', 'beginner', 'Spanish', 'Complete: Ella _____ música. (escuchar)', 'escucha', 
'[{"id": "a", "text": "escucho", "isCorrect": false, "explanation": "Escucho is for yo (I)"}, {"id": "b", "text": "escucha", "isCorrect": true, "explanation": "Escucha is for ella (she)"}, {"id": "c", "text": "escuchas", "isCorrect": false, "explanation": "Escuchas is for tú (you)"}, {"id": "d", "text": "escuchan", "isCorrect": false, "explanation": "Escuchan is for ellos (they)"}]'::jsonb, NULL),

('present_tense_basic', 'fill_in_blank', 'intermediate', 'Spanish', 'We study: Nosotros _____ (estudiar)', 'estudiamos', NULL, 'First person plural -ar verb'),

-- GUSTAR - Intermediate
('gustar_singular', 'multiple_choice', 'intermediate', 'Spanish', 'Complete: Me ___ el chocolate.', 'gusta', 
'[{"id": "a", "text": "gusta", "isCorrect": true, "explanation": "Gusta with singular nouns like chocolate"}, {"id": "b", "text": "gustan", "isCorrect": false, "explanation": "Gustan is for plural nouns"}, {"id": "c", "text": "gustas", "isCorrect": false, "explanation": "Gustas is not used with gustar"}, {"id": "d", "text": "gusto", "isCorrect": false, "explanation": "Gusto means I like (different construction)"}]'::jsonb, NULL),

('gustar_plural', 'multiple_choice', 'intermediate', 'Spanish', 'Complete: No me ___ los deportes.', 'gustan', 
'[{"id": "a", "text": "gusta", "isCorrect": false, "explanation": "Gusta is for singular nouns"}, {"id": "b", "text": "gustan", "isCorrect": true, "explanation": "Gustan with plural nouns like deportes"}, {"id": "c", "text": "gustas", "isCorrect": false, "explanation": "Gustas is not used with gustar"}, {"id": "d", "text": "gustamos", "isCorrect": false, "explanation": "Gustamos is not used with gustar"}]'::jsonb, NULL),

('gustar_singular', 'fill_in_blank', 'intermediate', 'Spanish', 'I like coffee: Me _____ el café.', 'gusta', NULL, 'Gustar with singular objects'),

-- SER vs ESTAR - Intermediate
('ser_vs_estar', 'multiple_choice', 'intermediate', 'Spanish', 'Complete: Mi hermana ___ médica.', 'es', 
'[{"id": "a", "text": "es", "isCorrect": true, "explanation": "Es for permanent characteristics/professions"}, {"id": "b", "text": "está", "isCorrect": false, "explanation": "Está is for temporary states"}, {"id": "c", "text": "son", "isCorrect": false, "explanation": "Son is plural"}, {"id": "d", "text": "están", "isCorrect": false, "explanation": "Están is plural and temporary"}]'::jsonb, NULL),

('ser_vs_estar', 'multiple_choice', 'intermediate', 'Spanish', 'Complete: El café ___ caliente.', 'está', 
'[{"id": "a", "text": "es", "isCorrect": false, "explanation": "Es is for permanent characteristics"}, {"id": "b", "text": "está", "isCorrect": true, "explanation": "Está for temporary states like temperature"}, {"id": "c", "text": "son", "isCorrect": false, "explanation": "Son is plural"}, {"id": "d", "text": "están", "isCorrect": false, "explanation": "Están is plural"}]'::jsonb, NULL),

('ser_vs_estar', 'fill_in_blank', 'intermediate', 'Spanish', 'I am at home: Yo _____ en casa.', 'estoy', NULL, 'Use estar for location'),

-- FOOD & DRINKS - Beginner
('food_drinks', 'multiple_choice', 'beginner', 'Spanish', 'How do you say "water"?', 'agua', 
'[{"id": "a", "text": "leche", "isCorrect": false, "explanation": "Leche means milk"}, {"id": "b", "text": "agua", "isCorrect": true, "explanation": "Agua means water"}, {"id": "c", "text": "café", "isCorrect": false, "explanation": "Café means coffee"}, {"id": "d", "text": "té", "isCorrect": false, "explanation": "Té means tea"}]'::jsonb, NULL),

('food_drinks', 'multiple_choice', 'beginner', 'Spanish', 'What does "pan" mean?', 'bread', 
'[{"id": "a", "text": "meat", "isCorrect": false, "explanation": "Meat is carne"}, {"id": "b", "text": "bread", "isCorrect": true, "explanation": "Pan means bread"}, {"id": "c", "text": "cheese", "isCorrect": false, "explanation": "Cheese is queso"}, {"id": "d", "text": "rice", "isCorrect": false, "explanation": "Rice is arroz"}]'::jsonb, NULL),

('food_drinks', 'fill_in_blank', 'beginner', 'Spanish', 'I want an apple: Quiero una _____', 'manzana', NULL, 'Common red fruit'),

-- TIME EXPRESSIONS - Intermediate
('time_expressions', 'multiple_choice', 'intermediate', 'Spanish', 'How do you say "What time is it?"', '¿Qué hora es?', 
'[{"id": "a", "text": "¿Cómo estás?", "isCorrect": false, "explanation": "This means how are you"}, {"id": "b", "text": "¿Qué hora es?", "isCorrect": true, "explanation": "This means what time is it"}, {"id": "c", "text": "¿Dónde estás?", "isCorrect": false, "explanation": "This means where are you"}, {"id": "d", "text": "¿Cuántos años tienes?", "isCorrect": false, "explanation": "This means how old are you"}]'::jsonb, NULL),

('time_expressions', 'fill_in_blank', 'intermediate', 'Spanish', 'It is 2 oclock: Son las _____ en punto.', 'dos', NULL, 'Number for 2 in time expressions'),

-- Add French questions
('numbers_1_10', 'multiple_choice', 'beginner', 'French', 'How do you say "5" in French?', 'cinq', 
'[{"id": "a", "text": "quatre", "isCorrect": false, "explanation": "Quatre means four"}, {"id": "b", "text": "cinq", "isCorrect": true, "explanation": "Cinq is five"}, {"id": "c", "text": "six", "isCorrect": false, "explanation": "Six means six"}, {"id": "d", "text": "sept", "isCorrect": false, "explanation": "Sept means seven"}]'::jsonb, NULL),

('greetings', 'multiple_choice', 'beginner', 'French', 'How do you say "Good morning"?', 'Bonjour', 
'[{"id": "a", "text": "Bonsoir", "isCorrect": false, "explanation": "Bonsoir means good evening"}, {"id": "b", "text": "Bonjour", "isCorrect": true, "explanation": "Bonjour means good morning/hello"}, {"id": "c", "text": "Salut", "isCorrect": false, "explanation": "Salut is informal hi/bye"}, {"id": "d", "text": "Au revoir", "isCorrect": false, "explanation": "Au revoir means goodbye"}]'::jsonb, NULL),

('colors', 'multiple_choice', 'beginner', 'French', 'How do you say "blue"?', 'bleu', 
'[{"id": "a", "text": "rouge", "isCorrect": false, "explanation": "Rouge means red"}, {"id": "b", "text": "bleu", "isCorrect": true, "explanation": "Bleu means blue"}, {"id": "c", "text": "vert", "isCorrect": false, "explanation": "Vert means green"}, {"id": "d", "text": "jaune", "isCorrect": false, "explanation": "Jaune means yellow"}]'::jsonb, NULL),

-- Add German questions  
('numbers_1_10', 'multiple_choice', 'beginner', 'German', 'How do you say "3" in German?', 'drei', 
'[{"id": "a", "text": "zwei", "isCorrect": false, "explanation": "Zwei means two"}, {"id": "b", "text": "drei", "isCorrect": true, "explanation": "Drei is three"}, {"id": "c", "text": "vier", "isCorrect": false, "explanation": "Vier means four"}, {"id": "d", "text": "fünf", "isCorrect": false, "explanation": "Fünf means five"}]'::jsonb, NULL),

('greetings', 'multiple_choice', 'beginner', 'German', 'How do you say "Hello"?', 'Hallo', 
'[{"id": "a", "text": "Tschüss", "isCorrect": false, "explanation": "Tschüss means bye"}, {"id": "b", "text": "Hallo", "isCorrect": true, "explanation": "Hallo means hello"}, {"id": "c", "text": "Guten Abend", "isCorrect": false, "explanation": "Guten Abend means good evening"}, {"id": "d", "text": "Auf Wiedersehen", "isCorrect": false, "explanation": "Auf Wiedersehen means goodbye"}]'::jsonb, NULL),

('colors', 'fill_in_blank', 'beginner', 'German', 'Red in German: _____', 'rot', NULL, 'Color of fire');

-- Function to get next question for user based on their progress
CREATE OR REPLACE FUNCTION get_next_question_for_user(
  p_user_id UUID,
  p_target_language TEXT DEFAULT 'Spanish',
  p_difficulty TEXT DEFAULT NULL
) RETURNS TABLE (
  question_id UUID,
  concept TEXT,
  question_type TEXT,
  difficulty TEXT,
  target_language TEXT,
  question_text TEXT,
  correct_answer TEXT,
  options JSONB,
  hints TEXT,
  audio_url TEXT,
  image_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH weak_concepts AS (
    -- Get concepts that need review
    SELECT cp.concept, cp.mastery_level
    FROM concept_progress cp
    WHERE cp.user_id = p_user_id 
      AND cp.target_language = p_target_language
      AND (cp.needs_review = true OR cp.mastery_level < 70)
    ORDER BY cp.mastery_level ASC, cp.last_attempt_at ASC
    LIMIT 3
  ),
  unseen_questions AS (
    -- Get questions user hasn't seen recently
    SELECT eq.*
    FROM exercise_questions eq
    LEFT JOIN user_question_history uqh ON eq.id = uqh.question_id AND uqh.user_id = p_user_id
    WHERE eq.target_language = p_target_language
      AND (p_difficulty IS NULL OR eq.difficulty = p_difficulty)
      AND (
        uqh.question_id IS NULL OR 
        uqh.last_seen_at < NOW() - INTERVAL '24 hours'
      )
  )
  -- Prioritize weak concepts, then unseen questions
  SELECT 
    uq.id,
    uq.concept,
    uq.question_type,
    uq.difficulty,
    uq.target_language,
    uq.question_text,
    uq.correct_answer,
    uq.options,
    uq.hints,
    uq.audio_url,
    uq.image_url
  FROM unseen_questions uq
  LEFT JOIN weak_concepts wc ON uq.concept = wc.concept
  ORDER BY 
    CASE WHEN wc.concept IS NOT NULL THEN 0 ELSE 1 END, -- Weak concepts first
    wc.mastery_level ASC NULLS LAST,
    RANDOM() -- Random selection within priority groups
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;