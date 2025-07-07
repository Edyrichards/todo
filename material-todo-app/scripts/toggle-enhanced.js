#!/usr/bin/env node

/**
 * Toggle Enhanced App Features
 * 
 * This script helps switch between the standard and enhanced app versions
 * for development and testing purposes.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '..', '.env.local');

function readEnvFile() {
  if (!fs.existsSync(envPath)) {
    return {};
  }
  
  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...values] = trimmed.split('=');
      env[key] = values.join('=');
    }
  });
  
  return env;
}

function writeEnvFile(env) {
  const content = Object.entries(env)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  fs.writeFileSync(envPath, content);
}

function getCurrentStatus() {
  const env = readEnvFile();
  return env.VITE_USE_ENHANCED_APP === 'true';
}

function toggle() {
  const env = readEnvFile();
  const currentlyEnhanced = env.VITE_USE_ENHANCED_APP === 'true';
  
  env.VITE_USE_ENHANCED_APP = currentlyEnhanced ? 'false' : 'true';
  writeEnvFile(env);
  
  const newStatus = !currentlyEnhanced;
  
  console.log('\n🔄 Todo App Version Switched!');
  console.log(`📦 Current version: ${newStatus ? 'Enhanced' : 'Standard'}`);
  
  if (newStatus) {
    console.log('\n✨ Enhanced features enabled:');
    console.log('  • Virtual scrolling for large task lists');
    console.log('  • Comprehensive error boundaries');
    console.log('  • Real-time performance monitoring');
    console.log('  • Lazy loading of heavy components');
    console.log('  • Advanced error recovery');
  } else {
    console.log('\n📝 Standard features:');
    console.log('  • Lightweight implementation');
    console.log('  • Basic error handling');
    console.log('  • Faster initial load');
  }
  
  console.log('\n🚀 Restart the dev server to see changes:');
  console.log('  bun run dev');
  console.log('\n💡 Or visit: http://localhost:5173?enhanced=' + newStatus);
}

function status() {
  const isEnhanced = getCurrentStatus();
  
  console.log('\n📊 Current Todo App Configuration:');
  console.log(`📦 Version: ${isEnhanced ? 'Enhanced' : 'Standard'}`);
  console.log(`🔧 VITE_USE_ENHANCED_APP: ${isEnhanced}`);
  
  console.log('\n🎛️  Control options:');
  console.log('  • Environment: Set VITE_USE_ENHANCED_APP=true/false in .env.local');
  console.log('  • URL parameter: ?enhanced=true/false');
  console.log('  • localStorage: localStorage.setItem("use-enhanced-app", "true/false")');
  console.log('  • This script: node scripts/toggle-enhanced.js');
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'toggle':
    toggle();
    break;
  case 'status':
    status();
    break;
  case 'enable':
    const env1 = readEnvFile();
    env1.VITE_USE_ENHANCED_APP = 'true';
    writeEnvFile(env1);
    console.log('✅ Enhanced app enabled');
    break;
  case 'disable':
    const env2 = readEnvFile();
    env2.VITE_USE_ENHANCED_APP = 'false';
    writeEnvFile(env2);
    console.log('✅ Standard app enabled');
    break;
  default:
    console.log('\n🎛️  Todo App Version Control\n');
    console.log('Usage:');
    console.log('  node scripts/toggle-enhanced.js toggle  # Switch versions');
    console.log('  node scripts/toggle-enhanced.js status  # Show current version');
    console.log('  node scripts/toggle-enhanced.js enable  # Enable enhanced version');
    console.log('  node scripts/toggle-enhanced.js disable # Enable standard version');
    console.log('\nFeature comparison:');
    console.log('📦 Standard: Lightweight, fast startup, basic features');
    console.log('⚡ Enhanced: Virtual scrolling, error boundaries, performance monitoring');
    break;
}