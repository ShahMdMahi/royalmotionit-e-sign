// Script to copy PDF.js worker to public directory
const fs = require('fs');
const path = require('path');

// Define paths
const sourcePaths = [
  // Try both JS and MJS versions
  path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.js'),
  path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs')
];

const publicDir = path.join(process.cwd(), 'public');

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  console.log('Created public directory');
}

// Try to copy the worker files
let copied = false;
for (const sourcePath of sourcePaths) {
  if (fs.existsSync(sourcePath)) {
    const filename = path.basename(sourcePath);
    const destPath = path.join(publicDir, filename);
    
    try {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`Successfully copied ${filename} to public directory`);
      copied = true;
    } catch (error) {
      console.error(`Error copying ${filename}:`, error);
    }
  }
}

if (!copied) {
  console.error('Could not find PDF.js worker file in node_modules. Make sure pdfjs-dist is installed.');
  process.exit(1);
}