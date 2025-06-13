import React, { useState, useEffect } from 'react';
import { Languages, X } from 'lucide-react';
import { LiveTranslator } from './LiveTranslator';
import { azureSpeechService } from '../services/azureSpeechService';

interface FloatingTranslatorProps {
  defaultLanguages?: {
    assistant: string;
    user: string;
  };
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const FloatingTranslator: React.FC<FloatingTranslatorProps> = ({
  defaultLanguages = { assistant: 'fr', user: 'ar' },
  position = 'bottom-left'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [azureSpeechAvailable, setAzureSpeechAvailable] = useState(false);

  // Vérifier la disponibilité d'Azure Speech Services
  useEffect(() => {
    const available = azureSpeechService.isAvailable();
    setAzureSpeechAvailable(available);
    console.log('🔍 Azure Speech disponible:', available);
  }, []);

  const positionClasses = {
    'bottom-right': 'bottom-6 right-24',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  const handleClick = () => {
    console.log('Bouton traduction cliqué - État actuel:', isOpen);
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Bouton flottant premium - toujours visible */}
      <div className={`fixed ${positionClasses[position]} z-[60]`}>
        <button
          onClick={handleClick}
          className="bg-gradient-to-r from-[#7F00FF] to-[#E100FF] hover:from-[#6A00D6] hover:to-[#C71585] text-white p-4 rounded-full shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl group relative cursor-pointer backdrop-blur-sm"
          title={isOpen ? "Fermer traducteur" : "Ouvrir traducteur"}
        >
          <Languages className="w-6 h-6" />
          
          {/* Badge professionnel */}
          <div className="absolute -top-1 -right-1 bg-white text-purple-600 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg pointer-events-none">
            {azureSpeechAvailable ? 'AI' : 'T'}
          </div>
          
          {/* Tooltip élégant */}
          <div className="absolute bottom-full left-0 mb-3 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl pointer-events-none">
            {isOpen ? "Fermer traducteur" : "Traduction temps réel"}
            <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </button>
      </div>

      {/* Modal de traduction */}
      <LiveTranslator
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        defaultLanguages={defaultLanguages}
      />
    </>
  );
}; 