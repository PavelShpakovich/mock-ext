#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Create SVG icons with different sizes
const createIcon = (size, color = '#667eea') => {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${color}" rx="${size * 0.2}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${
    size * 0.5
  }" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">🔧</text>
</svg>`;
};

const sizes = [16, 48, 128];
const iconsDir = path.join(__dirname, 'public', 'icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

sizes.forEach((size) => {
  const svg = createIcon(size);
  const svgPath = path.join(iconsDir, `icon${size}.svg`);
  fs.writeFileSync(svgPath, svg);
  console.log(`Created ${svgPath}`);
});

console.log('\n✓ Placeholder icons created successfully!');
console.log('Note: These are SVG files. For best compatibility, convert them to PNG.');
console.log('You can use online tools like https://cloudconvert.com/svg-to-png\n');
