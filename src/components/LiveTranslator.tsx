import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Languages, X, Volume2 } from 'lucide-react';
import { azureOpenAIClient, DEPLOYMENT_NAME } from '../lib/openaiConfig';
import { supportedLanguages } from '../lib/translation';
import { azureSpeechService, SpeechRecognitionResult } from '../services/azureSpeechService';

interface TranslationMessage {
  id: string;
  originalText: string;
  translatedText: string;
  fromLanguage: string;
  toLanguage: string;
  timestamp: Date;
  speaker: 'assistant' | 'user';
  isAnonymized: boolean;
}

interface LiveTranslatorProps {
  isOpen: boolean;
  onClose: () => void;
  defaultLanguages?: {
    assistant: string;
    user: string;
  };
}

export const LiveTranslator: React.FC<LiveTranslatorProps> = ({
  isOpen,
  onClose,
  defaultLanguages = { assistant: 'fr', user: 'ar' }
}) => {
  // États
  const [messages, setMessages] = useState<TranslationMessage[]>([]);
  const [languages, setLanguages] = useState(defaultLanguages);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // États pour les champs de texte
  const [inputText, setInputText] = useState('');
  const [currentSpeaker, setCurrentSpeaker] = useState<'assistant' | 'user'>('assistant');
  
  // États pour la reconnaissance vocale Azure
  const [isListening, setIsListening] = useState(false);
  const [azureSpeechAvailable, setAzureSpeechAvailable] = useState(false);
  const [speechStatus, setSpeechStatus] = useState<'idle' | 'listening' | 'processing'>('idle');

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Vérifier la disponibilité d'Azure Speech Services
  useEffect(() => {
    const available = azureSpeechService.isAvailable();
    setAzureSpeechAvailable(available);

    // Configuration des callbacks Azure Speech
    const handleResult = (result: SpeechRecognitionResult) => {
      setInputText(result.text);
      setSpeechStatus('idle');
      setIsListening(false);
    };

    const handleError = (error: string) => {
      console.error('❌ Erreur Azure Speech:', error);
      setSpeechStatus('idle');
      setIsListening(false);
    };

    azureSpeechService.addResultListener(handleResult);
    azureSpeechService.addErrorListener(handleError);

    return () => {
      azureSpeechService.removeResultListener(handleResult);
      azureSpeechService.removeErrorListener(handleError);
    };
  }, []);

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fonction d'anonymisation RGPD simplifiée
  const anonymizeText = (text: string): string => {
    let anonymized = text;
    anonymized = anonymized.replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[NOM]');
    anonymized = anonymized.replace(/\b\d{13}\b/g, '[MATRICULE]');
    anonymized = anonymized.replace(/(\+352\s?)?[\d\s-]{8,}/g, '[TEL]');
    anonymized = anonymized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');
    return anonymized;
  };

  // Traduction avec Azure OpenAI
  const translateText = async (text: string, fromLang: string, toLang: string): Promise<{ translated: string; wasAnonymized: boolean }> => {
    try {
      const textToTranslate = anonymizeText(text);
      const wasAnonymized = textToTranslate !== text;

      const response = await azureOpenAIClient.chat.completions.create({
        model: DEPLOYMENT_NAME,
        messages: [{
          role: 'system',
          content: `Traduis de ${supportedLanguages[fromLang as keyof typeof supportedLanguages]?.name || fromLang} vers ${supportedLanguages[toLang as keyof typeof supportedLanguages]?.name || toLang}. Conserve les marqueurs d'anonymisation. Sois naturel et bienveillant.`
        }, {
          role: 'user',
          content: textToTranslate
        }],
        temperature: 0.3,
        max_tokens: 300
      });

      const translated = response.choices[0]?.message?.content?.trim() || textToTranslate;
      return { translated, wasAnonymized };
    } catch (error) {
      console.error('Erreur traduction:', error);
      return { translated: `[Erreur] ${text}`, wasAnonymized: false };
    }
  };

  // Envoyer un message
  const sendMessage = async () => {
    if (!inputText.trim()) return;

    setIsProcessing(true);
    
    try {
      const fromLang = currentSpeaker === 'assistant' ? languages.assistant : languages.user;
      const toLang = currentSpeaker === 'assistant' ? languages.user : languages.assistant;
      
      const { translated, wasAnonymized } = await translateText(inputText, fromLang, toLang);

      const newMessage: TranslationMessage = {
        id: Date.now().toString(),
        originalText: inputText,
        translatedText: translated,
        fromLanguage: fromLang,
        toLanguage: toLang,
        timestamp: new Date(),
        speaker: currentSpeaker,
        isAnonymized: wasAnonymized
      };

      setMessages(prev => [...prev, newMessage]);
      setInputText('');

    } catch (error) {
      console.error('Erreur envoi message:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reconnaissance vocale Azure
  const toggleSpeechRecognition = async () => {
    if (!azureSpeechAvailable) {
      alert('❌ Azure Speech non configuré.');
      return;
    }

    if (isListening) {
      azureSpeechService.stopRecognition();
      setIsListening(false);
      return;
    }

    try {
      const lang = currentSpeaker === 'assistant' ? languages.assistant : languages.user;
      setIsListening(true);

      await azureSpeechService.startRecognition({
        language: lang,
        continuous: false,
        interimResults: true,
        maxDuration: 30
      });

    } catch (error) {
      console.error('❌ Erreur reconnaissance:', error);
      setIsListening(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 left-6 z-[70] w-96 h-[600px] transition-all duration-300">
      <div className="bg-white rounded-[20px] shadow-2xl border border-gray-100 overflow-hidden h-full flex flex-col backdrop-blur-sm">
        {/* En-tête Premium avec sélecteur de langues */}
        <div className="p-4 bg-gradient-to-r from-[#7F00FF] to-[#E100FF] text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <Languages className="w-5 h-5" />
              <div>
                <h3 className="font-semibold text-sm">Traduction Temps Réel</h3>
                <p className="text-xs text-white/80">
                  {supportedLanguages[languages[currentSpeaker] as keyof typeof supportedLanguages]?.flag} 
                  {supportedLanguages[languages[currentSpeaker] as keyof typeof supportedLanguages]?.name}
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
              title="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sélecteur de langues intégré */}
          <div className="grid grid-cols-2 gap-3">
            <select
              value={languages.assistant}
              onChange={(e) => setLanguages(prev => ({ ...prev, assistant: e.target.value }))}
              className="text-xs p-2 border-0 rounded-lg bg-white/20 text-white placeholder-white/70 focus:bg-white/30 focus:outline-none"
            >
              {Object.entries(supportedLanguages).map(([code, lang]) => (
                <option key={code} value={code} className="text-gray-900">
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
            
            <select
              value={languages.user}
              onChange={(e) => setLanguages(prev => ({ ...prev, user: e.target.value }))}
              className="text-xs p-2 border-0 rounded-lg bg-white/20 text-white placeholder-white/70 focus:bg-white/30 focus:outline-none"
            >
              {Object.entries(supportedLanguages).map(([code, lang]) => (
                <option key={code} value={code} className="text-gray-900">
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 text-sm py-8">
              <Languages className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Commencez une conversation</p>
              <p className="text-xs mt-1">Sélectionnez qui parle et tapez votre message</p>
            </div>
          )}
          
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.speaker === 'assistant' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-[16px] px-3 py-2 ${
                message.speaker === 'assistant'
                  ? 'bg-gradient-to-r from-[#7F00FF] to-[#E100FF] text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <div className="text-sm font-medium mb-1">
                  {message.originalText}
                </div>
                <div className="text-xs opacity-80 border-t border-white/20 pt-1">
                  → {message.translatedText}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs opacity-60">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {message.isAnonymized && (
                    <span className="text-xs bg-white/20 px-1 rounded" title="Données anonymisées">RGPD</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Zone de saisie */}
        <div className="p-4 border-t border-gray-100">
          {/* Sélecteur de locuteur */}
          <div className="flex mb-3 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setCurrentSpeaker('assistant')}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-colors ${
                currentSpeaker === 'assistant'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Utilisateur
            </button>
            <button
              onClick={() => setCurrentSpeaker('user')}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-colors ${
                currentSpeaker === 'user'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Bénéficiaire
            </button>
          </div>

          {/* Input avec boutons */}
          <div className="flex gap-2">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Tapez votre message en ${supportedLanguages[languages[currentSpeaker] as keyof typeof supportedLanguages]?.name}...`}
              className={`flex-1 p-3 border border-gray-200 rounded-[16px] resize-none text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                supportedLanguages[languages[currentSpeaker] as keyof typeof supportedLanguages]?.rtl ? 'text-right' : 'text-left'
              }`}
              rows={2}
              dir={supportedLanguages[languages[currentSpeaker] as keyof typeof supportedLanguages]?.rtl ? 'rtl' : 'ltr'}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            
            <div className="flex flex-col gap-1">
              {/* Bouton micro */}
              <button
                onClick={toggleSpeechRecognition}
                disabled={!azureSpeechAvailable}
                className={`p-3 rounded-[16px] transition-colors ${
                  isListening 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : azureSpeechAvailable
                      ? 'bg-purple-500 text-white hover:bg-purple-600'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                title={
                  !azureSpeechAvailable 
                    ? "Azure Speech non configuré" 
                    : isListening 
                      ? "Arrêter l'écoute" 
                      : "Reconnaissance vocale"
                }
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              
              {/* Bouton envoyer */}
              <button
                onClick={sendMessage}
                disabled={!inputText.trim() || isProcessing}
                className="p-3 bg-gradient-to-r from-[#7F00FF] to-[#E100FF] text-white rounded-[16px] hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Indicateur de statut */}
          {speechStatus !== 'idle' && (
            <div className="mt-2 text-xs text-purple-600 flex items-center">
              <Volume2 className="w-3 h-3 mr-1" />
              {speechStatus === 'listening' ? 'Écoute en cours...' : 'Traitement...'}
            </div>
          )}

          {isProcessing && (
            <div className="mt-2 text-xs text-gray-500 flex items-center">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600 mr-2"></div>
              Traduction en cours...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 