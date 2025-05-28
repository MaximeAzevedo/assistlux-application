import React from 'react';
import { FileText, Download, Copy, Languages, FileType, AlertCircle, BookOpen, ListChecks } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface DocumentResultProps {
  originalText: string;
  translatedText: string;
  documentType?: string;
  summary?: string;
  keyPoints?: string[];
  onCopy: (text: string) => void;
  onDownload: () => void;
}

const DocumentResult: React.FC<DocumentResultProps> = ({
  originalText,
  translatedText,
  documentType,
  summary,
  keyPoints = [],
  onCopy,
  onDownload
}) => {
  const { t, i18n } = useTranslation();
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = React.useState(true);
  const [translationError, setTranslationError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchUserPreferences = async () => {
      try {
        if (currentUser) {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const preferredLang = userData?.languages?.preferred;
            if (preferredLang && i18n.languages.includes(preferredLang)) {
              await i18n.changeLanguage(preferredLang);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user preferences:', error);
        setTranslationError(t('documentResult.preferenceError'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserPreferences();
  }, [currentUser, i18n, t]);

  const isRTL = i18n.dir() === 'rtl';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Document Type Badge */}
      {documentType && documentType !== 'unknown' && (
        <div className="flex items-center gap-2 p-4 bg-purple-50 text-purple-700 rounded-lg">
          <FileType className="w-5 h-5" />
          <span className="font-medium">{documentType}</span>
        </div>
      )}

      {/* Summary Section */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-medium text-purple-900">
            {t('documentResult.summary')}
          </h3>
        </div>
        <p className="text-gray-700 leading-relaxed">
          {summary || t('documentResult.summaryNote')}
        </p>
      </div>

      {/* Key Points Section */}
      {keyPoints && keyPoints.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-purple-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <ListChecks className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-medium text-purple-900">
              {t('documentResult.keyPoints')}
            </h3>
          </div>
          <ul className="space-y-3">
            {keyPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-purple-400" />
                <span className="text-gray-700">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Full Translation Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            <h3 className="font-medium text-gray-900">
              {t('documentResult.fullContent')}
            </h3>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          {translatedText.split('\n').map((paragraph, index) => (
            paragraph.trim() && (
              <p key={index} className="text-gray-700 leading-relaxed">
                {paragraph}
              </p>
            )
          ))}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          <button
            onClick={() => onCopy(translatedText)}
            className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 transition-colors"
          >
            <Copy className="w-4 h-4" />
            {t('documentResult.copy')}
          </button>

          <button
            onClick={onDownload}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            {t('documentResult.download')}
          </button>
        </div>
      </div>

      {/* Translation Note */}
      <div className="bg-blue-50 rounded-lg p-4">
        <p className="text-sm text-blue-700 flex items-start gap-2">
          <Languages className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{t('documentResult.translationNote')}</span>
        </p>
      </div>

      {translationError && (
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-sm text-red-700 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{translationError}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default DocumentResult;