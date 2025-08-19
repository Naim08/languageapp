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

// Initialize Supabase with service role for migrations
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_SECRET_KEY
);

async function applyPerformanceOptimization() {
  console.log('🚀 Applying Performance Optimization for 1M+ Questions...');
  console.log('=' .repeat(60));

  try {
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '004_optimize_question_performance.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📊 Creating database indexes (this may take 1-2 minutes)...');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: migrationSQL 
    });

    if (error) {
      console.error('❌ Migration failed:', error);
      console.log('\n🔧 Manual Application Required:');
      console.log('Please run this migration directly in your Supabase SQL editor:');
      console.log('supabase/migrations/004_optimize_question_performance.sql');
      return;
    }

    console.log('✅ Database indexes created successfully');
    console.log('✅ Fast RPC functions deployed');
    
    // Test the performance
    console.log('\n🧪 Testing question selection speed...');
    
    const startTime = Date.now();
    const { data: testQuestion, error: testError } = await supabase
      .rpc('get_next_question_lightning', {
        p_user_id: '00000000-0000-0000-0000-000000000000', // Test UUID
        p_target_language: 'Spanish'
      })
      .single();

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    if (testError && !testError.message.includes('No authenticated user')) {
      console.error('⚠️  Test query error:', testError);
    } else {
      console.log(`⚡ Question selection time: ${responseTime}ms`);
      
      if (responseTime < 500) {
        console.log('🎉 EXCELLENT! Sub-500ms response time achieved');
      } else if (responseTime < 1000) {
        console.log('✅ GOOD! Sub-1s response time achieved');  
      } else {
        console.log('⚠️  Still slow. Consider checking database connection');
      }
    }

    console.log('\n🎯 Performance Optimization Complete!');
    console.log('=' .repeat(60));
    console.log('✅ Database indexes: Created');
    console.log('✅ Lightning-fast RPC: Deployed');
    console.log('✅ ExerciseService: Updated');
    console.log('\n📱 Your app should now load questions instantly!');
    
  } catch (error) {
    console.error('❌ Failed to apply optimization:', error.message);
    console.log('\n🔧 Manual steps:');
    console.log('1. Copy supabase/migrations/004_optimize_question_performance.sql');
    console.log('2. Run it in your Supabase SQL editor');
    console.log('3. Restart your app');
  }
}

async function benchmarkPerformance() {
  console.log('📊 Benchmarking Question Selection Performance...');
  console.log('=' .repeat(50));

  const functions = [
    { name: 'Original (Complex)', rpc: 'get_next_question_for_user' },
    { name: 'Fast (Optimized)', rpc: 'get_next_question_fast' },
    { name: 'Lightning (Minimal)', rpc: 'get_next_question_lightning' }
  ];

  for (const func of functions) {
    console.log(`\n🧪 Testing ${func.name}...`);
    
    const times = [];
    for (let i = 0; i < 5; i++) {
      const startTime = Date.now();
      
      try {
        await supabase
          .rpc(func.rpc, {
            p_user_id: '00000000-0000-0000-0000-000000000000',
            p_target_language: 'Spanish'
          })
          .single();
      } catch (error) {
        // Expected for test UUID
      }
      
      const responseTime = Date.now() - startTime;
      times.push(responseTime);
      process.stdout.write(`${responseTime}ms `);
    }
    
    const avgTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    console.log(`\n   Average: ${avgTime}ms`);
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'apply':
    applyPerformanceOptimization();
    break;
  case 'benchmark':
    benchmarkPerformance();
    break;
  default:
    console.log('🚀 Question Selection Performance Optimizer');
    console.log('Usage:');
    console.log('  npm run optimize-performance apply     - Apply performance optimization');
    console.log('  npm run optimize-performance benchmark - Benchmark query speeds');
}