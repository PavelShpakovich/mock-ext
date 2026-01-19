#!/usr/bin/env node

const { execSync } = require('child_process');
const { readFileSync, mkdirSync, existsSync } = require('fs');
const { join } = require('path');

// Read version from package.json
const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));
const version = packageJson.version;

console.log(`📦 Packaging Moq Extension v${version}...`);

// Build the extension
console.log('🔨 Building...');
execSync('npm run build', { stdio: 'inherit' });

// Create releases folder if it doesn't exist
const releasesDir = 'releases';
if (!existsSync(releasesDir)) {
  mkdirSync(releasesDir);
}

// Create zip file with version number
const zipName = `moq-extension-v${version}.zip`;
console.log(`🗜️  Creating ${zipName}...`);
execSync(`cd dist && zip -r ../releases/${zipName} . && cd ..`, { stdio: 'inherit' });

// Show file size
const fileSize = execSync(`ls -lh releases/${zipName}`).toString().trim();
console.log(`✅ Package created: ${fileSize}`);
