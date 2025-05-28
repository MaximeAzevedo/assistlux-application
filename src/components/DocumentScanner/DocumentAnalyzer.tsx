import React, { useState } from 'react';
import { AlertCircle, FileText, BookOpen, ListChecks, Globe, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import DocumentTypeDetector from './DocumentTypeDetector';
import { analyzeDocument } from '../../lib/documentAnalysis';
import { extractTextFromImage } from '../../lib/imageProcessing';
import { supportedLanguages } from '../../lib/translation';

interface DocumentAnalyzerProps {
  imageData?: string;
  textData?: string;
  onAnalysisComplete: (text: string, translation: string, documentType: string, summary: string, keyPoints: string[], analysis?: any) => void;
}

const DocumentAnalyzer: React.FC<DocumentAnalyzerProps> = ({ imageData, textData, onAnalysisComplete }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState<string>('unknown');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const { t, i18n } = useTranslation();

  const handleTypeDetection = (type: string, confidence: number) => {
    setDocumentType(type);
    console.log('Detected document type:', type, 'with confidence:', confidence);
  };

  const analyzeDocumentContent = async () => {
    setIsAnalyzing(true);
    setError(null);
    setProgress(0);
    
    try {
      console.log('🚀 Starting enhanced document analysis...');
      setProgress(10);
      
      // Extract text if needed
      const extractedText = textData || (imageData ? await extractTextFromImage(imageData) : '');
      setProgress(30);
      
      if (!extractedText) {
        throw new Error(t('scanner.noTextFound'));
      }

      console.log('📝 Text extracted, starting AI analysis...');
      setProgress(50);
      
      // Use the preferred language or current i18n language
      const targetLanguage = selectedLanguage || i18n.language;
      
      // Analyze document with enhanced features
      const analysis = await analyzeDocument(extractedText, targetLanguage);
      setProgress(90);

      const translation = analysis.explanation.translations[targetLanguage] || extractedText;
      const summary = analysis.explanation.summary;
      const keyPoints = analysis.explanation.keyPoints || [];

      console.log('✅ Enhanced analysis complete:', {
        documentType: analysis.type,
        detectedLanguage: analysis.detectedLanguage,
        targetLanguage: analysis.targetLanguage,
        confidence: analysis.confidence,
        translationLength: translation.length,
        summaryLength: summary.length,
        keyPointsCount: keyPoints.length,
        hasContext: !!analysis.explanation.context
      });

      setProgress(100);
      onAnalysisComplete(
        extractedText,
        translation,
        analysis.type,
        summary,
        keyPoints,
        analysis // Pass the full analysis for enhanced display
      );
    } catch (err) {
      console.error('❌ Document analysis error:', err);
      
      // Provide user-friendly error messages
      let userFriendlyError = t('scanner.error');
      
      if (err instanceof Error) {
        const errorMessage = err.message.toLowerCase();
        
        if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          userFriendlyError = t('scanner.networkError');
        } else if (errorMessage.includes('api') || errorMessage.includes('openai')) {
          userFriendlyError = t('scanner.apiError');
        } else if (errorMessage.includes('text') || errorMessage.includes('empty')) {
          userFriendlyError = t('scanner.noTextFound');
        } else if (errorMessage.includes('language') || errorMessage.includes('translation')) {
          userFriendlyError = t('scanner.translationError');
        } else {
          // For any other error, use a generic message
          userFriendlyError = t('scanner.analysisError');
        }
      }
      
      setError(userFriendlyError);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getProgressMessage = () => {
    if (progress < 30) return t('scanner.extractingText');
    if (progress < 50) return t('scanner.detectingLanguage');
    if (progress < 70) return t('scanner.translating');
    if (progress < 90) return t('scanner.generatingSummary');
    return t('scanner.finalizingAnalysis');
  };

  return (
    <div className="space-y-6">
      <DocumentTypeDetector 
        imageData={imageData}
        textData={textData}
        onDetectionComplete={handleTypeDetection}
      />

      {/* Language Selection */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">{t('scanner.languagePreference')}</span>
          </div>
          <button
            onClick={() => setShowLanguageSelector(!showLanguageSelector)}
            className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
        
        {showLanguageSelector ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(supportedLanguages).map(([code, info]) => (
              <button
                key={code}
                onClick={() => {
                  setSelectedLanguage(code);
                  setShowLanguageSelector(false);
                }}
                className={`p-2 text-sm rounded-lg border transition-all ${
                  selectedLanguage === code
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                {info.nativeName}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-blue-700">
            {selectedLanguage 
              ? `${t('scanner.selectedLanguage')}: ${supportedLanguages[selectedLanguage as keyof typeof supportedLanguages]?.nativeName}`
              : `${t('scanner.defaultLanguage')}: ${supportedLanguages[i18n.language as keyof typeof supportedLanguages]?.nativeName || i18n.language}`
            }
          </p>
        )}
      </div>

      {isAnalyzing ? (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 animate-fadeIn border border-purple-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <div className="w-10 h-10 rounded-full border-3 border-purple-200 border-t-purple-600 animate-spin"></div>
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/20 to-transparent blur-sm animate-pulse rounded-full"></div>
            </div>
            <div className="flex-1">
              <span className="text-gray-800 font-medium tracking-wide">
                {getProgressMessage()}
              </span>
              <p className="text-sm text-gray-600 mt-1">
                {t('scanner.enhancedAnalysisNote')}
              </p>
            </div>
          </div>
          
          <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shine_2s_ease-in-out_infinite]"></div>
            </div>
          </div>
          
          <div className="mt-3 text-xs text-gray-500 text-right">
            {progress}% {t('scanner.complete')}
          </div>
        </div>
      ) : (
        <button
          onClick={analyzeDocumentContent}
          className="relative w-full flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-purple-600 via-primary to-pink-600 text-white rounded-2xl hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] group overflow-hidden"
        >
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
          <FileText className="w-6 h-6 relative z-10" />
          <span className="relative z-10 font-semibold text-lg">{t('scanner.startEnhancedAnalysis')}</span>
          <div className="relative z-10 flex items-center gap-1 text-sm opacity-90">
            <BookOpen className="w-4 h-4" />
            <ListChecks className="w-4 h-4" />
            <Globe className="w-4 h-4" />
          </div>
        </button>
      )}

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 text-red-700 rounded-xl animate-fadeIn border border-red-200">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">{t('scanner.analysisError')}</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentAnalyzer;