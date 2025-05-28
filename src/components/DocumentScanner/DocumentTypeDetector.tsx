import React, { useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Initialize TensorFlow.js backend
tf.setBackend('webgl');

interface DocumentTypeDetectorProps {
  imageData?: string;
  textData?: string;
  onDetectionComplete: (documentType: string, confidence: number) => void;
}

const DocumentTypeDetector: React.FC<DocumentTypeDetectorProps> = ({ imageData, textData, onDetectionComplete }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    let isMounted = true;

    const detectDocumentType = async () => {
      try {
        // If we have text data, use text-based detection
        if (textData) {
          // Simple text-based detection
          const lowerText = textData.toLowerCase();
          let documentType = 'unknown';
          let confidence = 0.7;

          if (lowerText.includes('revis') || lowerText.includes('revenu d\'inclusion sociale')) {
            documentType = 'revis';
            confidence = 0.9;
          } else if (lowerText.includes('allocation') && lowerText.includes('vie chère')) {
            documentType = 'allocation_vie_chere';
            confidence = 0.9;
          } else if (lowerText.includes('déclaration d\'arrivée')) {
            documentType = 'declaration_arrivee';
            confidence = 0.9;
          }

          if (isMounted) {
            onDetectionComplete(documentType, confidence);
            setIsLoading(false);
          }
          return;
        }

        // If we have image data, use image-based detection
        if (imageData) {
          // Ensure backend is initialized
          await tf.ready();
          
          // Load the COCO-SSD model
          const model = await cocoSsd.load({
            base: 'lite_mobilenet_v2'  // Use a lighter model for better performance
          });

          // Create an image element from the base64 data
          const img = new Image();
          
          // Set up image load handling before setting src
          const imageLoadPromise = new Promise((resolve, reject) => {
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Failed to load image'));
          });

          // Handle both data URL and blob URL formats
          if (imageData.startsWith('data:image/') || imageData.startsWith('blob:')) {
            img.src = imageData;
          } else {
            throw new Error('Invalid image data format');
          }

          // Wait for image to load
          await imageLoadPromise;

          // Convert image to tensor
          const tensor = tf.browser.fromPixels(img);
          
          // Make predictions
          const predictions = await model.detect(tensor);

          // Clean up tensor
          tensor.dispose();

          if (!isMounted) return;

          // Process predictions to determine document type
          if (predictions.length > 0) {
            // Get the prediction with highest confidence
            const bestPrediction = predictions.reduce((prev, current) => 
              (current.score > prev.score) ? current : prev
            );

            // Map detected objects to document types
            let documentType = 'unknown';
            if (bestPrediction.class.includes('book') || 
                bestPrediction.class.includes('paper')) {
              documentType = 'document';
            } else if (bestPrediction.class.includes('cell phone')) {
              documentType = 'id_card';
            }

            onDetectionComplete(documentType, bestPrediction.score);
          } else {
            onDetectionComplete('unknown', 0);
          }
        } else {
          // No image or text data provided
          onDetectionComplete('unknown', 0);
        }
      } catch (err) {
        console.error('Error detecting document type:', err);
        if (isMounted) {
          setError(t('documentAnalysis.error'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    detectDocumentType();

    return () => {
      isMounted = false;
    };
  }, [imageData, textData, onDetectionComplete, t]);

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-4">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
        <span className="text-gray-700">{t('documentAnalysis.analyzing')}</span>
      </div>
    );
  }

  return null;
};

export default DocumentTypeDetector;