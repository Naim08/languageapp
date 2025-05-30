#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Path to the problematic file
const filePath = path.join(__dirname, '..', 'node_modules', 'whisper.rn', 'cpp', 'ggml-cpu.cpp');

// Check if file exists
if (!fs.existsSync(filePath)) {
  console.log('whisper.rn not found, skipping AMX fix');
  process.exit(0);
}

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Check if already fixed
if (content.includes('#if defined(__AMX_INT8__) && defined(__AVX512VNNI__)')) {
  console.log('AMX fix already applied');
  process.exit(0);
}

// Apply the fix - wrap the AMX include with conditional compilation
content = content.replace(
  '#include "amx/amx.h"',
  '#if defined(__AMX_INT8__) && defined(__AVX512VNNI__)\n#include "amx/amx.h"\n#endif'
);

// Write the fixed content back
fs.writeFileSync(filePath, content);

console.log('Applied AMX fix to whisper.rn');