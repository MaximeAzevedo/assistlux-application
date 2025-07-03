import React from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { ALL_LANGUAGES, LanguageOption } from './LanguageSelector';

interface SimpleLanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (languageCode: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const SimpleLanguageSelector: React.FC<SimpleLanguageSelectorProps> = ({
  selectedLanguage,
  onLanguageChange,
  disabled = false,
  placeholder = "Choisir une langue"
}) => {
  const selectedLang = ALL_LANGUAGES.find(lang => lang.code === selectedLanguage);

  // Langues triées par popularité puis alphabétiquement
  const sortedLanguages = ALL_LANGUAGES.sort((a, b) => {
    // D'abord par popularité
    const popularityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
    if (a.popularity !== b.popularity) {
      return popularityOrder[a.popularity] - popularityOrder[b.popularity];
    }
    // Puis alphabétiquement
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="relative">
      <select
        value={selectedLanguage}
        onChange={(e) => onLanguageChange(e.target.value)}
        disabled={disabled}
        className={`appearance-none w-full px-4 py-3 pr-10 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'
        }`}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        
        {/* Langues populaires d'abord */}
        <optgroup label="🔥 Langues les plus demandées">
          {sortedLanguages
            .filter(lang => lang.popularity === 'high')
            .map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name} ({lang.nativeName})
              </option>
            ))
          }
        </optgroup>
        
        {/* Autres langues européennes */}
        <optgroup label="🇪🇺 Autres langues européennes">
          {sortedLanguages
            .filter(lang => 
              lang.popularity !== 'high' && 
              (lang.region === 'Europe' || lang.region === 'Europe du Nord' || lang.region === 'Europe de l\'Est' || lang.region === 'Eurasie')
            )
            .map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name} ({lang.nativeName})
              </option>
            ))
          }
        </optgroup>
        
        {/* Langues du monde */}
        <optgroup label="🌍 Langues du monde">
          {sortedLanguages
            .filter(lang => 
              lang.popularity !== 'high' && 
              !['Europe', 'Europe du Nord', 'Europe de l\'Est', 'Eurasie'].includes(lang.region)
            )
            .map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name} ({lang.nativeName})
              </option>
            ))
          }
        </optgroup>
      </select>
      
      {/* Icône personnalisée */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </div>
      
      {/* Affichage de la langue sélectionnée avec drapeaux */}
      {selectedLang && (
        <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600">
          <Globe className="h-4 w-4" />
          <span>
            Langue sélectionnée : <strong>{selectedLang.flag} {selectedLang.name}</strong>
          </span>
          {selectedLang.quality === 'hd' && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Qualité HD
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default SimpleLanguageSelector; 