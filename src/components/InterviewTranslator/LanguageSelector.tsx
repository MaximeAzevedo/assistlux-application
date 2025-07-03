import React, { useState, useMemo } from 'react';
import { Search, Globe, Mic, Star, Volume2 } from 'lucide-react';

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  region: string;
  quality: 'hd' | 'standard';
  popularity: 'high' | 'medium' | 'low';
  voiceCount: number;
  azureVoiceCode: string;
  sampleText: string;
}

// Base de données complète des langues supportées (UNIQUEMENT celles OFFICIELLEMENT supportées par Azure Speech Services 2025)
export const ALL_LANGUAGES: LanguageOption[] = [
  // Langues européennes majeures (Haute demande - CONFIRMÉES Azure 2025)
  { 
    code: 'fr', name: 'Français', nativeName: 'Français', flag: '🇫🇷', 
    region: 'Europe', quality: 'hd', popularity: 'high', voiceCount: 8,
    azureVoiceCode: 'fr-FR-DeniseNeural', sampleText: 'Bonjour, comment allez-vous ?'
  },
  { 
    code: 'en', name: 'Anglais', nativeName: 'English', flag: '🇬🇧', 
    region: 'Europe', quality: 'hd', popularity: 'high', voiceCount: 12,
    azureVoiceCode: 'en-US-AriaNeural', sampleText: 'Hello, how are you today?'
  },
  { 
    code: 'es', name: 'Espagnol', nativeName: 'Español', flag: '🇪🇸', 
    region: 'Europe', quality: 'hd', popularity: 'high', voiceCount: 10,
    azureVoiceCode: 'es-ES-ElviraNeural', sampleText: 'Hola, ¿cómo está usted?'
  },
  { 
    code: 'de', name: 'Allemand', nativeName: 'Deutsch', flag: '🇩🇪', 
    region: 'Europe', quality: 'hd', popularity: 'high', voiceCount: 9,
    azureVoiceCode: 'de-DE-KatjaNeural', sampleText: 'Hallo, wie geht es Ihnen?'
  },
  { 
    code: 'it', name: 'Italien', nativeName: 'Italiano', flag: '🇮🇹', 
    region: 'Europe', quality: 'hd', popularity: 'high', voiceCount: 7,
    azureVoiceCode: 'it-IT-ElsaNeural', sampleText: 'Ciao, come sta?'
  },
  { 
    code: 'pt', name: 'Portugais', nativeName: 'Português', flag: '🇵🇹', 
    region: 'Europe', quality: 'hd', popularity: 'high', voiceCount: 6,
    azureVoiceCode: 'pt-PT-RaquelNeural', sampleText: 'Olá, como está?'
  },
  { 
    code: 'nl', name: 'Néerlandais', nativeName: 'Nederlands', flag: '🇳🇱', 
    region: 'Europe', quality: 'hd', popularity: 'medium', voiceCount: 5,
    azureVoiceCode: 'nl-NL-ColetteNeural', sampleText: 'Hallo, hoe gaat het met u?'
  },
  { 
    code: 'pl', name: 'Polonais', nativeName: 'Polski', flag: '🇵🇱', 
    region: 'Europe', quality: 'hd', popularity: 'medium', voiceCount: 4,
    azureVoiceCode: 'pl-PL-ZofiaNeural', sampleText: 'Dzień dobry, jak się Pan ma?'
  },
  { 
    code: 'ro', name: 'Roumain', nativeName: 'Română', flag: '🇷🇴', 
    region: 'Europe', quality: 'hd', popularity: 'medium', voiceCount: 3,
    azureVoiceCode: 'ro-RO-AlinaNeural', sampleText: 'Bună ziua, cum vă simțiți?'
  },
  { 
    code: 'ru', name: 'Russe', nativeName: 'Русский', flag: '🇷🇺', 
    region: 'Europe de l\'Est', quality: 'hd', popularity: 'high', voiceCount: 6,
    azureVoiceCode: 'ru-RU-SvetlanaNeural', sampleText: 'Здравствуйте, как дела?'
  },
  { 
    code: 'tr', name: 'Turc', nativeName: 'Türkçe', flag: '🇹🇷', 
    region: 'Eurasie', quality: 'hd', popularity: 'medium', voiceCount: 4,
    azureVoiceCode: 'tr-TR-EmelNeural', sampleText: 'Merhaba, nasılsınız?'
  },

  // Langues du Moyen-Orient (CONFIRMÉES Azure 2025)
  { 
    code: 'ar', name: 'Arabe', nativeName: 'العربية', flag: '🇸🇦', 
    region: 'Moyen-Orient', quality: 'hd', popularity: 'high', voiceCount: 8,
    azureVoiceCode: 'ar-SA-ZariyahNeural', sampleText: 'مرحباً، كيف حالك؟'
  },
  { 
    code: 'fa', name: 'Persan', nativeName: 'فارسی', flag: '🇮🇷', 
    region: 'Moyen-Orient', quality: 'hd', popularity: 'medium', voiceCount: 3,
    azureVoiceCode: 'fa-IR-DilaraNeural', sampleText: 'سلام، چطوری؟'
  },
  { 
    code: 'ur', name: 'Ourdou', nativeName: 'اردو', flag: '🇵🇰', 
    region: 'Asie du Sud', quality: 'hd', popularity: 'medium', voiceCount: 4,
    azureVoiceCode: 'ur-PK-UzmaNeural', sampleText: 'السلام علیکم، آپ کیسے ہیں؟'
  },
  { 
    code: 'he', name: 'Hébreu', nativeName: 'עברית', flag: '🇮🇱', 
    region: 'Moyen-Orient', quality: 'hd', popularity: 'medium', voiceCount: 3,
    azureVoiceCode: 'he-IL-HilaNeural', sampleText: 'שלום, איך הולך?'
  },

  // Langues d'Asie (CONFIRMÉES Azure 2025)
  { 
    code: 'zh', name: 'Chinois', nativeName: '中文', flag: '🇨🇳', 
    region: 'Asie', quality: 'hd', popularity: 'high', voiceCount: 10,
    azureVoiceCode: 'zh-CN-XiaoxiaoNeural', sampleText: '你好，你好吗？'
  },
  { 
    code: 'ja', name: 'Japonais', nativeName: '日本語', flag: '🇯🇵', 
    region: 'Asie', quality: 'hd', popularity: 'medium', voiceCount: 8,
    azureVoiceCode: 'ja-JP-NanamiNeural', sampleText: 'こんにちは、元気ですか？'
  },
  { 
    code: 'ko', name: 'Coréen', nativeName: '한국어', flag: '🇰🇷', 
    region: 'Asie', quality: 'hd', popularity: 'medium', voiceCount: 6,
    azureVoiceCode: 'ko-KR-SunHiNeural', sampleText: '안녕하세요, 어떻게 지내세요?'
  },
  { 
    code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', 
    region: 'Asie du Sud', quality: 'hd', popularity: 'medium', voiceCount: 5,
    azureVoiceCode: 'hi-IN-SwaraNeural', sampleText: 'नमस्ते, आप कैसे हैं?'
  },
  { 
    code: 'th', name: 'Thaï', nativeName: 'ไทย', flag: '🇹🇭', 
    region: 'Asie du Sud-Est', quality: 'hd', popularity: 'low', voiceCount: 4,
    azureVoiceCode: 'th-TH-PremwadeeNeural', sampleText: 'สวัสดี คุณเป็นอย่างไรบ้าง?'
  },
  { 
    code: 'vi', name: 'Vietnamien', nativeName: 'Tiếng Việt', flag: '🇻🇳', 
    region: 'Asie du Sud-Est', quality: 'hd', popularity: 'low', voiceCount: 3,
    azureVoiceCode: 'vi-VN-HoaiMyNeural', sampleText: 'Xin chào, bạn có khỏe không?'
  },

  // Langues des Amériques (CONFIRMÉES Azure 2025)
  { 
    code: 'pt-br', name: 'Portugais Brésilien', nativeName: 'Português (Brasil)', flag: '🇧🇷', 
    region: 'Amériques', quality: 'hd', popularity: 'high', voiceCount: 8,
    azureVoiceCode: 'pt-BR-FranciscaNeural', sampleText: 'Olá, como você está?'
  },
  { 
    code: 'es-mx', name: 'Espagnol Mexicain', nativeName: 'Español (México)', flag: '🇲🇽', 
    region: 'Amériques', quality: 'hd', popularity: 'high', voiceCount: 6,
    azureVoiceCode: 'es-MX-DaliaNeural', sampleText: 'Hola, ¿cómo está usted?'
  },

  // Langues nordiques (CONFIRMÉES Azure 2025)
  { 
    code: 'sv', name: 'Suédois', nativeName: 'Svenska', flag: '🇸🇪', 
    region: 'Europe du Nord', quality: 'hd', popularity: 'low', voiceCount: 4,
    azureVoiceCode: 'sv-SE-SofieNeural', sampleText: 'Hej, hur mår du?'
  },
  { 
    code: 'no', name: 'Norvégien', nativeName: 'Norsk', flag: '🇳🇴', 
    region: 'Europe du Nord', quality: 'hd', popularity: 'low', voiceCount: 3,
    azureVoiceCode: 'nb-NO-PernilleNeural', sampleText: 'Hei, hvordan har du det?'
  },
  { 
    code: 'da', name: 'Danois', nativeName: 'Dansk', flag: '🇩🇰', 
    region: 'Europe du Nord', quality: 'hd', popularity: 'low', voiceCount: 3,
    azureVoiceCode: 'da-DK-ChristelNeural', sampleText: 'Hej, hvordan har du det?'
  }
];

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (languageCode: string) => void;
  disabled?: boolean;
  mode: 'assistant' | 'user';
  onPlaySample?: (language: LanguageOption) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onLanguageChange,
  disabled = false,
  mode,
  onPlaySample
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [showPopularOnly, setShowPopularOnly] = useState(false);
  const [showHDOnly, setShowHDOnly] = useState(false);

  // Filtrage et groupement des langues
  const filteredLanguages = useMemo(() => {
    let filtered = ALL_LANGUAGES.filter(lang => {
      // Filtrage par texte de recherche
      const matchesSearch = searchTerm === '' || 
        lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lang.nativeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lang.code.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtrage par région
      const matchesRegion = selectedRegion === 'all' || lang.region === selectedRegion;

      // Filtrage par popularité
      const matchesPopularity = !showPopularOnly || lang.popularity === 'high';

      // Filtrage par qualité HD
      const matchesQuality = !showHDOnly || lang.quality === 'hd';

      return matchesSearch && matchesRegion && matchesPopularity && matchesQuality;
    });

    // Groupement par région
    const grouped = filtered.reduce((acc, lang) => {
      if (!acc[lang.region]) {
        acc[lang.region] = [];
      }
      acc[lang.region].push(lang);
      return acc;
    }, {} as Record<string, LanguageOption[]>);

    // Tri des langues dans chaque région (popularité puis alphabétique)
    Object.keys(grouped).forEach(region => {
      grouped[region].sort((a, b) => {
        if (a.popularity !== b.popularity) {
          const popularityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
          return popularityOrder[a.popularity] - popularityOrder[b.popularity];
        }
        return a.name.localeCompare(b.name);
      });
    });

    return grouped;
  }, [searchTerm, selectedRegion, showPopularOnly, showHDOnly]);

  const regions = useMemo(() => {
    const allRegions = [...new Set(ALL_LANGUAGES.map(lang => lang.region))].sort();
    return allRegions;
  }, []);

  const selectedLangInfo = ALL_LANGUAGES.find(lang => lang.code === selectedLanguage);

  const handleLanguageSelect = (langCode: string) => {
    onLanguageChange(langCode);
  };

  const getQualityBadge = (quality: 'hd' | 'standard') => {
    if (quality === 'hd') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border border-blue-200">
          <Star className="w-3 h-3 mr-1" />
          HD
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        Standard
      </span>
    );
  };

  const getPopularityIndicator = (popularity: 'high' | 'medium' | 'low') => {
    const colors = {
      high: 'text-green-500',
      medium: 'text-yellow-500', 
      low: 'text-gray-400'
    };
    
    return (
      <div className={`flex space-x-0.5 ${colors[popularity]}`}>
        {[1, 2, 3].map(i => (
          <div key={i} className={`w-1 h-4 rounded-full ${
            i <= (popularity === 'high' ? 3 : popularity === 'medium' ? 2 : 1) 
              ? 'bg-current' 
              : 'bg-gray-200'
          }`} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Sélection actuelle */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            {mode === 'assistant' ? '👨‍💼 Langue de l\'assistant social' : '👤 Langue de l\'usager'}
          </label>
          {selectedLangInfo && (
            <div className="flex items-center space-x-2">
              {getQualityBadge(selectedLangInfo.quality)}
              <span className="text-xs text-gray-500">
                {selectedLangInfo.voiceCount} voix
              </span>
            </div>
          )}
        </div>
        
        {selectedLangInfo && (
          <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
            <span className="text-2xl">{selectedLangInfo.flag}</span>
            <div className="flex-1">
              <div className="font-medium text-gray-900">{selectedLangInfo.name}</div>
              <div className="text-sm text-gray-600">{selectedLangInfo.nativeName}</div>
              <div className="text-xs text-gray-500 mt-1">
                {selectedLangInfo.region} • {selectedLangInfo.sampleText}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getPopularityIndicator(selectedLangInfo.popularity)}
              {onPlaySample && (
                <button
                  onClick={() => onPlaySample(selectedLangInfo)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Écouter un échantillon"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Interface de recherche et filtres */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
          <Globe className="w-5 h-5 text-blue-600" />
          <span>Choisir une langue ({Object.values(filteredLanguages).flat().length} disponibles)</span>
        </h3>

        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher une langue..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-4">
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">🌍 Toutes les régions</option>
            {regions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showPopularOnly}
              onChange={(e) => setShowPopularOnly(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">🔥 Langues populaires seulement</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showHDOnly}
              onChange={(e) => setShowHDOnly(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">✨ Qualité HD seulement</span>
          </label>
        </div>

        {/* Liste des langues groupées par région */}
        <div className="max-h-96 overflow-y-auto space-y-6">
          {Object.entries(filteredLanguages).map(([region, languages]) => (
            <div key={region}>
              <h4 className="font-medium text-gray-800 mb-3 sticky top-0 bg-white pb-2 border-b border-gray-100">
                📍 {region} ({languages.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {languages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang.code)}
                    disabled={disabled}
                    className={`p-3 text-left border rounded-lg transition-all duration-200 hover:shadow-md ${
                      lang.code === selectedLanguage
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{lang.flag}</span>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{lang.name}</div>
                          <div className="text-xs text-gray-600">{lang.nativeName}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getPopularityIndicator(lang.popularity)}
                        <div className="flex items-center space-x-1">
                          {lang.quality === 'hd' && <Star className="w-3 h-3 text-blue-500" />}
                          <Mic className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{lang.voiceCount}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {Object.keys(filteredLanguages).length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Aucune langue trouvée</p>
            <p className="text-sm">Essayez de modifier vos critères de recherche</p>
          </div>
        )}
      </div>

      {/* Légende */}
      <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium">Légende :</span>
          <span>🔥 = Haute demande • ✨ = Qualité HD • 📍 = Région géographique</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className="flex space-x-0.5">
              <div className="w-1 h-3 bg-green-500 rounded-full"></div>
              <div className="w-1 h-3 bg-green-500 rounded-full"></div>
              <div className="w-1 h-3 bg-green-500 rounded-full"></div>
            </div>
            <span>Haute popularité</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="flex space-x-0.5">
              <div className="w-1 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-1 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-1 h-3 bg-gray-200 rounded-full"></div>
            </div>
            <span>Moyenne</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="flex space-x-0.5">
              <div className="w-1 h-3 bg-gray-400 rounded-full"></div>
              <div className="w-1 h-3 bg-gray-200 rounded-full"></div>
              <div className="w-1 h-3 bg-gray-200 rounded-full"></div>
            </div>
            <span>Faible</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelector; 