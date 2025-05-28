import { copyFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Create public directory if it doesn't exist
mkdirSync(join(__dirname, '../public'), { recursive: true });

// Copy PDF.js worker from node_modules to public directory
copyFileSync(
  join(__dirname, '../node_modules/pdfjs-dist/build/pdf.worker.min.js'),
  join(__dirname, '../public/pdf.worker.min.js')
);

console.log('PDF.js worker copied successfully');