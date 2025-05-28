import { copyFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

const workerPath = require.resolve('pdfjs-dist/build/pdf.worker.min.js');
const destPath = join(__dirname, '../public/pdf.worker.js');

try {
  await copyFile(workerPath, destPath);
  console.log('PDF.js worker file copied successfully');
} catch (error) {
  console.error('Error copying PDF.js worker file:', error);
  process.exit(1);
}