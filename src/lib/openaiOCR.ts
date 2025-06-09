import { AzureOpenAI } from 'openai';
import azureOpenAI, { DEPLOYMENT_NAME } from './openaiConfig';
import { validateImageFile, convertImageToJpeg } from './imageProcessing';

interface OCRResult {
  text: string;
  confidence: number;
  cost: number; // en USD
  inputTokens: number;
  outputTokens: number;
  wasConverted?: boolean; // Indique si l'image a été convertie
}

/**
 * Convertit un fichier en base64
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = (reader.result as string);
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}

/**
 * Prépare l'image pour Azure OpenAI Vision (conversion HEIC si nécessaire)
 */
async function prepareImageForAzureOpenAI(imageData: string, originalFile?: File): Promise<{
  processedImageData: string;
  wasConverted: boolean;
}> {
  // Si on a le fichier original, vérifier s'il faut le convertir
  if (originalFile) {
    const validation = validateImageFile(originalFile);
    
    if (!validation.isValid) {
      throw new Error(validation.error || 'Format d\'image non supporté');
    }
    
    if (validation.needsConversion) {
      console.log(`🔄 Converting ${validation.detectedFormat} to JPEG for Azure OpenAI Vision...`);
      
      try {
        const convertedFile = await convertImageToJpeg(originalFile);
        
        // Convertir le fichier converti en base64
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve({
              processedImageData: result,
              wasConverted: true
            });
          };
          reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier converti'));
          reader.readAsDataURL(convertedFile);
        });
      } catch (error) {
        console.warn('Conversion failed, trying with original image:', error);
        return {
          processedImageData: imageData,
          wasConverted: false
        };
      }
    }
  }
  
  // Pas de conversion nécessaire
  return {
    processedImageData: imageData,
    wasConverted: false
  };
}

/**
 * Extraction OCR avec Azure OpenAI Vision (gpt-4o-mini)
 * Compatible avec DocumentAnalyzer.tsx
 */
export async function extractTextWithOpenAI(
  imageData: string, 
  originalFile?: File
): Promise<OCRResult> {
  try {
    console.log('🇪🇺 Starting Azure OpenAI Vision OCR (gpt-4o-mini)...');
    
    // Préparer l'image (conversion HEIC si nécessaire)
    const { processedImageData, wasConverted } = await prepareImageForAzureOpenAI(imageData, originalFile);
    
    if (wasConverted) {
      console.log('✅ Image converted to JPEG for Azure OpenAI compatibility');
    }
    
    const response = await azureOpenAI.chat.completions.create({
      model: DEPLOYMENT_NAME, // Utiliser le déploiement Azure
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extrait tout le texte de cette image de document avec la plus haute précision possible.

Instructions:
- Retourne uniquement le texte extrait, sans commentaires ni explication
- Préserve exactement la mise en forme et les retours à la ligne
- Respecte la structure originale du document (titres, paragraphes, listes)
- Si le document est en plusieurs langues, garde toutes les langues
- Pour les formulaires, indique clairement "Champ: Valeur"
- Pour les tableaux, préserve la structure avec des espaces/tabulations
- Si certaines parties sont illisibles, indique [ILLISIBLE] uniquement pour ces zones
- Ne rajoute aucun texte explicatif`
            },
            {
              type: "image_url",
              image_url: {
                url: processedImageData,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0.1
    });

    const extractedText = response.choices[0]?.message?.content || '';
    
    if (!extractedText.trim()) {
      throw new Error('Azure OpenAI Vision returned empty text');
    }

    // Tarification officielle gpt-4o-mini (Décembre 2024)
    const inputTokens = response.usage?.prompt_tokens || 1000;
    const outputTokens = response.usage?.completion_tokens || 100;
    
    // $0.15/1M input tokens, $0.60/1M output tokens
    const cost = (inputTokens * 0.00015 + outputTokens * 0.0006) / 1000;

    console.log('✅ Azure OpenAI Vision OCR completed:', {
      textLength: extractedText.length,
      inputTokens,
      outputTokens,
      cost: `$${cost.toFixed(5)}`,
      wasConverted
    });

    return {
      text: extractedText,
      confidence: 0.95, // Azure OpenAI Vision has consistently high confidence
      cost,
      inputTokens,
      outputTokens,
      wasConverted
    };

  } catch (error) {
    console.error('❌ Azure OpenAI Vision OCR failed:', error);
    
    if (error instanceof Error && error.message.includes('rate_limit')) {
      throw new Error('Limite de débit Azure OpenAI atteinte. Veuillez réessayer dans quelques secondes.');
    }
    
    if (error instanceof Error && error.message.includes('insufficient_quota')) {
      throw new Error('Quota Azure OpenAI insuffisant. Vérifiez votre facturation.');
    }
    
    throw new Error(`Échec OCR Azure OpenAI Vision: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

/**
 * Statistiques d'utilisation OCR
 */
export interface OCRStats {
  totalCalls: number;
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  averageConfidence: number;
  averageCostPerCall: number;
}

// Store simple pour les stats (en prod, utiliser Supabase)
let ocrStats: OCRStats = {
  totalCalls: 0,
  totalCost: 0,
  totalInputTokens: 0,
  totalOutputTokens: 0,
  averageConfidence: 0,
  averageCostPerCall: 0
};

/**
 * Met à jour les statistiques OCR
 */
export function updateOCRStats(result: OCRResult) {
  ocrStats.totalCalls++;
  ocrStats.totalCost += result.cost;
  ocrStats.totalInputTokens += result.inputTokens;
  ocrStats.totalOutputTokens += result.outputTokens;
  
  // Moyenne mobile de la confiance
  ocrStats.averageConfidence = (
    (ocrStats.averageConfidence * (ocrStats.totalCalls - 1) + result.confidence) / 
    ocrStats.totalCalls
  );
  
  // Coût moyen par appel
  ocrStats.averageCostPerCall = ocrStats.totalCost / ocrStats.totalCalls;
}

/**
 * Récupère les statistiques OCR
 */
export function getOCRStats(): OCRStats {
  return { ...ocrStats };
}

/**
 * Réinitialise les statistiques (utile pour les tests)
 */
export function resetOCRStats() {
  ocrStats = {
    totalCalls: 0,
    totalCost: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    averageConfidence: 0,
    averageCostPerCall: 0
  };
}

/**
 * Calcule les projections de coût
 */
export function calculateCostProjections(docsPerMonth: number): {
  monthly: number;
  yearly: number;
  dailyAverage: number;
} {
  const avgCost = ocrStats.averageCostPerCall || 0.00027; // Fallback sur estimation
  
  return {
    monthly: docsPerMonth * avgCost,
    yearly: docsPerMonth * avgCost * 12,
    dailyAverage: (docsPerMonth * avgCost) / 30
  };
}