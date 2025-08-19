#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load environment variables
function loadEnv() {
  try {
    const envPath = path.join(process.cwd(), '.env');
    const envFile = fs.readFileSync(envPath, 'utf8');
    
    envFile.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
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

// Top 20 languages with their codes and question counts
const TOP_20_LANGUAGES = [
  { code: 'tur', name: 'Turkish', questions: 522279 },
  { code: 'rus', name: 'Russian', questions: 519900 },
  { code: 'ita', name: 'Italian', questions: 390190 },
  { code: 'deu', name: 'German', questions: 320340, imported: true },
  { code: 'fra', name: 'French', questions: 237838, imported: true },
  { code: 'por', name: 'Portuguese', questions: 196350 },
  { code: 'ukr', name: 'Ukrainian', questions: 159916 },
  { code: 'spa', name: 'Spanish', questions: 142511, imported: true },
  { code: 'heb', name: 'Hebrew', questions: 136073 },
  { code: 'hun', name: 'Hungarian', questions: 121440 },
  { code: 'jpn', name: 'Japanese', questions: 115492 },
  { code: 'nld', name: 'Dutch', questions: 83377 },
  { code: 'fin', name: 'Finnish', questions: 72962 },
  { code: 'pol', name: 'Polish', questions: 51799 },
  { code: 'ces', name: 'Czech', questions: 41375 },
  { code: 'cmn', name: 'Mandarin Chinese', questions: 30919 },
  { code: 'dan', name: 'Danish', questions: 30272 },
  { code: 'srp', name: 'Serbian', questions: 28242 },
  { code: 'swe', name: 'Swedish', questions: 25648 },
  { code: 'ell', name: 'Greek', questions: 17589 }
];

async function downloadLanguage(lang) {
  const { code, name, questions, imported } = lang;
  
  if (imported) {
    console.log(`✅ ${name} already imported (${questions.toLocaleString()} questions)`);
    return;
  }

  console.log(`\n🌍 Downloading ${name} (${questions.toLocaleString()} questions)...`);
  
  try {
    // Create archives directory if it doesn't exist
    if (!fs.existsSync('archives')) {
      fs.mkdirSync('archives');
    }

    // Download the zip file
    const zipFile = `${code}-eng.zip`;
    const zipPath = `archives/${zipFile}`;
    
    console.log(`📥 Downloading ${zipFile}...`);
    execSync(`curl -o ${zipPath} https://www.manythings.org/anki/${zipFile}`, { stdio: 'inherit' });
    
    // Extract the zip file
    console.log(`📦 Extracting ${zipFile}...`);
    execSync(`cd archives && echo "A" | unzip -o ${zipFile}`, { stdio: 'inherit' });
    
    // Find the extracted .txt file
    const txtFile = `archives/${code}.txt`;
    if (!fs.existsSync(txtFile)) {
      throw new Error(`Could not find extracted file ${txtFile}`);
    }

    // Import the questions
    console.log(`📝 Importing ${name} questions...`);
    execSync(`npm run import-archives tatoeba ${txtFile} English "${name}"`, { stdio: 'inherit' });
    
    console.log(`✅ Successfully imported ${name}!`);
    
  } catch (error) {
    console.error(`❌ Failed to import ${name}:`, error.message);
  }
}

async function importAll() {
  console.log('🚀 Starting Top 20 Languages Mass Import');
  console.log('=' .repeat(50));
  
  const unimported = TOP_20_LANGUAGES.filter(lang => !lang.imported);
  console.log(`📊 Found ${unimported.length} languages to import`);
  console.log(`🎯 Total questions: ${unimported.reduce((sum, lang) => sum + lang.questions, 0).toLocaleString()}`);
  
  for (const lang of unimported) {
    await downloadLanguage(lang);
    
    // Small delay between imports to avoid overwhelming the server
    console.log('⏱️  Waiting 3 seconds before next import...');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  console.log('\n🎉 MASS IMPORT COMPLETE!');
  console.log('=' .repeat(50));
  
  const totalQuestions = TOP_20_LANGUAGES.reduce((sum, lang) => sum + lang.questions, 0);
  console.log(`📊 Total question bank: ${totalQuestions.toLocaleString()} questions`);
  console.log(`🌍 Languages covered: ${TOP_20_LANGUAGES.length}`);
}

async function showStats() {
  console.log('📊 Top 20 Languages Status:');
  console.log('=' .repeat(60));
  
  TOP_20_LANGUAGES.forEach((lang, index) => {
    const status = lang.imported ? '✅' : '⏳';
    const questions = lang.questions.toLocaleString().padStart(8);
    const rank = (index + 1).toString().padStart(2);
    console.log(`${rank}. ${status} ${lang.name.padEnd(18)} ${questions} questions`);
  });
  
  const imported = TOP_20_LANGUAGES.filter(lang => lang.imported);
  const remaining = TOP_20_LANGUAGES.filter(lang => !lang.imported);
  
  console.log('=' .repeat(60));
  console.log(`✅ Imported: ${imported.length} languages`);
  console.log(`⏳ Remaining: ${remaining.length} languages`);
  console.log(`📊 Total potential: ${TOP_20_LANGUAGES.reduce((sum, lang) => sum + lang.questions, 0).toLocaleString()} questions`);
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'stats':
    showStats();
    break;
  case 'import':
    importAll();
    break;
  case 'single':
    const langCode = process.argv[3];
    const lang = TOP_20_LANGUAGES.find(l => l.code === langCode);
    if (lang) {
      downloadLanguage(lang);
    } else {
      console.error(`Language code '${langCode}' not found in top 20 list`);
    }
    break;
  default:
    console.log('🌍 Top 20 Languages Mass Importer');
    console.log('Usage:');
    console.log('  npm run import-top20 stats    - Show import status');
    console.log('  npm run import-top20 import   - Import all remaining languages');
    console.log('  npm run import-top20 single <code> - Import single language (e.g., tur for Turkish)');
    console.log('');
    console.log('Available language codes:');
    TOP_20_LANGUAGES.forEach(lang => {
      const status = lang.imported ? '✅' : '⏳';
      console.log(`  ${lang.code} - ${lang.name} ${status}`);
    });
}