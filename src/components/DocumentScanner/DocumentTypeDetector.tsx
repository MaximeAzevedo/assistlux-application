import React, { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
        let documentType = 'unknown';
        let confidence = 0.5;

        // Enhanced text-based detection (principal method)
        if (textData) {
          const lowerText = textData.toLowerCase();
          
          // Detection patterns with higher confidence
          if (lowerText.includes('revis') || lowerText.includes('revenu d\'inclusion sociale')) {
            documentType = 'revis';
            confidence = 0.95;
          } else if (lowerText.includes('allocation') && lowerText.includes('vie chère')) {
            documentType = 'allocation_vie_chere';
            confidence = 0.95;
          } else if (lowerText.includes('déclaration d\'arrivée')) {
            documentType = 'declaration_arrivee';
            confidence = 0.95;
          } else if (lowerText.includes('aide') && lowerText.includes('logement')) {
            documentType = 'aide_logement';
            confidence = 0.9;
          } else if (lowerText.includes('carte d\'identité') || lowerText.includes('passeport')) {
            documentType = 'id_card';
            confidence = 0.9;
          } else if (lowerText.includes('contrat') && lowerText.includes('bail')) {
            documentType = 'bail';
            confidence = 0.9;
          } else if (lowerText.includes('fiche') && lowerText.includes('salaire')) {
            documentType = 'fiche_salaire';
            confidence = 0.9;
          } else if (lowerText.length > 50) {
            // Si on a du texte mais pas de pattern spécifique
            documentType = 'document';
            confidence = 0.7;
          }
        }

        // Simple image-based heuristics (without TensorFlow)
        else if (imageData) {
          // Basic image analysis could be added here if needed
          // For now, assume it's a document if we have image data
          documentType = 'document';
          confidence = 0.6;
        }

        if (isMounted) {
          onDetectionComplete(documentType, confidence);
          setIsLoading(false);
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