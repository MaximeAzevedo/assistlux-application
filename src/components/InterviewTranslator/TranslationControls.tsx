import React from 'react';
import { 
  Mic, 
  MicOff, 
  Pause, 
  Play, 
  Square, 
  RotateCcw,
  Users
} from 'lucide-react';
import { SpeakerRole } from '../../types/interviewTranslator';

interface TranslationControlsProps {
  isListening: boolean;
  isTranslating: boolean;
  currentSpeaker: SpeakerRole;
  onStartListening: () => void;
  onStopListening: () => void;
  onSwitchSpeaker: () => void;
  onPauseSession: () => void;
  onResumeSession: () => void;
  onEndSession: () => void;
}

const TranslationControls: React.FC<TranslationControlsProps> = ({
  isListening,
  isTranslating,
  currentSpeaker,
  onStartListening,
  onStopListening,
  onSwitchSpeaker,
  onPauseSession,
  onResumeSession,
  onEndSession
}) => {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-xl p-6 border border-gray-100/50">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Mic className="w-5 h-5" />
        Contrôles de traduction
      </h3>

      {/* Contrôle principal du microphone */}
      <div className="flex justify-center mb-6">
        <button
          onClick={isListening ? onStopListening : onStartListening}
          disabled={isTranslating}
          className={`
            w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 transform
            ${isListening 
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200 scale-110' 
              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-xl text-white shadow-lg'
            }
            ${isTranslating ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
          `}
        >
          {isListening ? (
            <div className="relative">
              <MicOff className="w-8 h-8" />
              <div className="absolute inset-0 rounded-full border-2 border-white animate-ping"></div>
            </div>
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </button>
      </div>

      {/* Indicateur de statut */}
      <div className="text-center mb-6">
        {isTranslating ? (
          <div className="flex items-center justify-center gap-2 text-blue-600">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            <span className="ml-2 font-medium">Traduction en cours...</span>
          </div>
        ) : isListening ? (
          <div className="flex items-center justify-center gap-2 text-green-600">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-medium">En écoute - {currentSpeaker === 'assistant' ? 'Assistant social' : 'Usager'}</span>
          </div>
        ) : (
          <p className="text-gray-600">Cliquez sur le microphone pour commencer</p>
        )}
      </div>

      {/* Contrôles secondaires */}
      <div className="grid grid-cols-2 gap-3">
        {/* Changer de locuteur */}
        <button
          onClick={onSwitchSpeaker}
          disabled={isListening || isTranslating}
          className={`
            px-4 py-3 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors
            flex items-center justify-center gap-2 text-sm font-medium
            ${(isListening || isTranslating) ? 'opacity-50 cursor-not-allowed' : 'hover:border-purple-300'}
          `}
        >
          <RotateCcw className="w-4 h-4" />
          Changer locuteur
        </button>

        {/* Terminer session */}
        <button
          onClick={onEndSession}
          disabled={isListening || isTranslating}
          className={`
            px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors
            flex items-center justify-center gap-2 text-sm font-medium
            ${(isListening || isTranslating) ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <Square className="w-4 h-4" />
          Terminer
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2">💡 Instructions</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Parlez clairement et distinctement</li>
          <li>• Attendez la fin de la traduction avant de continuer</li>
          <li>• Changez de locuteur après chaque intervention</li>
          <li>• La qualité s'améliore avec des phrases courtes</li>
        </ul>
      </div>
    </div>
  );
};

export default TranslationControls; 