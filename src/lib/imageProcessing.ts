import Tesseract from 'tesseract.js';

// Configuration des formats supportés
export const IMAGE_FORMATS = {
  SUPPORTED_DIRECT: [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
    'image/bmp', 'image/webp', 'image/svg+xml'
  ],
  MODERN_FORMATS: [
    'image/heic', 'image/heif', 'image/avif', 'image/tiff'
  ],
  EXTENSIONS: {
    direct: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'],
    modern: ['heic', 'heif', 'avif', 'tiff', 'tif']
  }
};

/**
 * Valide un fichier image et détermine s'il nécessite une conversion
 */
export function validateImageFile(file: File): {
  isValid: boolean;
  error?: string;
  needsConversion?: boolean;
  detectedFormat?: string;
} {
  // Vérifier la taille (max 50MB pour photos haute résolution)
  if (file.size > 50 * 1024 * 1024) {
    return { 
      isValid: false, 
      error: `Fichier trop volumineux (${Math.round(file.size / 1024 / 1024)}MB). Maximum autorisé: 50MB` 
    };
  }

  // Détection du format par type MIME
  if (IMAGE_FORMATS.SUPPORTED_DIRECT.includes(file.type)) {
    return { 
      isValid: true, 
      detectedFormat: file.type 
    };
  }

  if (IMAGE_FORMATS.MODERN_FORMATS.includes(file.type)) {
    return { 
      isValid: true, 
      needsConversion: true, 
      detectedFormat: file.type 
    };
  }

  // Détection par extension si type MIME non détecté
  const extension = file.name.toLowerCase().split('.').pop();
  
  if (IMAGE_FORMATS.EXTENSIONS.direct.includes(extension || '')) {
    return { 
      isValid: true, 
      detectedFormat: `image/${extension}` 
    };
  }

  if (IMAGE_FORMATS.EXTENSIONS.modern.includes(extension || '')) {
    return { 
      isValid: true, 
      needsConversion: true, 
      detectedFormat: `image/${extension}` 
    };
  }

  // Format non supporté
  const supportedFormats = [
    ...IMAGE_FORMATS.EXTENSIONS.direct,
    ...IMAGE_FORMATS.EXTENSIONS.modern
  ].join(', ').toUpperCase();

  return {
    isValid: false,
    error: `Format "${extension?.toUpperCase() || file.type}" non supporté. Formats acceptés: ${supportedFormats}`
  };
}

/**
 * Convertit un fichier image moderne en JPEG
 */
export async function convertImageToJpeg(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // Optimisation des dimensions pour maintenir la qualité
        const maxDimension = 2048;
        let { width, height } = img;
        
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;
        
        if (!ctx) {
          reject(new Error('Canvas context non disponible'));
          return;
        }

        // Arrière-plan blanc pour transparence
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        
        // Dessiner l'image
        ctx.drawImage(img, 0, 0, width, height);

        // Conversion en blob JPEG haute qualité
        canvas.toBlob((blob) => {
          if (blob) {
            const convertedFile = new File(
              [blob], 
              file.name.replace(/\.[^/.]+$/, '_converti.jpg'), 
              { 
                type: 'image/jpeg',
                lastModified: Date.now() 
              }
            );
            resolve(convertedFile);
          } else {
            reject(new Error('Échec de la conversion en JPEG'));
          }
        }, 'image/jpeg', 0.92); // Qualité élevée

      } catch (error) {
        reject(new Error(`Erreur lors de la conversion: ${error}`));
      }
    };

    img.onerror = () => {
      reject(new Error('Impossible de charger l\'image pour conversion'));
    };

    // Support des différents formats
    try {
      img.src = URL.createObjectURL(file);
    } catch (error) {
      reject(new Error('Format d\'image non supporté pour la conversion'));
    }
  });
}

/**
 * Préprocessing avancé pour améliorer l'OCR
 */
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

      // Optimisation des dimensions pour OCR
      const maxWidth = 1920;
      const maxHeight = 1920;
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      // Dessiner l'image originale
      ctx.drawImage(img, 0, 0, width, height);

      // Amélioration pour OCR
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      // Conversion en niveaux de gris avec contraste amélioré
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        
        // Amélioration du contraste adaptatif
        let adjusted;
        if (avg < 128) {
          adjusted = Math.max(0, avg * 0.7); // Assombrir les zones sombres
        } else {
          adjusted = Math.min(255, avg * 1.3); // Éclaircir les zones claires
        }
        
        data[i] = adjusted;     // R
        data[i + 1] = adjusted; // G
        data[i + 2] = adjusted; // B
        // Alpha reste inchangé
      }

      // Appliquer les améliorations
      ctx.putImageData(imageData, 0, 0);

      // Filtres supplémentaires pour améliorer la lisibilité
      ctx.filter = 'contrast(1.3) brightness(1.1) saturate(0)';
      ctx.drawImage(canvas, 0, 0);

      // Reset filter
      ctx.filter = 'none';

      // Retourner l'image optimisée
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for preprocessing'));
    };

    img.src = imageData;
  });
}

/**
 * Extraction de texte avec OCR robuste
 */
export async function extractTextFromImage(imageData: string): Promise<string> {
  try {
    // Préprocessing pour améliorer la précision OCR
    const processedImage = await preprocessImage(imageData);
    
    // Création du worker Tesseract avec typage any pour éviter les erreurs
    const worker: any = await Tesseract.createWorker();

    try {
      // Chargement et initialisation des langues
      await worker.loadLanguage('eng+fra+deu');
      await worker.initialize('eng+fra+deu');

      // Configuration de base pour éviter les problèmes de compatibilité
      await worker.setParameters({
        preserve_interword_spaces: '1',
      });

      // Reconnaissance OCR
      const { data: { text } } = await worker.recognize(processedImage);
      
      console.log('OCR extraction réussie');
      
      // Nettoyage du texte
      const cleanedText = text
        .trim()
        .replace(/\s+/g, ' ') // Normaliser les espaces
        .replace(/[^\w\s.,;:!?()[\]{}@#%&*+\-=<>/\\|"'`~àáâãäåæçèéêëìíîïñòóôõöøùúûüýÿ€$£¥]/g, '');

      return cleanedText;

    } finally {
      // Nettoyage obligatoire du worker
      await worker.terminate();
    }

  } catch (error) {
    console.error('Erreur extraction OCR:', error);
    throw new Error(`Impossible d'extraire le texte de l'image: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

/**
 * Détection automatique du type de document basée sur l'image
 */
export function detectDocumentTypeFromImage(imageData: string): Promise<{
  type: string;
  confidence: number;
  characteristics: string[];
}> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve({ type: 'unknown', confidence: 0, characteristics: [] });
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Analyse basique des caractéristiques visuelles
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      let edges = 0;
      let textAreas = 0;
      
      // Détection de contours et zones de texte (algorithme simplifié)
      for (let i = 0; i < data.length; i += 16) { // Échantillonnage
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const intensity = (r + g + b) / 3;
        
        if (intensity > 200 || intensity < 50) {
          edges++;
        }
        if (intensity > 150 && intensity < 250) {
          textAreas++;
        }
      }

      const aspectRatio = img.width / img.height;
      const characteristics = [];
      let type = 'document';
      let confidence = 0.5;

      // Heuristiques de classification
      if (aspectRatio > 1.4 && aspectRatio < 1.8) {
        characteristics.push('Format paysage standard');
        type = 'certificate';
        confidence += 0.2;
      }
      
      if (aspectRatio > 0.6 && aspectRatio < 0.7) {
        characteristics.push('Format portrait ID');
        type = 'id_card';
        confidence += 0.3;
      }

      if (textAreas / (data.length / 4) > 0.3) {
        characteristics.push('Riche en texte');
        confidence += 0.2;
      }

      resolve({ type, confidence, characteristics });
    };

    img.onerror = () => {
      resolve({ type: 'unknown', confidence: 0, characteristics: ['Erreur de chargement'] });
    };

    img.src = imageData;
  });
}