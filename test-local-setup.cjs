#!/usr/bin/env node

/**
 * Test script to verify local development setup
 * Run with: node test-local-setup.js
 */

console.log('🧪 Testing FLOCORE Local Development Setup...\n');

// Test 1: Environment Variables
console.log('1️⃣ Testing Environment Variables:');
const hasApiKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'PLACEHOLDER_API_KEY';
console.log(`   GEMINI_API_KEY: ${hasApiKey ? '✅ Set' : '❌ Not set or placeholder'}`);

// Test 2: Required Dependencies
console.log('\n2️⃣ Testing Required Dependencies:');
const requiredDeps = [
    '@google/genai',
    'react',
    'react-dom',
    'pdf-lib',
    'marked',
    '@mlc-ai/web-llm',
    'html2canvas',
    'immer',
    'lucide-react',
    'tailwindcss',
    'autoprefixer',
    'postcss'
];

let allDepsAvailable = true;
requiredDeps.forEach(dep => {
    try {
        require(dep);
        console.log(`   ${dep}: ✅ Available`);
    } catch (error) {
        console.log(`   ${dep}: ❌ Missing`);
        allDepsAvailable = false;
    }
});

// Test 3: File Structure
console.log('\n3️⃣ Testing File Structure:');
const fs = require('fs');
const path = require('path');

const requiredFiles = [
    'package.json',
    'vite.config.ts',
    'index.html',
    'services/geminiService.ts',
    'services/agents/index.ts',
    'components/LatexRenderer.tsx',
    '.env.local'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, file));
    console.log(`   ${file}: ${exists ? '✅ Exists' : '❌ Missing'}`);
    if (!exists) allFilesExist = false;
});

// Test 4: Gemini Service File
console.log('\n4️⃣ Testing Gemini Service File:');
const geminiServicePath = path.join(__dirname, 'services/geminiService.ts');
const geminiServiceExists = fs.existsSync(geminiServicePath);
console.log(`   services/geminiService.ts: ${geminiServiceExists ? '✅ Exists' : '❌ Missing'}`);

// Final Summary
console.log('\n📋 Summary:');
console.log(`   Environment: ${hasApiKey ? '✅' : '❌'}`);
console.log(`   Dependencies: ${allDepsAvailable ? '✅' : '❌'}`);
console.log(`   File Structure: ${allFilesExist && geminiServiceExists ? '✅' : '❌'}`);

const allReady = hasApiKey && allDepsAvailable && allFilesExist && geminiServiceExists;
console.log(`\n🎯 Overall Status: ${allReady ? '✅ Ready for Development!' : '❌ Issues Found'}`);
console.log('\n📝 Notes:');
console.log('   - This script checks for file existence, not service functionality.');
console.log('   - MathJax loads dynamically from CDN for browser compatibility');
console.log('   - TailwindCSS is configured as PostCSS plugin (no more CDN warnings)');

if (!allReady) {
    console.log('\n🔧 Next Steps:');
    if (!hasApiKey) console.log('   - Set your Gemini API key in .env.local');
    if (!allDepsAvailable) console.log('   - Run: npm install');
    if (!allFilesExist || !geminiServiceExists) console.log('   - Check missing files');
}