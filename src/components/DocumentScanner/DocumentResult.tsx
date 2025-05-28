import React, { useState } from 'react';
import { 
  FileText, 
  FileType, 
  AlertCircle, 
  BookOpen, 
  ListChecks, 
  Globe, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Info,
  Calendar,
  Phone,
  Mail,
  MapPin,
  User,
  CreditCard,
  Eye,
  EyeOff,
  Copy,
  Check
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DocumentResultProps {
  originalText: string;
  translatedText: string;
  documentType?: string;
  summary?: string;
  keyPoints?: string[];
  analysis?: any; // Enhanced analysis data
  onCopy?: (text: string) => void;
  onDownload?: () => void;
}

const DocumentResult: React.FC<DocumentResultProps> = ({
  originalText,
  translatedText,
  documentType,
  summary,
  keyPoints = [],
  analysis,
  onCopy,
  onDownload
}) => {
  const { t } = useTranslation();
  const [showOriginalText, setShowOriginalText] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = (text: string, section: string) => {
    if (onCopy) {
      onCopy(text);
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getImportanceIcon = (importance: string) => {
    switch (importance) {
      case 'urgent': return <AlertTriangle className="w-5 h-5" />;
      case 'high': return <Clock className="w-5 h-5" />;
      case 'medium': return <Info className="w-5 h-5" />;
      case 'low': return <CheckCircle className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  const formatDocumentType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Document Header with Enhanced Info */}
      <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <FileType className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-purple-900">
                {formatDocumentType(documentType || 'Document')}
              </h3>
              {analysis?.confidence && (
                <div className="flex items-center gap-2">
                  <p className="text-sm text-purple-600">
                    {t('scanner.confidence')}: {Math.round(analysis.confidence * 100)}%
                  </p>
                  <div className="group relative">
                    <Info className="w-4 h-4 text-purple-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      {t('scanner.confidenceExplanation')}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {analysis?.explanation?.context?.importance && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getImportanceColor(analysis.explanation.context.importance)}`}>
              {getImportanceIcon(analysis.explanation.context.importance)}
              <span className="text-sm font-medium">
                {t(`scanner.importance.${analysis.explanation.context.importance}`)}
              </span>
            </div>
          )}
        </div>

        {/* Language Information */}
        {analysis?.detectedLanguage && analysis?.targetLanguage && (
          <div className="flex items-center gap-4 text-sm text-purple-700">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span>{t('scanner.detectedLanguage')}: {analysis.detectedLanguage.toUpperCase()}</span>
            </div>
            {analysis.detectedLanguage !== analysis.targetLanguage && (
              <div className="flex items-center gap-2">
                <span>→</span>
                <span>{t('scanner.translatedTo')}: {analysis.targetLanguage.toUpperCase()}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Summary */}
      <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-600 to-pink-600"></div>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-purple-900">
                {t('scanner.summary')}
              </h3>
            </div>
            <button
              onClick={() => handleCopy(summary || '', 'summary')}
              className="flex items-center gap-2 px-3 py-1 text-sm text-purple-600 hover:text-purple-800 transition-colors"
            >
              {copiedSection === 'summary' ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>{t('scanner.copied')}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>{t('scanner.copy')}</span>
                </>
              )}
            </button>
          </div>
          <p className="text-gray-700 leading-relaxed text-lg">
            {summary || t('scanner.summaryNote')}
          </p>
        </div>
      </div>

      {/* Enhanced Key Points */}
      {keyPoints && keyPoints.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <ListChecks className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-blue-900">
                {t('scanner.keyPoints')}
              </h3>
            </div>
            <button
              onClick={() => handleCopy(keyPoints.join('\n• '), 'keypoints')}
              className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              {copiedSection === 'keypoints' ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>{t('scanner.copied')}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>{t('scanner.copy')}</span>
                </>
              )}
            </button>
          </div>
          <ul className="space-y-3">
            {keyPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex-shrink-0"></div>
                <span className="text-gray-700 leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Extracted Information */}
      {analysis?.fields && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Personal Information */}
          {analysis.fields.personal && Object.values(analysis.fields.personal).some(v => v) && (
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-5 h-5 text-green-600" />
                <h4 className="font-medium text-green-900">{t('scanner.personalInfo')}</h4>
              </div>
              <div className="space-y-2 text-sm">
                {analysis.fields.personal.firstName && (
                  <p><span className="text-gray-600">{t('scanner.firstName')}:</span> {analysis.fields.personal.firstName}</p>
                )}
                {analysis.fields.personal.lastName && (
                  <p><span className="text-gray-600">{t('scanner.lastName')}:</span> {analysis.fields.personal.lastName}</p>
                )}
                {analysis.fields.personal.dateOfBirth && (
                  <p><span className="text-gray-600">{t('scanner.dateOfBirth')}:</span> {analysis.fields.personal.dateOfBirth}</p>
                )}
                {analysis.fields.personal.nationality && (
                  <p><span className="text-gray-600">{t('scanner.nationality')}:</span> {analysis.fields.personal.nationality}</p>
                )}
              </div>
            </div>
          )}

          {/* Contact Information */}
          {analysis.fields.contact && Object.values(analysis.fields.contact).some(v => v) && (
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Phone className="w-5 h-5 text-blue-600" />
                <h4 className="font-medium text-blue-900">{t('scanner.contactInfo')}</h4>
              </div>
              <div className="space-y-2 text-sm">
                {analysis.fields.contact.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{analysis.fields.contact.phone}</span>
                  </div>
                )}
                {analysis.fields.contact.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{analysis.fields.contact.email}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Address Information */}
          {analysis.fields.address && Object.values(analysis.fields.address).some(v => v) && (
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-5 h-5 text-red-600" />
                <h4 className="font-medium text-red-900">{t('scanner.addressInfo')}</h4>
              </div>
              <div className="space-y-1 text-sm">
                {analysis.fields.address.street && <p>{analysis.fields.address.street}</p>}
                {(analysis.fields.address.postalCode || analysis.fields.address.city) && (
                  <p>
                    {analysis.fields.address.postalCode} {analysis.fields.address.city}
                  </p>
                )}
                {analysis.fields.address.country && <p>{analysis.fields.address.country}</p>}
              </div>
            </div>
          )}

          {/* Deadlines */}
          {analysis.fields.deadlines && analysis.fields.deadlines.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-orange-600" />
                <h4 className="font-medium text-orange-900">{t('scanner.deadlines')}</h4>
              </div>
              <div className="space-y-2">
                {analysis.fields.deadlines.map((deadline: any, index: number) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <Clock className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{deadline.date}</p>
                      <p className="text-gray-600">{deadline.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Next Steps */}
      {analysis?.explanation?.context?.nextSteps && analysis.explanation.context.nextSteps.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-900">
              {t('scanner.nextSteps')}
            </h3>
          </div>
          <ol className="space-y-2">
            {analysis.explanation.context.nextSteps.map((step: string, index: number) => (
              <li key={index} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white text-sm rounded-full flex items-center justify-center font-medium">
                  {index + 1}
                </span>
                <span className="text-green-800">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Full Content with Language Toggle */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-600" />
              <h3 className="font-medium text-gray-900">{t('scanner.fullContent')}</h3>
            </div>
            
            {originalText !== translatedText && (
              <button
                onClick={() => setShowOriginalText(!showOriginalText)}
                className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                {showOriginalText ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    <span>{t('scanner.showTranslation')}</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    <span>{t('scanner.showOriginal')}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          {(showOriginalText ? originalText : translatedText)
            .split('\n')
            .filter(paragraph => paragraph.trim().length > 0)
            .map((paragraph, index) => {
              const trimmedParagraph = paragraph.trim();
              
              // Skip very short lines that might be formatting artifacts
              if (trimmedParagraph.length < 10) {
                return null;
              }
              
              return (
                <p key={index} className="text-gray-700 leading-relaxed text-justify">
                  {trimmedParagraph}
                </p>
              );
            })
            .filter(Boolean)}
          
          {/* If no paragraphs were found, show the full text as one block */}
          {(showOriginalText ? originalText : translatedText)
            .split('\n')
            .filter(paragraph => paragraph.trim().length >= 10).length === 0 && (
            <p className="text-gray-700 leading-relaxed text-justify">
              {(showOriginalText ? originalText : translatedText).trim()}
            </p>
          )}
        </div>
      </div>

      {/* Translation Note */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-200">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-medium mb-1">{t('scanner.translationNote')}</p>
          <p>{t('scanner.enhancedAnalysisDisclaimer')}</p>
        </div>
      </div>
    </div>
  );
};

export default DocumentResult;