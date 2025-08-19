#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env file manually
function loadEnv() {
  try {
    const envPath = path.join(process.cwd(), '.env');
    const envFile = fs.readFileSync(envPath, 'utf8');
    
    envFile.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes
          process.env[key.trim()] = value.trim();
        }
      }
    });
    console.log('✅ Environment variables loaded from .env file');
  } catch (error) {
    console.warn('⚠️ Could not load .env file:', error.message);
  }
}

// Load environment variables
loadEnv();

// Initialize Supabase with service role for imports
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_SECRET_KEY // Use service role for inserting content
);

/**
 * Import OpenQuizzDB questions (Multiple Choice)
 */
async function importOpenQuizzDB(filePath, targetLanguage) {
  console.log(`📥 Importing OpenQuizzDB for ${targetLanguage}...`);
  
  const questions = [];
  const questionsData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  questionsData.forEach((quiz, index) => {
    quiz.questions?.forEach((q, qIndex) => {
      const options = q.options?.map((opt, optIndex) => ({
        id: String.fromCharCode(97 + optIndex), // a, b, c, d
        text: opt.text,
        isCorrect: opt.correct,
        explanation: opt.correct ? "Correct answer" : "Incorrect option"
      })) || [];

      questions.push({
        concept: `general_knowledge_${quiz.category || 'misc'}`,
        question_type: 'multiple_choice',
        difficulty: 'intermediate',
        target_language: targetLanguage,
        question_text: q.question,
        correct_answer: options.find(o => o.isCorrect)?.text || '',
        options: JSON.stringify(options)
      });
    });
  });

  // Batch insert
  for (let i = 0; i < questions.length; i += 100) {
    const batch = questions.slice(i, i + 100);
    const { error } = await supabase
      .from('exercise_questions')
      .insert(batch);
    
    if (error) {
      console.error(`❌ Error inserting batch ${i}-${i+100}:`, error);
    } else {
      console.log(`✅ Inserted questions ${i+1}-${Math.min(i+100, questions.length)}`);
    }
  }
  
  console.log(`🎉 Imported ${questions.length} OpenQuizzDB questions for ${targetLanguage}`);
}

/**
 * Import Tatoeba sentence pairs (Translation exercises)
 */
async function importTatoeba(filePath, sourceLanguage, targetLanguage) {
  console.log(`📥 Importing Tatoeba ${sourceLanguage}-${targetLanguage}...`);
  
  const questions = [];
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const lines = fileContent.split('\n');
  
  lines.forEach((line, index) => {
    const [english, target, attribution] = line.split('\t');
    if (!english || !target) return;
    
    // Create translation question
    questions.push({
      concept: 'translation_practice',
      question_type: 'translation',
      difficulty: 'intermediate',
      target_language: targetLanguage,
      question_text: `Translate: "${english}"`,
              correct_answer: target,
        options: JSON.stringify([target]) // Single correct answer
    });
    
    // Create reverse translation
    questions.push({
      concept: 'translation_practice',
      question_type: 'translation', 
      difficulty: 'intermediate',
      target_language: sourceLanguage,
      question_text: `Translate: "${target}"`,
              correct_answer: english,
        options: JSON.stringify([english])
    });
  });

  // Batch insert
  for (let i = 0; i < questions.length; i += 100) {
    const batch = questions.slice(i, i + 100);
    const { error } = await supabase
      .from('exercise_questions')
      .insert(batch);
    
    if (error) {
      console.error(`❌ Error inserting batch ${i}-${i+100}:`, error);
    } else {
      console.log(`✅ Inserted questions ${i+1}-${Math.min(i+100, questions.length)}`);
    }
  }
  
  console.log(`🎉 Imported ${questions.length} Tatoeba questions for ${sourceLanguage}-${targetLanguage}`);
}

/**
 * Import vocabulary lists (Fill-in-blank exercises)
 */
async function importVocabulary(filePath, sourceLanguage, targetLanguage) {
  console.log(`📥 Importing vocabulary ${sourceLanguage}-${targetLanguage}...`);
  
  const questions = [];
  
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
      const sourceTerm = row[sourceLanguage] || row.source || row.english;
      const targetTerm = row[targetLanguage] || row.target;
      const category = row.category || 'vocabulary';
      
      if (!sourceTerm || !targetTerm) return;
      
      // Create fill-in-blank question
      questions.push({
        concept: `vocabulary_${category}`,
        question_type: 'fill_in_blank',
        difficulty: 'beginner',
        target_language: targetLanguage,
        question_text: `What is "${sourceTerm}" in ${targetLanguage}?`,
        correct_answer: targetTerm,
        hints: `${category} vocabulary`
      });
    })
    .on('end', async () => {
      // Batch insert
      for (let i = 0; i < questions.length; i += 100) {
        const batch = questions.slice(i, i + 100);
        const { error } = await supabase
          .from('exercise_questions')
          .insert(batch);
        
        if (error) {
          console.error(`❌ Error inserting batch ${i}-${i+100}:`, error);
        } else {
          console.log(`✅ Inserted questions ${i+1}-${Math.min(i+100, questions.length)}`);
        }
      }
      
      console.log(`🎉 Imported ${questions.length} vocabulary questions for ${sourceLanguage}-${targetLanguage}`);
    });
}

/**
 * Main import function
 */
async function main() {
  const command = process.argv[2];
  const filePath = process.argv[3];
  const language1 = process.argv[4];
  const language2 = process.argv[5];
  
  try {
    switch (command) {
      case 'openquizz':
        await importOpenQuizzDB(filePath, language1);
        break;
      case 'tatoeba':
        await importTatoeba(filePath, language1, language2);
        break;
      case 'vocabulary':
        await importVocabulary(filePath, language1, language2);
        break;
      default:
        console.log(`
Usage:
  node import-archives.js openquizz <jsonFile> <language>
  node import-archives.js tatoeba <textFile> <sourceLang> <targetLang>  
  node import-archives.js vocabulary <csvFile> <sourceLang> <targetLang>

Examples:
  node import-archives.js openquizz ./openquizz-spanish.json Spanish
  node import-archives.js tatoeba ./spa-eng.txt Spanish English
  node import-archives.js vocabulary ./spanish-vocabulary.csv English Spanish
        `);
    }
  } catch (error) {
    console.error('❌ Import failed:', error);
  }
}

if (require.main === module) {
  main();
}