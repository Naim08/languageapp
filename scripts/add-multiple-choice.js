#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
function loadEnv() {
  try {
    const envPath = path.join(process.cwd(), '.env');
    const envFile = fs.readFileSync(envPath, 'utf8');
    
    envFile.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          process.env[key] = value;
        }
      }
    });
  } catch (error) {
    console.error('Could not load .env file:', error.message);
  }
}

loadEnv();

// Initialize Supabase with service role
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_SECRET_KEY
);

async function analyzeQuestionTypes() {
  console.log('📊 Analyzing Current Question Distribution...');
  console.log('=' .repeat(60));

  try {
    // Get total count first
    const { count: totalCount } = await supabase
      .from('exercise_questions')
      .select('*', { count: 'exact', head: true });

    console.log(`🔍 Total questions in database: ${totalCount?.toLocaleString() || 'unknown'}`);

    const { data: questions, error } = await supabase
      .from('exercise_questions')
      .select('target_language, question_type, id')
      .limit(50000);

    if (error) throw error;

    const stats = {};
    const typeStats = {};
    
    questions.forEach(q => {
      // Language stats
      if (!stats[q.target_language]) {
        stats[q.target_language] = 0;
      }
      stats[q.target_language]++;
      
      // Type stats
      if (!typeStats[q.question_type]) {
        typeStats[q.question_type] = 0;
      }
      typeStats[q.question_type]++;
    });

    console.log('By Language:');
    console.log('-'.repeat(40));
    Object.entries(stats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([lang, count]) => {
        console.log(`${lang.padEnd(20)} ${count.toLocaleString().padStart(6)} questions`);
      });

    console.log('\nBy Question Type:');
    console.log('-'.repeat(40));
    Object.entries(typeStats).forEach(([type, count]) => {
      console.log(`${type.padEnd(20)} ${count.toLocaleString().padStart(6)} questions`);
    });

    console.log('\n📊 Analysis:');
    console.log(`Total Questions: ${questions.length.toLocaleString()}`);
    console.log(`Languages: ${Object.keys(stats).length}`);
    console.log(`Question Types: ${Object.keys(typeStats).length}`);

    return { stats, typeStats, totalQuestions: questions.length };

  } catch (error) {
    console.error('❌ Failed to analyze questions:', error);
    return null;
  }
}

function generateWrongAnswers(correctAnswer, allAnswers, count = 3) {
  // Filter out the correct answer and get unique alternatives
  const alternatives = [...new Set(allAnswers)]
    .filter(answer => answer !== correctAnswer && answer.length > 0)
    .filter(answer => answer.toLowerCase() !== correctAnswer.toLowerCase());
  
  // Shuffle and take the requested count
  const shuffled = alternatives.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

async function convertToMultipleChoice(language, convertCount = 500) {
  console.log(`\n🔄 Converting ${convertCount} ${language} questions to multiple choice...`);

  try {
    // Get translation questions for this language
    const { data: questions, error: fetchError } = await supabase
      .from('exercise_questions')
      .select('*')
      .eq('target_language', language)
      .eq('question_type', 'translation')
      .limit(convertCount * 2); // Get more than needed for variety

    if (fetchError) throw fetchError;

    if (questions.length < convertCount) {
      console.log(`⚠️  Only ${questions.length} translation questions available for ${language}`);
      convertCount = Math.min(convertCount, questions.length);
    }

    // Get all possible answers for this language (for wrong answer generation)
    const allAnswers = questions.map(q => q.correct_answer);
    
    // Select random questions to convert
    const questionsToConvert = shuffleArray(questions).slice(0, convertCount);
    
    let converted = 0;

    for (const question of questionsToConvert) {
      // Generate wrong answers
      const wrongAnswers = generateWrongAnswers(question.correct_answer, allAnswers, 3);
      
      if (wrongAnswers.length < 2) {
        console.log(`⚠️  Skipping question - not enough wrong answers available`);
        continue;
      }

      // Create multiple choice options
      const options = [
        { id: 'a', text: question.correct_answer, isCorrect: true, explanation: 'Correct translation' },
        { id: 'b', text: wrongAnswers[0] || 'Alternative', isCorrect: false, explanation: 'Incorrect translation' },
        { id: 'c', text: wrongAnswers[1] || 'Alternative', isCorrect: false, explanation: 'Incorrect translation' },
        { id: 'd', text: wrongAnswers[2] || 'Alternative', isCorrect: false, explanation: 'Incorrect translation' }
      ];

      // Shuffle options but keep track of correct answer
      const shuffledOptions = shuffleArray(options);

      // Update the question
      const { error: updateError } = await supabase
        .from('exercise_questions')
        .update({
          question_type: 'multiple_choice',
          options: JSON.stringify(shuffledOptions),
          question_text: question.question_text.replace('Translate:', 'Choose the correct translation for:')
        })
        .eq('id', question.id);

      if (updateError) {
        console.error(`❌ Failed to update question ${question.id}:`, updateError);
      } else {
        converted++;
        if (converted % 50 === 0) {
          process.stdout.write(`✅ ${converted}/${convertCount} `);
        }
      }
    }

    console.log(`\n✅ ${language}: Successfully converted ${converted} questions to multiple choice`);
    return converted;

  } catch (error) {
    console.error(`❌ Failed to convert ${language} questions:`, error);
    return 0;
  }
}

async function addQuestionVariety() {
  console.log('🎯 Adding Question Type Variety...');
  console.log('=' .repeat(60));
  console.log('🎯 Target: Convert 25% of questions to multiple choice (10,000 questions)');
  console.log('📊 Strategy: 500 multiple choice per language');
  
  const analysis = await analyzeQuestionTypes();
  if (!analysis) return;

  console.log('\n🚀 Starting Conversion Process...');

  // Languages to convert (top 20)
  const languages = [
    'Spanish', 'French', 'German', 'Italian', 'Portuguese',
    'Russian', 'Japanese', 'Dutch', 'Polish', 'Chinese',
    'Turkish', 'Korean', 'Arabic', 'Hindi', 'Swedish',
    'Danish', 'Finnish', 'Hebrew', 'Czech', 'Hungarian'
  ];

  let totalConverted = 0;

  for (const language of languages) {
    const converted = await convertToMultipleChoice(language, 500);
    totalConverted += converted;
    
    // Small delay to avoid overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n🎉 CONVERSION COMPLETE!');
  console.log('=' .repeat(60));
  console.log(`📊 Total Converted: ${totalConverted.toLocaleString()} questions`);
  console.log(`🎯 Question Types: Translation + Multiple Choice`);
  console.log(`💡 Your app now has variety in question formats!`);

  // Final analysis
  console.log('\n📊 Final Analysis:');
  await analyzeQuestionTypes();
}

async function quickConversion() {
  console.log('⚡ Quick Multiple Choice Conversion...');
  
  const languages = ['Spanish', 'French', 'German', 'Italian', 'Portuguese'];
  
  for (const language of languages) {
    await convertToMultipleChoice(language, 200);
  }
  
  console.log('✅ Quick conversion complete! 1,000 multiple choice questions added.');
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'analyze':
    analyzeQuestionTypes();
    break;
  case 'convert':
    addQuestionVariety();
    break;
  case 'quick':
    quickConversion();
    break;
  default:
    console.log('🎯 Question Type Diversification Tool');
    console.log('');
    console.log('Usage:');
    console.log('  npm run add-variety analyze  - Analyze current question types');
    console.log('  npm run add-variety quick    - Quick conversion (1K multiple choice)');
    console.log('  npm run add-variety convert  - Full conversion (10K multiple choice)');
    console.log('');
    console.log('🎯 Goal: Add multiple choice questions for better variety');
    console.log('📊 Current: All translation questions');
    console.log('🎯 Target: 50% translation + 50% multiple choice');
}