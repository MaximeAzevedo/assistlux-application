import Tesseract from 'tesseract.js';

export async function preprocessImage(imageData: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Set canvas dimensions
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Apply image processing
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Convert to grayscale and increase contrast
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const adjusted = avg < 128 ? avg * 0.8 : Math.min(255, avg * 1.2);
        data[i] = adjusted;     // R
        data[i + 1] = adjusted; // G
        data[i + 2] = adjusted; // B
      }

      // Put processed image back
      ctx.putImageData(imageData, 0, 0);

      // Apply sharpening
      ctx.filter = 'contrast(1.2) brightness(1.1) saturate(0)';
      ctx.drawImage(canvas, 0, 0);

      // Reset filter
      ctx.filter = 'none';

      // Convert to data URL
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageData;
  });
}

export async function extractTextFromImage(imageData: string): Promise<string> {
  try {
    // First preprocess the image to improve OCR accuracy
    const processedImage = await preprocessImage(imageData);
    
    // Create worker without passing a logger function
    const worker = await Tesseract.createWorker();

    // Load and initialize languages
    await worker.loadLanguage('eng+fra+deu');
    await worker.initialize('eng+fra+deu');

    // Set recognition parameters
    await worker.setParameters({
      tessedit_ocr_engine_mode: Tesseract.PSM.AUTO,
      preserve_interword_spaces: '1',
    });

    // Perform OCR
    const { data: { text } } = await worker.recognize(processedImage);

    // Clean up worker
    await worker.terminate();

    // Clean and return the extracted text
    return text.trim();
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw new Error('Failed to extract text from image');
  }
}