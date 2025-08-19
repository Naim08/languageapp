#!/usr/bin/env node

/**
 * Question Bank Generation Script
 * 
 * Usage:
 * node scripts/generate-questions.js spanish           # Generate Spanish questions
 * node scripts/generate-questions.js all-priority     # Generate all priority languages
 * node scripts/generate-questions.js analyze          # Show current coverage
 * 
 * This script generates AI-powered question banks for language learning.
 * It uses OpenAI to create authentic, high-quality questions and stores them in Supabase.
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Core concepts for any language
const UNIVERSAL_CONCEPTS = [
  // Priority 1: Essential basics
  { concept: 'numbers_1_10', description: 'Numbers 1-10', priority: 1, questionTypes: ['multiple_choice', 'fill_in_blank'] },
  { concept: 'greetings', description: 'Basic greetings and introductions', priority: 1, questionTypes: ['multiple_choice', 'translation'] },
  { concept: 'family_members', description: 'Family vocabulary', priority: 1, questionTypes: ['multiple_choice', 'fill_in_blank'] },
  { concept: 'colors', description: 'Basic colors', priority: 1, questionTypes: ['multiple_choice', 'translation'] },
  { concept: 'present_tense_basic', description: 'Present tense - most common verbs', priority: 1, questionTypes: ['fill_in_blank', 'multiple_choice'] },
  
  // Priority 2: Common everyday
  { concept: 'food_drinks', description: 'Food and drinks vocabulary', priority: 2, questionTypes: ['multiple_choice', 'translation'] },
  { concept: 'time_expressions', description: 'Telling time and time expressions', priority: 2, questionTypes: ['multiple_choice', 'fill_in_blank'] },
  { concept: 'weather', description: 'Weather vocabulary and expressions', priority: 2, questionTypes: ['multiple_choice', 'translation'] },
  { concept: 'body_parts', description: 'Body parts vocabulary', priority: 2, questionTypes: ['multiple_choice', 'fill_in_blank'] },
];

const PRIORITY_LANGUAGES = [
  'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian', 'Japanese', 'Korean', 
  'Chinese', 'Arabic', 'Hindi', 'Dutch', 'Swedish', 'Norwegian', 'Polish', 'Turkish',
  'Vietnamese', 'Thai', 'Indonesian', 'Hebrew', 'Czech', 'Hungarian', 'Finnish', 'Greek'
];

async function callOpenAI(prompt) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/openai-conversation`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4',
      temperature: 0.7,
      max_tokens: 2000
    })
  });
  
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

function createGenerationPrompt(language, concept, difficulty, questionType, count) {
  return `You are a language learning expert. Generate ${count} high-quality ${questionType} questions for ${language} learners.

Target: ${difficulty} level students learning "${concept.replace(/_/g, ' ')}"

Requirements:
1. Questions must be practical and commonly used
2. Use authentic ${language} expressions
3. Include cultural context when appropriate
4. Vary sentence structures and vocabulary
5. Make distractors plausible but clearly wrong

${questionType === 'multiple_choice' ? `
Format each question as JSON:
{
  "concept": "${concept}",
  "text": "Complete: '[sentence with blank]'",
  "correctAnswer": "correct_option_text",
  "options": [
    {"id": "a", "text": "option1", "isCorrect": false, "explanation": "why wrong"},
    {"id": "b", "text": "correct_answer", "isCorrect": true, "explanation": "why correct"},
    {"id": "c", "text": "option3", "isCorrect": false, "explanation": "why wrong"},
    {"id": "d", "text": "option4", "isCorrect": false, "explanation": "why wrong"}
  ]
}` : ''}

${questionType === 'fill_in_blank' ? `
Format each question as JSON:
{
  "concept": "${concept}",
  "text": "Complete: '[sentence with _____ blank]'",
  "correctAnswers": ["answer1", "answer2"], 
  "hint": "helpful hint for learners"
}` : ''}

${questionType === 'translation' ? `
Format each question as JSON:
{
  "concept": "${concept}",
  "text": "Translate to ${language}: '[English sentence]'",
  "acceptableTranslations": ["translation1", "translation2"],
  "sourceLanguage": "English"
}` : ''}

Return ONLY a JSON array of exactly ${count} questions. No additional text.`;
}

async function generateQuestionBatch(language, concept, difficulty, questionType, count) {
  const prompt = createGenerationPrompt(language, concept, difficulty, questionType, count);
  
  try {
    console.log(`  📝 Generating ${count} ${questionType} questions (${difficulty})`);
    
    const response = await callOpenAI(prompt);
    
    // Parse JSON from response
    let parsed;
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      console.error('    ❌ No JSON array found in response');
      return [];
    }

    // Convert to database format
    const dbQuestions = parsed.map(q => ({
      concept: concept,
      question_type: questionType,
      difficulty: difficulty,
      target_language: language,
      question_text: q.text,
      correct_answer: questionType === 'multiple_choice' 
        ? q.options?.find(opt => opt.isCorrect)?.text
        : questionType === 'fill_in_blank' 
        ? q.correctAnswers?.[0]
        : q.acceptableTranslations?.[0],
      options: questionType === 'multiple_choice' ? q.options : null,
      hints: questionType === 'fill_in_blank' ? q.hint : null,
    }));

    // Save to database
    const { error } = await supabase
      .from('exercise_questions')
      .insert(dbQuestions);

    if (error) {
      console.error('    ❌ Database error:', error.message);
      return [];
    }

    console.log(`    ✅ Saved ${dbQuestions.length} questions`);
    return dbQuestions;

  } catch (error) {
    console.error(`    ❌ Generation failed:`, error.message);
    return [];
  }
}

async function generateLanguageBank(language, priorityLevel = 2, questionsPerConcept = 5) {
  console.log(`\n🚀 Starting question bank generation for ${language}`);
  console.log(`📊 Priority level: ${priorityLevel}, Questions per concept: ${questionsPerConcept}`);
  
  const concepts = UNIVERSAL_CONCEPTS.filter(c => c.priority <= priorityLevel);
  let totalGenerated = 0;

  for (const concept of concepts) {
    console.log(`\n📖 Concept: ${concept.description} (${concept.concept})`);
    
    for (const questionType of concept.questionTypes) {
      for (const difficulty of ['beginner', 'intermediate', 'advanced']) {
        const questions = await generateQuestionBatch(
          language, concept.concept, difficulty, questionType, questionsPerConcept
        );
        totalGenerated += questions.length;
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  console.log(`\n🎉 ${language} complete! Generated ${totalGenerated} questions`);
  return totalGenerated;
}

async function analyzeCurrentCoverage() {
  console.log('\n📊 Analyzing current question coverage...\n');
  
  const { data, error } = await supabase
    .from('exercise_questions')
    .select('target_language, concept')
    .order('target_language');

  if (error) {
    console.error('❌ Failed to analyze coverage:', error);
    return;
  }

  // Group by language
  const coverage = data.reduce((acc, q) => {
    if (!acc[q.target_language]) {
      acc[q.target_language] = { total: 0, concepts: {} };
    }
    acc[q.target_language].total++;
    acc[q.target_language].concepts[q.concept] = (acc[q.target_language].concepts[q.concept] || 0) + 1;
    return acc;
  }, {});

  // Display results
  Object.entries(coverage)
    .sort(([,a], [,b]) => b.total - a.total)
    .forEach(([language, data]) => {
      console.log(`📚 ${language}: ${data.total} questions`);
      const conceptCount = Object.keys(data.concepts).length;
      console.log(`   💡 ${conceptCount} concepts covered`);
      
      // Show concept breakdown
      const topConcepts = Object.entries(data.concepts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
      
      topConcepts.forEach(([concept, count]) => {
        console.log(`      • ${concept}: ${count} questions`);
      });
      console.log('');
    });

  console.log(`\n📈 Total: ${data.length} questions across ${Object.keys(coverage).length} languages`);
}

async function main() {
  const command = process.argv[2];
  
  if (!command) {
    console.log(`
🏭 Question Bank Generator

Usage:
  node scripts/generate-questions.js <command>

Commands:
  spanish                    Generate Spanish question bank
  french                     Generate French question bank  
  german                     Generate German question bank
  all-priority              Generate all 24 priority languages (long process!)
  analyze                   Show current question coverage

Examples:
  node scripts/generate-questions.js spanish
  node scripts/generate-questions.js analyze
    `);
    return;
  }

  if (command === 'analyze') {
    await analyzeCurrentCoverage();
  } else if (command === 'all-priority') {
    console.log('\n🌍 Starting bulk generation for all priority languages');
    console.log('⚠️  This will take 2-3 hours and use significant AI credits!');
    
    let totalQuestions = 0;
    for (const language of PRIORITY_LANGUAGES) {
      try {
        const count = await generateLanguageBank(language, 1, 3); // Priority 1 only, 3 questions each
        totalQuestions += count;
        console.log(`✅ ${language} completed`);
        
        // Longer wait between languages
        await new Promise(resolve => setTimeout(resolve, 5000));
        
      } catch (error) {
        console.error(`❌ Failed ${language}:`, error.message);
      }
    }
    
    console.log(`\n🎊 Bulk generation complete! Generated ${totalQuestions} total questions`);
  } else {
    // Single language generation
    const language = command.charAt(0).toUpperCase() + command.slice(1);
    
    if (!PRIORITY_LANGUAGES.includes(language)) {
      console.log(`⚠️  ${language} is not in the priority list, but generating anyway...`);
    }
    
    await generateLanguageBank(language, 2, 5); // Priority 2, 5 questions each
  }
}

main().catch(console.error);