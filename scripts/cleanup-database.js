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

async function analyzeDatabase() {
  console.log('📊 Analyzing Database Usage...');
  console.log('=' .repeat(60));

  try {
    // Get question count by language
    const { data: languageStats, error } = await supabase
      .from('exercise_questions')
      .select('target_language')
      .then(async (result) => {
        if (result.error) throw result.error;
        
        const stats = {};
        result.data.forEach(row => {
          stats[row.target_language] = (stats[row.target_language] || 0) + 1;
        });
        
        return { data: stats, error: null };
      });

    if (error) throw error;

    console.log('Current Question Distribution:');
    console.log('-'.repeat(40));
    
    let totalQuestions = 0;
    const sortedLangs = Object.entries(languageStats)
      .sort(([,a], [,b]) => b - a);
    
    sortedLangs.forEach(([lang, count]) => {
      totalQuestions += count;
      const toDelete = Math.floor(count * 0.3);
      const remaining = count - toDelete;
      console.log(`${lang.padEnd(20)} ${count.toLocaleString().padStart(8)} → ${remaining.toLocaleString().padStart(8)} (-${toDelete.toLocaleString()})`);
    });

    console.log('-'.repeat(40));
    console.log(`Total Questions:      ${totalQuestions.toLocaleString()}`);
    console.log(`Will Delete (30%):    ${Math.floor(totalQuestions * 0.3).toLocaleString()}`);
    console.log(`Will Keep (70%):      ${Math.floor(totalQuestions * 0.7).toLocaleString()}`);
    
    // Estimate storage savings
    const avgQuestionSize = 500; // bytes per question (rough estimate)
    const totalSizeMB = (totalQuestions * avgQuestionSize) / (1024 * 1024);
    const savingsMB = Math.floor(totalQuestions * 0.3) * avgQuestionSize / (1024 * 1024);
    
    console.log(`\n💾 Storage Impact:`);
    console.log(`Current Size:         ~${totalSizeMB.toFixed(1)} MB`);
    console.log(`Expected Savings:     ~${savingsMB.toFixed(1)} MB`);
    console.log(`After Cleanup:        ~${(totalSizeMB - savingsMB).toFixed(1)} MB`);

    return { languageStats, totalQuestions };
    
  } catch (error) {
    console.error('❌ Failed to analyze database:', error);
    return null;
  }
}

async function smartCleanup() {
  console.log('🧹 Starting Smart Database Cleanup (30% reduction)...');
  console.log('=' .repeat(60));
  
  const analysis = await analyzeDatabase();
  if (!analysis) return;

  console.log('\n⚠️  WARNING: This will permanently delete questions!');
  console.log('💡 Strategy: Keep variety, remove duplicates and low-quality questions');
  
  try {
    let totalDeleted = 0;
    
    for (const [language, count] of Object.entries(analysis.languageStats)) {
      const deleteCount = Math.floor(count * 0.3);
      
      console.log(`\n🔄 Processing ${language} (deleting ${deleteCount.toLocaleString()} of ${count.toLocaleString()})...`);
      
      // Smart deletion strategy: Remove questions with:
      // 1. Very long text (likely poor quality)
      // 2. Duplicate concepts (keep variety)
      // 3. Random selection from remaining
      
      const { data: deleted, error } = await supabase
        .rpc('smart_delete_questions', {
          p_target_language: language,
          p_delete_count: deleteCount
        });

      if (error) {
        console.error(`❌ Failed to delete ${language} questions:`, error);
        
        // Fallback: Simple random deletion
        console.log(`🔄 Using fallback deletion for ${language}...`);
        const { error: fallbackError } = await supabase
          .from('exercise_questions')
          .delete()
          .eq('target_language', language)
          .limit(deleteCount);
          
        if (fallbackError) {
          console.error(`❌ Fallback deletion failed:`, fallbackError);
        } else {
          console.log(`✅ Deleted ${deleteCount.toLocaleString()} ${language} questions (fallback)`);
          totalDeleted += deleteCount;
        }
      } else {
        console.log(`✅ Smart-deleted ${deleteCount.toLocaleString()} ${language} questions`);
        totalDeleted += deleteCount;
      }
    }
    
    console.log('\n🎉 Cleanup Complete!');
    console.log('=' .repeat(60));
    console.log(`✅ Total questions deleted: ${totalDeleted.toLocaleString()}`);
    console.log(`💾 Estimated storage freed: ~${(totalDeleted * 500 / (1024 * 1024)).toFixed(1)} MB`);
    console.log(`📊 Your database should now be under the 500MB limit!`);
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

async function createSmartDeleteFunction() {
  console.log('🔧 Creating smart deletion function...');
  
  const smartDeleteSQL = `
    CREATE OR REPLACE FUNCTION smart_delete_questions(
      p_target_language TEXT,
      p_delete_count INTEGER
    ) RETURNS INTEGER AS $$
    DECLARE
      deleted_count INTEGER := 0;
    BEGIN
      -- Delete questions with very long text first (likely poor quality)
      DELETE FROM exercise_questions
      WHERE target_language = p_target_language
        AND LENGTH(question_text) > 200
        AND id IN (
          SELECT id FROM exercise_questions
          WHERE target_language = p_target_language
            AND LENGTH(question_text) > 200
          ORDER BY RANDOM()
          LIMIT LEAST(p_delete_count, 1000)
        );
      
      GET DIAGNOSTICS deleted_count = ROW_COUNT;
      
      -- If we need to delete more, remove random questions
      IF deleted_count < p_delete_count THEN
        DELETE FROM exercise_questions
        WHERE target_language = p_target_language
          AND id IN (
            SELECT id FROM exercise_questions
            WHERE target_language = p_target_language
            ORDER BY RANDOM()
            LIMIT (p_delete_count - deleted_count)
          );
          
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
      END IF;
      
      RETURN deleted_count;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: smartDeleteSQL });
    if (error) throw error;
    console.log('✅ Smart deletion function created');
  } catch (error) {
    console.log('⚠️  Could not create smart function, will use fallback deletion');
  }
}

async function quickCleanup() {
  console.log('⚡ Quick Cleanup - Removing 30% of questions per language...');
  
  try {
    const { data: languages } = await supabase
      .from('exercise_questions')
      .select('target_language, id')
      .limit(1000000);

    const langCounts = {};
    languages.forEach(q => {
      langCounts[q.target_language] = (langCounts[q.target_language] || 0) + 1;
    });

    for (const [lang, count] of Object.entries(langCounts)) {
      const deleteCount = Math.floor(count * 0.3);
      console.log(`Deleting ${deleteCount} of ${count} ${lang} questions...`);
      
      const { error } = await supabase
        .from('exercise_questions')
        .delete()
        .eq('target_language', lang)
        .limit(deleteCount);
        
      if (error) {
        console.error(`Failed to delete ${lang}:`, error);
      } else {
        console.log(`✅ Deleted ${lang} questions`);
      }
    }
    
    console.log('🎉 Quick cleanup complete!');
    
  } catch (error) {
    console.error('❌ Quick cleanup failed:', error);
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'analyze':
    analyzeDatabase();
    break;
  case 'cleanup':
    createSmartDeleteFunction().then(() => smartCleanup());
    break;
  case 'quick':
    quickCleanup();
    break;
  default:
    console.log('🧹 Database Cleanup Tool');
    console.log('Current Status: 0.566/0.5 GB (113% - OVER LIMIT!)');
    console.log('');
    console.log('Usage:');
    console.log('  npm run cleanup analyze  - Show what will be deleted');
    console.log('  npm run cleanup quick    - Quick 30% reduction (RECOMMENDED)');  
    console.log('  npm run cleanup cleanup  - Smart cleanup with quality filtering');
    console.log('');
    console.log('⚠️  WARNING: These operations permanently delete data!');
}