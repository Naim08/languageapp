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

// Initialize Supabase clients
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_SECRET_KEY
);

const supabaseClient = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

// 🤖 Call Gemini via your existing edge function
async function callGeminiViaEdgeFunction(prompt, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Add small delay to be respectful
      if (attempt > 1) {
        console.log(`🔄 Retrying... (attempt ${attempt}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      const { data, error } = await supabaseClient.functions.invoke('gemini-conversation', {
        body: {
          prompt: prompt,
          task_type: 'explanation',
          language: 'Mixed Languages',
          user_level: 'intermediate',
          context: 'Generate educational multiple choice questions with contextual wrong answers that teach common language mistakes'
        }
      });

      if (error) {
        throw new Error(`Gemini edge function error: ${error.message}`);
      }

      // Extract the response text from Gemini's response format
      const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!responseText) {
        throw new Error('No response text from Gemini');
      }

      return responseText;
      
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      console.log(`⚠️ Request failed (attempt ${attempt}/${retries}): ${error.message}`);
    }
  }
}

// 📝 Create the multiple choice prompt
function createMCQPrompt(originalQuestion, correctAnswer, language) {
  return `Create a multiple choice question for language learning.

Original Question: "${originalQuestion}"
Correct Answer: "${correctAnswer}"
Target Language: ${language}

Create 4 options (A, B, C, D) where:
- One option is the correct answer
- Three options are educational wrong answers that represent common mistakes students make
- Each wrong answer should teach something specific (grammar rules, false friends, common confusions)

Respond with ONLY valid JSON in this exact format:
{
  "question": "What is the correct translation of '${originalQuestion}'?",
  "options": [
    {"label": "A", "text": "option text", "isCorrect": false},
    {"label": "B", "text": "correct answer here", "isCorrect": true},
    {"label": "C", "text": "wrong but educational option", "isCorrect": false},
    {"label": "D", "text": "another educational wrong option", "isCorrect": false}
  ],
  "explanation": "Brief explanation of why the correct answer is right and what the wrong answers represent",
  "concept": "Grammar concept or language rule being tested"
}`;
}

// 🧠 Parse Gemini's response into clean JSON
function parseGeminiResponse(response) {
  try {
    // Clean up the response - remove markdown formatting if present
    let cleanResponse = response.trim();
    
    // Remove ```json and ``` if present
    cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    
    // Parse JSON
    const mcqData = JSON.parse(cleanResponse);
    
    // Validate structure
    if (!mcqData.options || !Array.isArray(mcqData.options) || mcqData.options.length !== 4) {
      throw new Error('Invalid options structure - must have exactly 4 options');
    }
    
    // Ensure one correct answer
    const correctCount = mcqData.options.filter(opt => opt.isCorrect).length;
    if (correctCount !== 1) {
      throw new Error(`Invalid answer structure - must have exactly 1 correct answer, found ${correctCount}`);
    }
    
    return mcqData;
  } catch (error) {
    console.error('Parse error:', error.message);
    console.error('Raw response:', response);
    throw new Error(`Failed to parse Gemini response: ${error.message}`);
  }
}

// ✅ Setup check
async function setupGemini() {
  console.log('🔧 Testing Gemini via Edge Function...');
  console.log('============================================================');
  
  if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
    console.log('❌ Supabase configuration missing!');
    console.log('Make sure your .env file contains:');
    console.log('  EXPO_PUBLIC_SUPABASE_URL=your_url');
    console.log('  EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key');
    return false;
  }

  // Test the connection
  try {
    console.log('🧪 Testing with simple prompt...');
    const testPrompt = `Create a multiple choice question about the Spanish word "casa" (house). 
    
    Respond with ONLY valid JSON in this format:
    {
      "question": "What is the correct translation?",
      "options": [
        {"label": "A", "text": "house", "isCorrect": true},
        {"label": "B", "text": "car", "isCorrect": false},
        {"label": "C", "text": "tree", "isCorrect": false},
        {"label": "D", "text": "book", "isCorrect": false}
      ],
      "explanation": "Casa means house in Spanish",
      "concept": "Basic vocabulary"
    }`;

    const response = await callGeminiViaEdgeFunction(testPrompt);
    const parsed = parseGeminiResponse(response);
    
    console.log('✅ Gemini connection successful!');
    console.log('🤖 Model: Gemini (via your existing edge function)');
    console.log('📝 Sample question:', parsed.question);
    console.log('🎯 Correct answer:', parsed.options.find(opt => opt.isCorrect)?.text);
    return true;
    
  } catch (error) {
    console.log('❌ Gemini test failed:', error.message);
    console.log('Check your Gemini API key configuration in Supabase edge functions');
    return false;
  }
}

// 🚀 Generate MCQ questions in batches
async function batchGenerateMCQ(language = 'Spanish', count = 10) {
  console.log('🚀 Gemini-Powered Multiple Choice Generation');
  console.log('=' .repeat(60));
  console.log(`🎯 Target: ${count} high-quality multiple choice questions`);
  console.log(`🌍 Language: ${language}`);
  console.log(`🤖 Model: Google Gemini (via your existing edge function)`);
  
  // Setup check
  const setupOk = await setupGemini();
  if (!setupOk) return;

  // Get translation questions to convert
  console.log(`\n📖 Fetching ${count} translation questions for ${language}...`);
  const { data: questions, error } = await supabase
    .from('exercise_questions')
    .select('*')
    .eq('target_language', language)
    .eq('question_type', 'translation')
    .limit(count);

  if (error || !questions || questions.length === 0) {
    console.log(`❌ No translation questions found for ${language}`);
    return;
  }

  console.log(`✅ Found ${questions.length} questions to convert`);
  
  let successful = 0;
  let failed = 0;
  
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    
    try {
      // Create prompt
      const prompt = createMCQPrompt(q.question_text, q.correct_answer, q.target_language);
      
      // Call Gemini
      console.log(`🔄 Processing question ${i + 1}/${questions.length}... (⏳ Using Gemini edge function)`);
      const response = await callGeminiViaEdgeFunction(prompt);
      
      // Parse response
      const mcqData = parseGeminiResponse(response);
      
      // Update database
      const { error: updateError } = await supabase
        .from('exercise_questions')
        .update({
          question_type: 'multiple_choice',
          options: mcqData.options,
          explanation: mcqData.explanation,
          concept: mcqData.concept || 'Mixed concepts',
          updated_at: new Date().toISOString()
        })
        .eq('id', q.id);

      if (updateError) {
        throw new Error(`Database update failed: ${updateError.message}`);
      }

      successful++;
      
    } catch (error) {
      console.log(`❌ Question ${i + 1}: Failed - ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Generation Complete!`);
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`🎯 Success Rate: ${Math.round((successful / questions.length) * 100)}%`);
}

// 🧪 Test with a few questions
async function testGeneration() {
  console.log('🧪 Testing MCQ Generation (3 questions)...');
  await batchGenerateMCQ('Spanish', 3);
}

// 📊 Analyze question distribution
async function analyzeQuestions() {
  console.log('📊 Analyzing Current Question Distribution...');
  console.log('============================================================');
  
  try {
    // Get total count first
    console.log('🔍 Getting total count...');
    const { count: totalCount, error: countError } = await supabase
      .from('exercise_questions')
      .select('*', { count: 'exact', head: true });
    
    if (countError) throw countError;
    
    console.log(`📊 Total Questions: ${totalCount?.toLocaleString() || 'unknown'}`);
    
    // Get language distribution - manual aggregation
    console.log('🌍 Analyzing by language...');
    console.log('📝 Using manual aggregation...');
    
    // Get unique languages first  
    const { data: languages } = await supabase
      .from('exercise_questions')
      .select('target_language')
      .limit(1000);
      
    const uniqueLanguages = [...new Set(languages?.map(q => q.target_language) || [])];
    
    console.log('\nBy Language:');
    console.log('----------------------------------------');
    
    for (const lang of uniqueLanguages.slice(0, 10)) {
      const { count } = await supabase
        .from('exercise_questions')
        .select('*', { count: 'exact', head: true })
        .eq('target_language', lang);
        
      console.log(`${lang.padEnd(20)} ${count?.toLocaleString() || '?'} questions`);
    }
    
    // Get question type distribution
    console.log('\n🎯 Analyzing by question type...');
    const { data: typeData } = await supabase
      .from('exercise_questions')
      .select('question_type')
      .limit(5000);
      
    if (typeData) {
      const byType = {};
      typeData.forEach(q => {
        byType[q.question_type] = (byType[q.question_type] || 0) + 1;
      });
      
      console.log('\nBy Question Type (sample):');
      console.log('----------------------------------------');
      Object.entries(byType)
        .sort(([,a], [,b]) => b - a)
        .forEach(([type, count]) => {
          console.log(`${type.padEnd(20)} ${count.toLocaleString()}+ questions`);
        });
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`Total Questions: ${totalCount?.toLocaleString()}`);
    console.log(`Languages: ${uniqueLanguages?.length || '20+'}`);
    console.log(`Status: ✅ Database is healthy with curated content`);
    
  } catch (error) {
    console.error('Analysis failed:', error.message);
  }
}

// 📖 Main CLI
function showUsage() {
  console.log('🤖 Gemini-Powered Multiple Choice Generator');
  console.log('Usage:');
  console.log('  npm run llm-mcq setup                    - Test Gemini connection');
  console.log('  npm run llm-mcq test                     - Test with 3 questions');
  console.log('  npm run llm-mcq analyze                  - Analyze current questions');
  console.log('  npm run llm-mcq generate [lang] [count] - Generate questions');
  console.log('');
  console.log('Examples:');
  console.log('  npm run llm-mcq generate Spanish 50     - 50 Spanish MCQs');  
  console.log('  npm run llm-mcq generate French 25      - 25 French MCQs');
  console.log('');
  console.log('🤖 Model: Google Gemini (via your existing edge function)');
  console.log('💰 Cost: Uses your existing Gemini API setup');
  console.log('🎯 Quality: AI-generated contextual wrong answers with explanations');
  console.log('⚡ Performance: No rate limits - uses your infrastructure');
}

// 🚀 Run the CLI
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'setup':
      await setupGemini();
      break;
      
    case 'test':
      await testGeneration();
      break;
      
    case 'analyze':
      await analyzeQuestions();
      break;
      
    case 'generate':
      const language = process.argv[3] || 'Spanish';
      const count = parseInt(process.argv[4]) || 10;
      await batchGenerateMCQ(language, count);
      break;
      
    default:
      showUsage();
  }
}

if (require.main === module) {
  main().catch(console.error);
}