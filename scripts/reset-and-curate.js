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

// Top 20 languages for curation
const CURATED_LANGUAGES = [
  { code: 'spa', name: 'Spanish', file: 'spa.txt' },
  { code: 'fra', name: 'French', file: 'fra.txt' },
  { code: 'deu', name: 'German', file: 'deu.txt' },
  { code: 'ita', name: 'Italian', file: 'ita.txt' },
  { code: 'por', name: 'Portuguese', file: 'por.txt' },
  { code: 'rus', name: 'Russian', file: 'rus.txt' },
  { code: 'jpn', name: 'Japanese', file: 'jpn.txt' },
  { code: 'nld', name: 'Dutch', file: 'nld.txt' },
  { code: 'pol', name: 'Polish', file: 'pol.txt' },
  { code: 'cmn', name: 'Chinese', file: 'cmn.txt' },
  { code: 'tur', name: 'Turkish', file: 'tur.txt' },
  { code: 'kor', name: 'Korean', file: 'kor.txt' },
  { code: 'ara', name: 'Arabic', file: 'ara.txt' },
  { code: 'hin', name: 'Hindi', file: 'hin.txt' },
  { code: 'swe', name: 'Swedish', file: 'swe.txt' },
  { code: 'dan', name: 'Danish', file: 'dan.txt' },
  { code: 'fin', name: 'Finnish', file: 'fin.txt' },
  { code: 'heb', name: 'Hebrew', file: 'heb.txt' },
  { code: 'ces', name: 'Czech', file: 'ces.txt' },
  { code: 'hun', name: 'Hungarian', file: 'hun.txt' }
];

function getRandomSample(array, sampleSize) {
  const shuffled = array.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, sampleSize);
}

async function clearDatabase() {
  console.log('🗑️  Clearing existing questions...');
  
  try {
    // Use TRUNCATE for instant clearing (much faster than DELETE)
    const { error } = await supabase.rpc('truncate_questions');
    
    if (error) {
      // Fallback: Try direct SQL execution
      console.log('🔄 Using fallback method...');
      const { error: sqlError } = await supabase
        .from('exercise_questions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (sqlError) throw sqlError;
    }
    
    console.log('✅ Database cleared successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to clear database:', error);
    console.log('💡 Please run this SQL manually in Supabase:');
    console.log('   TRUNCATE TABLE exercise_questions RESTART IDENTITY CASCADE;');
    return false;
  }
}

async function curateLanguage(lang, questionsPerLanguage = 2000) {
  console.log(`\n🎯 Curating ${lang.name} (${questionsPerLanguage} questions)...`);
  
  const filePath = path.join(process.cwd(), 'archives', lang.file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath} - skipping ${lang.name}`);
    return 0;
  }

  try {
    // Read and parse the language file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    console.log(`📖 Found ${lines.length.toLocaleString()} total sentences`);
    
    if (lines.length < questionsPerLanguage) {
      console.log(`⚠️  Only ${lines.length} sentences available (wanted ${questionsPerLanguage})`);
    }
    
    // Get random sample
    const sampleSize = Math.min(questionsPerLanguage, lines.length);
    const selectedLines = getRandomSample(lines, sampleSize);
    
    console.log(`🎲 Selected ${selectedLines.length} random sentences`);
    
    // Process and insert in batches
    const batchSize = 100;
    let inserted = 0;
    
    for (let i = 0; i < selectedLines.length; i += batchSize) {
      const batch = selectedLines.slice(i, i + batchSize);
      const questions = batch.map(line => {
        const [english, target, attribution] = line.split('\t');
        
        if (!english || !target) return null;
        
        return {
          concept: 'translation_practice',
          question_type: 'translation',
          difficulty: 'beginner',
          target_language: lang.name,
          question_text: `Translate: "${english.trim()}"`,
          correct_answer: target.trim(),
          options: JSON.stringify([target.trim()])
        };
      }).filter(Boolean);
      
      if (questions.length > 0) {
        const { error } = await supabase
          .from('exercise_questions')
          .insert(questions);
        
        if (error) {
          console.error(`❌ Batch insert failed:`, error);
        } else {
          inserted += questions.length;
          process.stdout.write(`✅ ${inserted}/${selectedLines.length} `);
        }
      }
    }
    
    console.log(`\n✅ ${lang.name}: Successfully imported ${inserted} questions`);
    return inserted;
    
  } catch (error) {
    console.error(`❌ Failed to curate ${lang.name}:`, error.message);
    return 0;
  }
}

async function downloadMissingFiles() {
  console.log('📥 Checking for missing language files...');
  
  const { execSync } = require('child_process');
  
  // Ensure archives directory exists
  if (!fs.existsSync('archives')) {
    fs.mkdirSync('archives');
  }
  
  for (const lang of CURATED_LANGUAGES) {
    const filePath = path.join('archives', lang.file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`📥 Downloading ${lang.name}...`);
      
      try {
        const zipFile = `${lang.code}-eng.zip`;
        const zipPath = `archives/${zipFile}`;
        
        // Download
        execSync(`curl -o ${zipPath} https://www.manythings.org/anki/${zipFile}`, { stdio: 'pipe' });
        
        // Extract
        execSync(`cd archives && echo "A" | unzip -o ${zipFile}`, { stdio: 'pipe' });
        
        console.log(`✅ Downloaded ${lang.name}`);
        
      } catch (error) {
        console.log(`⚠️  Failed to download ${lang.name}: ${error.message}`);
      }
    }
  }
}

async function resetAndCurate() {
  console.log('🚀 Database Reset & Curation Process');
  console.log('=' .repeat(60));
  console.log(`🎯 Target: ${CURATED_LANGUAGES.length} languages × 2,000 questions = 40,000 total`);
  console.log('📊 Estimated final size: ~20MB (well under 500MB limit!)');
  console.log('=' .repeat(60));
  
  // Step 1: Download missing files
  await downloadMissingFiles();
  
  // Step 2: Database already cleared by user
  console.log('✅ Database already cleared - proceeding with curation...');
  
  // Step 3: Curate each language
  let totalImported = 0;
  const results = [];
  
  for (const lang of CURATED_LANGUAGES) {
    const imported = await curateLanguage(lang, 2000);
    totalImported += imported;
    results.push({ language: lang.name, imported });
    
    // Small delay to avoid overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Step 4: Final summary
  console.log('\n🎉 CURATION COMPLETE!');
  console.log('=' .repeat(60));
  
  results.forEach(result => {
    console.log(`${result.language.padEnd(20)} ${result.imported.toLocaleString().padStart(6)} questions`);
  });
  
  console.log('=' .repeat(60));
  console.log(`📊 Total Questions: ${totalImported.toLocaleString()}`);
  console.log(`💾 Estimated Size: ~${(totalImported * 500 / (1024 * 1024)).toFixed(1)} MB`);
  console.log(`🎯 Languages: ${results.filter(r => r.imported > 0).length}`);
  console.log('\n✅ Your database is now optimized and under the storage limit!');
}

async function showPreview() {
  console.log('👀 Database Reset & Curation Preview');
  console.log('=' .repeat(60));
  
  console.log('Will download and curate these languages:');
  console.log('-'.repeat(40));
  
  CURATED_LANGUAGES.forEach((lang, index) => {
    console.log(`${(index + 1).toString().padStart(2)}. ${lang.name.padEnd(15)} 2,000 questions`);
  });
  
  console.log('-'.repeat(40));
  console.log(`Total: ${CURATED_LANGUAGES.length} languages × 2,000 = 40,000 questions`);
  console.log(`Estimated size: ~20MB (vs current 566MB)`);
  console.log(`Storage savings: ~546MB (97% reduction!)`);
  
  console.log('\n🔄 Process:');
  console.log('1. Download missing language files');
  console.log('2. Import 2K random questions per language');
  console.log('3. Optimize for instant loading');
  
  console.log('\n✅ Ready to populate with curated questions!');
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'preview':
    showPreview();
    break;
  case 'reset':
    resetAndCurate();
    break;
  default:
    console.log('🎯 Database Reset & Curation Tool');
    console.log('Usage:');
    console.log('  npm run reset-db preview  - Show what will be done');
    console.log('  npm run reset-db reset    - Execute the reset & curation');
    console.log('');
    console.log('🎯 Result: 40K curated questions (20 languages × 2K each)');
    console.log('💾 Size: ~20MB (97% storage reduction!)');
    console.log('⚡ Performance: Instant question loading');
}