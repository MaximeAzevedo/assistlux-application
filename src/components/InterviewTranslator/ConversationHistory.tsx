import React, { useEffect, useRef } from 'react';
import { Clock, Volume2, Copy, Check } from 'lucide-react';
import { TranslationMessage } from '../../types/interviewTranslator';

interface ConversationHistoryProps {
  messages: TranslationMessage[];
  assistantLanguage: string;
  userLanguage: string;
}

const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  messages,
  assistantLanguage,
  userLanguage
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedMessageId, setCopiedMessageId] = React.useState<string | null>(null);

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Formatage de l'heure
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Copie du texte dans le presse-papiers
  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('Erreur copie:', error);
    }
  };

  // Lecture vocale du message
  const speakMessage = (text: string, language: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'fr' ? 'fr-FR' : 
                     language === 'ar' ? 'ar-SA' :
                     language === 'en' ? 'en-US' :
                     language === 'de' ? 'de-DE' :
                     language === 'es' ? 'es-ES' : 'fr-FR';
      speechSynthesis.speak(utterance);
    }
  };

  if (messages.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-xl p-8 border border-gray-100/50">
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Historique de conversation
          </h3>
          <p className="text-gray-600">
            Les messages traduits apparaîtront ici en temps réel
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-xl border border-gray-100/50 shadow-lg">
      {/* Header simplifié */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Historique ({messages.length} échanges)
        </h3>
      </div>

      {/* Messages */}
      <div className="p-4 max-h-96 overflow-y-auto space-y-4">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`
              flex ${message.speaker === 'assistant' ? 'justify-start' : 'justify-end'}
            `}
          >
            <div
              className={`
                max-w-[85%] rounded-xl p-4 shadow-sm
                ${message.speaker === 'assistant' 
                  ? 'bg-purple-50 border border-purple-200' 
                  : 'bg-blue-50 border border-blue-200'
                }
              `}
            >
              {/* Header du message épuré */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`
                    w-2 h-2 rounded-full
                    ${message.speaker === 'assistant' ? 'bg-purple-500' : 'bg-blue-500'}
                  `}></div>
                  <span className={`
                    text-xs font-medium px-2 py-1 rounded-full
                    ${message.speaker === 'assistant' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                    }
                  `}>
                    {message.speaker === 'assistant' ? 'Assistant' : 'Usager'}
                  </span>
                  
                  <span className="text-xs text-gray-500">
                    {formatTime(message.timestamp)}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {/* Bouton lecture vocale */}
                  <button
                    onClick={() => speakMessage(message.translatedText, message.targetLanguage)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                    title="Écouter"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Bouton copie */}
                  <button
                    onClick={() => copyToClipboard(message.translatedText, message.id)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                    title="Copier"
                  >
                    {copiedMessageId === message.id ? (
                      <Check className="w-3.5 h-3.5 text-green-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Contenu du message */}
              <div className="text-gray-900 leading-relaxed">
                {message.translatedText}
              </div>

              {/* Indication de traduction discrète */}
              {message.originalLanguage !== assistantLanguage && (
                <div className="mt-3 pt-2 border-t border-gray-200">
                  <span className="text-xs text-gray-500">
                    Traduit de {message.originalLanguage.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* Référence pour l'auto-scroll */}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer épuré */}
      <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
        <div className="flex justify-between items-center text-xs text-gray-600">
          <span>
            {assistantLanguage.toUpperCase()} ↔ {userLanguage.toUpperCase()}
          </span>
          <span>
            {messages.length} échanges
          </span>
        </div>
      </div>
    </div>
  );
};

export default ConversationHistory; 