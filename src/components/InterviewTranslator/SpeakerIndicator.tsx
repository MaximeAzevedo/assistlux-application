import React from 'react';
import { Users, Mic, MicOff, Volume2 } from 'lucide-react';
import { SpeakerRole } from '../../types/interviewTranslator';

interface SpeakerIndicatorProps {
  role: SpeakerRole;
  language: string;
  isActive: boolean;
  isListening: boolean;
  isTranslating: boolean;
  onClick: () => void;
  qualityScore: number;
}

const SpeakerIndicator: React.FC<SpeakerIndicatorProps> = ({
  role,
  language,
  isActive,
  isListening,
  isTranslating,
  onClick,
  qualityScore
}) => {
  const getLanguageFlag = (lang: string): string => {
    const flags: Record<string, string> = {
      'fr': '🇫🇷',
      'ar': '🇸🇦',
      'en': '🇬🇧',
      'de': '🇩🇪',
      'es': '🇪🇸',
      'it': '🇮🇹',
      'pt': '🇵🇹',
      'ru': '🇷🇺',
      'tr': '🇹🇷',
      'nl': '🇳🇱',
      'pl': '🇵🇱',
      'ro': '🇷🇴',
      'fa': '🇮🇷',
      'ur': '🇵🇰'
    };
    return flags[lang] || '🌐';
  };

  const getLanguageName = (lang: string): string => {
    const names: Record<string, string> = {
      'fr': 'Français',
      'ar': 'العربية',
      'en': 'English',
      'de': 'Deutsch',
      'es': 'Español',
      'it': 'Italiano',
      'pt': 'Português',
      'ru': 'Русский',
      'tr': 'Türkçe',
      'nl': 'Nederlands',
      'pl': 'Polski',
      'ro': 'Română',
      'fa': 'فارسی',
      'ur': 'اردو'
    };
    return names[lang] || lang;
  };

  const getRoleName = (role: SpeakerRole): string => {
    return role === 'assistant' ? 'Assistant social' : 'Usager';
  };

  const getStatusText = (): string => {
    if (isListening) return 'En écoute...';
    if (isTranslating) return 'Traduction...';
    if (isActive) return 'Actif';
    return 'En attente';
  };

  const getStatusColor = (): string => {
    if (isListening) return 'text-green-600';
    if (isTranslating) return 'text-blue-600';
    if (isActive) return 'text-purple-600';
    return 'text-gray-500';
  };

  const getBorderColor = (): string => {
    if (isListening) return 'border-green-500 shadow-green-200';
    if (isTranslating) return 'border-blue-500 shadow-blue-200';
    if (isActive) return 'border-purple-500 shadow-purple-200';
    return 'border-gray-200';
  };

  return (
    <button
      onClick={onClick}
      className={`
        w-full p-6 rounded-xl border-2 transition-all duration-300 transform hover:scale-[1.02]
        ${getBorderColor()} ${isActive ? 'shadow-lg' : 'shadow-sm'}
        ${isActive ? 'bg-white' : 'bg-gray-50 hover:bg-white'}
      `}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`
            w-12 h-12 rounded-full flex items-center justify-center
            ${role === 'assistant' ? 'bg-purple-100' : 'bg-blue-100'}
          `}>
            <Users className={`w-6 h-6 ${role === 'assistant' ? 'text-purple-600' : 'text-blue-600'}`} />
          </div>
          
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">
              {getRoleName(role)}
            </h3>
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <span className="text-lg">{getLanguageFlag(language)}</span>
              {getLanguageName(language)}
            </p>
          </div>
        </div>

        {/* Indicateur d'état */}
        <div className="flex flex-col items-center gap-1">
          {isListening ? (
            <div className="relative">
              <Mic className="w-6 h-6 text-green-600" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          ) : isTranslating ? (
            <Volume2 className="w-6 h-6 text-blue-600 animate-pulse" />
          ) : (
            <MicOff className="w-6 h-6 text-gray-400" />
          )}
        </div>
      </div>

      {/* Statut et qualité */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
          
          {qualityScore > 0 && (
            <span className="text-xs text-gray-500">
              Qualité: {Math.round(qualityScore)}%
            </span>
          )}
        </div>

        {/* Barre de progression pour la qualité */}
        {qualityScore > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                qualityScore >= 80 ? 'bg-green-500' :
                qualityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${qualityScore}%` }}
            ></div>
          </div>
        )}
      </div>

      {/* Animation de pulsation pour l'écoute */}
      {isListening && (
        <div className="absolute inset-0 rounded-xl border-2 border-green-400 animate-pulse opacity-50 pointer-events-none"></div>
      )}
    </button>
  );
};

export default SpeakerIndicator; 