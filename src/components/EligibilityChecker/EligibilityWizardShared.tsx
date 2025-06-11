import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Globe,
  FileText,
  Loader2,
  Settings
} from 'lucide-react';
import { eligibilityService, Question, EligibilitySession, EligibilityResult, QuestionType, ValidationRules } from '../../services/eligibilityService';
import { supportedLanguages, SupportedLanguage } from '../../lib/translation';

interface EligibilityCompleteResult extends EligibilityResult {
  session?: EligibilitySession;
  report?: {
    professional: string;
    user: string;
  };
}

interface EligibilityWizardSharedProps {
  onBack?: () => void;
  onComplete?: (results: EligibilityCompleteResult) => void;
}

const EligibilityWizardShared: React.FC<EligibilityWizardSharedProps> = ({ 
  onBack, 
  onComplete 
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [session, setSession] = useState<EligibilitySession>({
    sessionId: crypto.randomUUID(),
    responses: {},
    currentQuestionIndex: 0,
    language: 'fr',
    startTime: new Date(),
    estimatedRemainingTime: 300
  });
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [showEarlyExit, setShowEarlyExit] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  // Charger les questions depuis le service
  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const questionsData = await eligibilityService.loadQuestions();
      setQuestions(questionsData);
      setCurrentQuestion(questionsData[0]);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des questions:', error);
      setLoading(false);
    }
  };

  // Traduire une question avec le service
  const translateQuestion = async (question: Question, targetLang: string): Promise<Question> => {
    if (targetLang === 'fr') return question;
    
    setTranslating(true);
    try {
      const translated = await eligibilityService.translateQuestion(question, targetLang);
      return translated;
    } finally {
      setTranslating(false);
    }
  };

  // Répondre à une question
  const handleAnswer = async (optionKey: string, optionValue: string) => {
    if (!currentQuestion) return;

    // Sauvegarder la réponse
    const newResponses = {
      ...session.responses,
      [currentQuestion.key_reponse]: optionValue
    };

    // Vérifier les conditions d'arrêt anticipé pour les questions critiques
    if (currentQuestion.key_reponse === 'q_residence_lux' && optionKey === 'opt_non') {
      setShowEarlyExit(true);
      return;
    }
    if (currentQuestion.key_reponse === 'q_sejour_legal_rnpp' && optionKey === 'opt_non') {
      setShowEarlyExit(true);
      return;
    }

    // Déterminer la prochaine question
    let nextQuestionId: string | null = null;
    
    if (currentQuestion.type_reponse === 'Nombre_Entier' || 
        currentQuestion.type_reponse === 'Montant_Euro' || 
        currentQuestion.type_reponse === 'Nombre_Personnes' ||
        currentQuestion.type_reponse === 'Selecteur_Nationalite') {
      // Pour les types numériques et sélecteurs, utiliser le branchement 'continue' ou 'default'
      nextQuestionId = currentQuestion.branchements_json?.continue || 
                      currentQuestion.branchements_json?.default || 
                      null;
    } else {
      // Pour les choix multiples, utiliser la logique de branchement existante
      nextQuestionId = currentQuestion.branchements_json?.[optionKey] || null;
    }

    // Si aucun branchement spécifique, passer à la question suivante dans l'ordre
    if (!nextQuestionId) {
      const currentIndex = questions.findIndex(q => q.id === currentQuestion.id);
      if (currentIndex < questions.length - 1) {
        nextQuestionId = questions[currentIndex + 1].id;
      }
    }

    // Calculer le temps restant estimé
    const remainingQuestions = questions.slice(session.currentQuestionIndex + 1);
    const estimatedTime = remainingQuestions.reduce((total, q) => total + (q.estimated_time_seconds || 30), 0);

    // Si pas de question suivante ou si on a fini toutes les questions
    if (!nextQuestionId || session.currentQuestionIndex + 1 >= questions.length) {
      await evaluateEligibility(newResponses);
      return;
    }

    // Trouver la prochaine question
    const nextQuestion = questions.find(q => q.id === nextQuestionId);
    if (!nextQuestion) {
      await evaluateEligibility(newResponses);
      return;
    }

    // Calculer le nouvel index
    const nextIndex = questions.findIndex(q => q.id === nextQuestionId);

    // Mettre à jour la session
    const updatedSession: EligibilitySession = {
      ...session,
      responses: newResponses,
      currentQuestionIndex: nextIndex,
      estimatedRemainingTime: estimatedTime
    };

    setSession(updatedSession);

    // Traduire et mettre à jour la question courante
    if (session.language !== 'fr') {
      const translatedQuestion = await translateQuestion(nextQuestion, session.language);
      setCurrentQuestion(translatedQuestion);
    } else {
      setCurrentQuestion(nextQuestion);
    }
  };

  // Évaluer l'éligibilité avec le service
  const evaluateEligibility = async (responses: Record<string, string>) => {
    try {
      setEvaluating(true);
      const updatedSession = { ...session, responses };
      const result = await eligibilityService.evaluateEligibility(responses);
      
      // Générer rapport bilingue
      const report = eligibilityService.generateBilingualReport(result, updatedSession, session.language);
      
      onComplete?.({ 
        ...result, 
        session: updatedSession,
        report 
      });
    } catch (error) {
      console.error('Erreur lors de l\'évaluation:', error);
    } finally {
      setEvaluating(false);
    }
  };

  // Changer de langue pour l'usager
  const changeUserLanguage = async (langCode: SupportedLanguage) => {
    if (!currentQuestion || translating) return;
    
    setSession(prev => ({ ...prev, language: langCode }));
    setShowLanguageSelector(false);
    
    // Toujours commencer par récupérer la question originale française
    const originalQuestion = questions.find(q => q.id === currentQuestion.id);
    if (!originalQuestion) return;
    
    if (langCode !== 'fr') {
      // Traduire depuis le français vers la nouvelle langue
      const translated = await translateQuestion(originalQuestion, langCode);
      setCurrentQuestion(translated);
    } else {
      // Utiliser directement la version française
      setCurrentQuestion(originalQuestion);
    }
  };

  const progressPercentage = questions.length > 0 
    ? Math.round((session.currentQuestionIndex / questions.length) * 100)
    : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Traductions pour l'en-tête selon la langue de l'usager
  const getHeaderTextForUser = (langCode: SupportedLanguage) => {
    const headerTranslations: Record<SupportedLanguage, string> = {
      'ar': 'بالنسبة لك',     // Pour vous (arabe)
      'en': 'FOR YOU',       // Pour vous (anglais)
      'fr': 'POUR VOUS',     // Pour vous (français)
      'de': 'FÜR SIE',       // Pour vous (allemand)
      'lb': 'FIR IECH',      // Pour vous (luxembourgeois)
      'pt': 'PARA VOCÊ',     // Pour vous (portugais)
      'ru': 'ДЛЯ ВАС',       // Pour vous (russe)
      'tr': 'SİZİN İÇİN',    // Pour vous (turc)
      'fa': 'برای شما',       // Pour vous (persan)
      'ur': 'آپ کے لیے',      // Pour vous (ourdou)
      'it': 'PER VOI',       // Pour vous (italien)
      'es': 'PARA USTED',    // Pour vous (espagnol)
      'nl': 'VOOR U',        // Pour vous (néerlandais)
      'pl': 'DLA PAŃSTWA',   // Pour vous (polonais)
      'ro': 'PENTRU DVS.'    // Pour vous (roumain)
    };
    
    return headerTranslations[langCode] || 'POUR VOUS';
  };

  // Nouveau composant pour le sélecteur de nationalité
  const NationalitySelector: React.FC<{
    value: string;
    onChange: (value: string) => void;
    options: Record<string, any>;
    disabled?: boolean;
  }> = ({ value, onChange, options, disabled = false }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedValue, setSelectedValue] = useState(value);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [openContinent, setOpenContinent] = useState<string | null>(null);

    // Vérifier si les options sont au bon format
    const isNewFormat = options && Object.values(options).some((opt: any) => 
      opt && typeof opt === 'object' && opt.label && opt.continent
    );

    // Grouper les pays par continent
    const groupedOptions = isNewFormat ? 
      Object.entries(options).reduce((acc, [code, data]: [string, any]) => {
        if (data && data.continent) {
          const continent = data.continent;
          if (!acc[continent]) acc[continent] = [];
          acc[continent].push({ code, ...data });
        }
        return acc;
      }, {} as Record<string, Array<{ code: string; label: string; continent: string; flag: string; eligibility: string }>>) :
      {};

    // Trier les pays par ordre alphabétique dans chaque continent
    Object.keys(groupedOptions).forEach(continent => {
      groupedOptions[continent].sort((a, b) => a.label.localeCompare(b.label, 'fr'));
    });

    // Créer une liste plate de tous les pays pour la recherche
    const allCountries = isNewFormat ? 
      Object.entries(options).map(([code, data]: [string, any]) => ({
        code,
        label: data.label,
        continent: data.continent,
        flag: data.flag,
        eligibility: data.eligibility
      })).sort((a, b) => a.label.localeCompare(b.label, 'fr')) : 
      [];

    // Filtrer les pays par terme de recherche
    const filteredCountries = allCountries.filter(country => 
      country.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.continent.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (code: string) => {
      setSelectedValue(code);
      setSearchTerm('');
      setIsDropdownOpen(false);
      setOpenContinent(null);
      onChange(code);
    };

    const toggleContinent = (continent: string) => {
      setOpenContinent(openContinent === continent ? null : continent);
    };

    const selectedOption = isNewFormat ? options[selectedValue] : null;

    // Icônes pour les continents
    const continentIcons: Record<string, string> = {
      'Europe': '🇪🇺',
      'Afrique': '🌍',
      'Asie': '🌏',
      'Amérique du Nord': '🌎',
      'Amérique du Sud': '🌎',
      'Océanie': '🌊'
    };

    // Si ce n'est pas le nouveau format, utiliser l'interface simple
    if (!isNewFormat) {
      return (
        <div className="space-y-6 w-full">
          <div className="flex flex-wrap gap-4 justify-center">
            {Object.entries(options).map(([key, value]) => (
              <button
                key={key}
                onClick={() => handleSelect(key)}
                disabled={disabled}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {value as string}
              </button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4 w-full max-w-3xl mx-auto relative">
        {/* Pays sélectionné */}
        {selectedOption && (
          <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xl">{selectedOption.flag}</span>
              <div>
                <div className="text-sm font-bold text-green-900">{selectedOption.label}</div>
                <div className="text-xs text-green-700">{selectedOption.continent}</div>
              </div>
              <div className="ml-auto">
                <div className="px-2 py-1 bg-green-500 text-white rounded-md text-xs font-medium">
                  ✅ Sélectionné
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Barre de recherche globale */}
        <div className="relative">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            🔍 Recherche rapide par nom :
          </label>
          
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <input
              type="text"
              placeholder="Tapez le nom du pays (ex: France, Allemagne, Maroc...)"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsDropdownOpen(e.target.value.length > 0);
                setOpenContinent(null); // Fermer les continents pendant la recherche
              }}
              onFocus={() => setIsDropdownOpen(searchTerm.length > 0)}
              disabled={disabled}
              className="w-full pl-10 pr-3 py-2 text-sm border border-blue-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm bg-white"
            />

            {/* Liste déroulante de recherche */}
            {isDropdownOpen && filteredCountries.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-[60] max-h-48 overflow-y-auto">
                {filteredCountries.slice(0, 15).map((country) => (
                  <button
                    key={country.code}
                    onClick={() => handleSelect(country.code)}
                    disabled={disabled}
                    className="w-full p-2 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{country.flag}</span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-sm">{country.label}</div>
                        <div className="text-xs text-gray-500">{country.continent}</div>
                      </div>
                    </div>
                  </button>
                ))}
                
                {filteredCountries.length > 15 && (
                  <div className="p-2 text-center text-xs text-gray-500 bg-gray-50">
                    Et {filteredCountries.length - 15} autres... Continuez à taper
                  </div>
                )}
              </div>
            )}

            {/* Message si aucun résultat dans la recherche */}
            {isDropdownOpen && searchTerm && filteredCountries.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-[60] p-3 text-center">
                <div className="text-gray-500 text-xs">
                  Aucun pays trouvé pour "{searchTerm}"
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Séparateur OU */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-full">OU</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        {/* Sélecteurs de continents */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            🌍 Parcourir par continent :
          </label>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(groupedOptions).map(([continent, countries]) => (
              <div key={continent} className="relative">
                <button
                  onClick={() => toggleContinent(continent)}
                  disabled={disabled}
                  className={`w-full p-3 text-left border border-gray-200 rounded-lg transition-all duration-200 ${
                    openContinent === continent
                      ? 'bg-blue-50 border-blue-400 shadow-sm'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{continentIcons[continent]}</span>
                      <div>
                        <div className="font-medium text-gray-800 text-xs">{continent}</div>
                        <div className="text-xs text-gray-500">{countries.length} pays</div>
                      </div>
                    </div>
                    <svg 
                      className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${
                        openContinent === continent ? 'rotate-180' : ''
                      }`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Menu déroulant du continent */}
                {openContinent === continent && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-[60] max-h-48 overflow-y-auto">
                    {countries.map((country) => (
                      <button
                        key={country.code}
                        onClick={() => handleSelect(country.code)}
                        disabled={disabled}
                        className="w-full p-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{country.flag}</span>
                          <span className="text-xs font-medium text-gray-800">{country.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bouton de validation si un pays est sélectionné */}
        {selectedValue && (
          <div className="text-center pt-3">
            <button
              onClick={() => onChange(selectedValue)}
              disabled={disabled || !selectedValue}
              className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              <CheckCircle2 className="w-4 h-4" />
              Valider ma nationalité
            </button>
          </div>
        )}

        {/* Fermer les dropdowns en cliquant ailleurs */}
        {(isDropdownOpen || openContinent) && (
          <div 
            className="fixed inset-0 z-[50]" 
            onClick={() => {
              setIsDropdownOpen(false);
              setOpenContinent(null);
            }}
          />
        )}
      </div>
    );
  };

  // Nouveau composant pour les questions de type nombre
  const NumberInput: React.FC<{
    value: string;
    onChange: (value: string) => void;
    validation: ValidationRules;
    disabled?: boolean;
  }> = ({ value, onChange, validation, disabled = false }) => {
    const [inputValue, setInputValue] = useState(value);
    const [isConfirmed, setIsConfirmed] = useState(false);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      
      // Permettre la saisie libre, même temporairement hors limites
      setInputValue(newValue);
      setIsConfirmed(false);
      
      // Validation en temps réel pour feedback visuel
      const numValue = parseInt(newValue);
      if (newValue === '' || (!isNaN(numValue) && numValue >= (validation.min || 0) && numValue <= (validation.max || 100))) {
        // Valeur valide ou vide
      }
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      setIsConfirmed(false);
    };

    const handleConfirm = () => {
      const numValue = parseInt(inputValue);
      if (inputValue && !isNaN(numValue) && numValue >= (validation.min || 0) && numValue <= (validation.max || 100) && !isConfirmed) {
        setIsConfirmed(true);
        onChange(inputValue);
      }
    };

    const isValid = () => {
      if (!inputValue) return false;
      const numValue = parseInt(inputValue);
      return !isNaN(numValue) && numValue >= (validation.min || 0) && numValue <= (validation.max || 100);
    };

    return (
      <div className="space-y-4 max-w-sm mx-auto">
        {/* Champ de saisie principal - TRÈS VISIBLE */}
        <div className="text-center">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Saisissez directement votre réponse :
          </label>
          <div className="relative inline-block">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                // Permettre les touches de navigation et suppression
                if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                  return;
                }
                // Permettre seulement les chiffres
                if (!/[0-9]/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              disabled={disabled}
              className={`w-24 px-4 py-3 text-xl font-bold text-center bg-white border-3 rounded-xl focus:ring-4 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${
                isValid() 
                  ? 'border-green-500 focus:border-green-600 focus:ring-green-100' 
                  : inputValue 
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                    : 'border-blue-500 focus:border-blue-600 focus:ring-blue-100'
              }`}
              placeholder="0"
            />
            {validation.unit && (
              <span className="ml-2 text-lg text-gray-700 font-semibold">{validation.unit}</span>
            )}
          </div>
          
          {/* Message de validation */}
          {inputValue && !isValid() && (
            <div className="mt-1 text-xs text-red-600">
              Valeur entre {validation.min || 0} et {validation.max || 100} {validation.unit}
            </div>
          )}
        </div>
        
        {/* OU Séparateur */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-full">OU</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>
        
        {/* Slider pour aide visuelle */}
        <div className="space-y-2">
          <label className="block text-xs text-gray-600 text-center">
            Utilisez le curseur pour vous aider :
          </label>
          <div className="px-2">
            <input
              type="range"
              min={validation.min || 0}
              max={validation.max || 100}
              step={validation.step || 1}
              value={inputValue && !isNaN(parseInt(inputValue)) ? inputValue : validation.min || 0}
              onChange={handleSliderChange}
              disabled={disabled}
              className="w-full h-3 bg-blue-200 rounded-lg appearance-none cursor-pointer slider-thumb disabled:opacity-50"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{validation.min || 0}</span>
              <span className="font-medium text-blue-600">{inputValue || 0} {validation.unit}</span>
              <span>{validation.max || 100}</span>
            </div>
          </div>
        </div>
        
        {/* Bouton de confirmation */}
        <div className="text-center pt-3">
          <button
            onClick={handleConfirm}
            disabled={disabled || !isValid() || isConfirmed}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {isConfirmed ? '✅ Confirmé' : 'Confirmer ma réponse'}
          </button>
        </div>
      </div>
    );
  };

  // Nouveau composant pour les montants en euros
  const EuroInput: React.FC<{
    value: string;
    onChange: (value: string) => void;
    validation: ValidationRules;
    disabled?: boolean;
  }> = ({ value, onChange, validation, disabled = false }) => {
    const [inputValue, setInputValue] = useState(value);
    const [isConfirmed, setIsConfirmed] = useState(false);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      
      // Permettre la saisie libre, même temporairement hors limites
      setInputValue(newValue);
      setIsConfirmed(false);
      
      // Validation en temps réel pour feedback visuel
      const numValue = parseInt(newValue);
      if (newValue === '' || (!isNaN(numValue) && numValue >= (validation.min || 0) && numValue <= (validation.max || 15000))) {
        // Valeur valide ou vide
      }
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      setIsConfirmed(false);
    };

    const handleConfirm = () => {
      const numValue = parseInt(inputValue);
      if (inputValue && !isNaN(numValue) && numValue >= (validation.min || 0) && numValue <= (validation.max || 15000) && !isConfirmed) {
        setIsConfirmed(true);
        onChange(inputValue);
      }
    };

    const isValid = () => {
      if (!inputValue) return false;
      const numValue = parseInt(inputValue);
      return !isNaN(numValue) && numValue >= (validation.min || 0) && numValue <= (validation.max || 15000);
    };

    const formatEuro = (amount: number) => {
      return new Intl.NumberFormat('fr-LU', { 
        style: 'currency', 
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    };

    return (
      <div className="space-y-4 max-w-sm mx-auto">
        {/* Champ de saisie principal - TRÈS VISIBLE */}
        <div className="text-center">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Saisissez directement le montant mensuel :
          </label>
          <div className="relative inline-block">
            <div className="flex items-center">
              <span className="text-xl text-gray-700 font-bold mr-1">€</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  // Permettre les touches de navigation et suppression
                  if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                    return;
                  }
                  // Permettre seulement les chiffres
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                disabled={disabled}
                className={`w-28 px-3 py-3 text-xl font-bold text-center bg-white border-3 rounded-xl focus:ring-4 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${
                  isValid() 
                    ? 'border-green-500 focus:border-green-600 focus:ring-green-100' 
                    : inputValue 
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                      : 'border-green-500 focus:border-green-600 focus:ring-green-100'
                }`}
                placeholder="0"
              />
              <span className="ml-1 text-sm text-gray-700 font-semibold">/mois</span>
            </div>
          </div>
          
          {/* Message de validation */}
          {inputValue && !isValid() && (
            <div className="mt-1 text-xs text-red-600">
              Montant entre {validation.min || 0}€ et {validation.max || 15000}€
            </div>
          )}
        </div>
        
        {/* Affichage du montant formaté */}
        {inputValue && parseInt(inputValue) > 0 && isValid() && (
          <div className="text-center">
            <div className="inline-block px-3 py-1 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-sm text-green-800 font-bold">
                {formatEuro(parseInt(inputValue))} par mois
              </span>
            </div>
          </div>
        )}
        
        {/* OU Séparateur */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-full">OU</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>
        
        {/* Slider pour aide visuelle */}
        <div className="space-y-2">
          <label className="block text-xs text-gray-600 text-center">
            Utilisez le curseur pour vous aider :
          </label>
          <div className="px-2">
            <input
              type="range"
              min={validation.min || 0}
              max={validation.max || 15000}
              step={validation.step || 50}
              value={inputValue && !isNaN(parseInt(inputValue)) ? inputValue : validation.min || 0}
              onChange={handleSliderChange}
              disabled={disabled}
              className="w-full h-3 bg-green-200 rounded-lg appearance-none cursor-pointer slider-thumb disabled:opacity-50"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{formatEuro(validation.min || 0)}</span>
              <span className="font-medium text-green-600">
                {inputValue && !isNaN(parseInt(inputValue)) ? formatEuro(parseInt(inputValue)) : formatEuro(0)}
              </span>
              <span>{formatEuro(validation.max || 15000)}</span>
            </div>
          </div>
        </div>
        
        {/* Bouton de confirmation */}
        <div className="text-center pt-3">
          <button
            onClick={handleConfirm}
            disabled={disabled || !isValid() || isConfirmed}
            className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-bold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {isConfirmed ? '✅ Confirmé' : 'Confirmer ma réponse'}
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des questions...</p>
        </div>
      </div>
    );
  }

  if (evaluating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Évaluation de votre éligibilité...</p>
          <p className="text-sm text-gray-500 mt-2">Analyse des aides disponibles</p>
        </div>
      </div>
    );
  }

  if (showEarlyExit) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-[24px] shadow-xl border border-gray-100/50 p-8 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Conditions non remplies
            </h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Malheureusement, vous ne remplissez pas les conditions de base (résidence au Luxembourg et titre de séjour valide) 
              pour accéder aux aides nationales luxembourgeoises. Nous vous conseillons de vous renseigner auprès de votre commune 
              pour les aides locales.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.open('https://guichet.public.lu', '_blank')}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Consulter Guichet.lu
              </button>
              <button
                onClick={onBack}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Retour
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 pt-20 pb-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header avec sélecteur de langue */}
        <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-md border border-gray-100/50 mb-4 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <div className="w-4 h-4 text-white">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H11V21H5V3H13V9H21ZM23 15V18H20V20H23V23H25V20H28V18H25V15H23ZM19 21C19 21.55 18.55 22 18 22S17 21.55 17 21 17.45 20 18 20 19 20.45 19 21Z"/>
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">AssistLux Pro</h1>
                <p className="text-xs text-gray-500">Vérification d'Éligibilité</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 rounded-lg border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs font-medium text-green-900">Active</span>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">💡 Instructions</div>
                <div className="text-xs text-gray-600">Lisez ensemble • Cliquez la réponse</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sélecteur de langue pour l'usager - Style DocumentScanner */}
        <div className="bg-gradient-to-r from-emerald-50 via-blue-50 to-indigo-50 rounded-xl p-4 border border-emerald-200/50 mb-4 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                <Globe className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-sm font-semibold text-emerald-900">Langue de rendu préférée</span>
                <div className="text-xs text-emerald-700">Pour l'usager</div>
              </div>
            </div>
            <button
              onClick={() => setShowLanguageSelector(!showLanguageSelector)}
              className="p-2 text-emerald-600 hover:text-emerald-800 hover:bg-white/50 rounded-lg transition-all duration-200"
              disabled={translating}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
          
          {showLanguageSelector ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {Object.entries(supportedLanguages).map(([code, info]) => (
                  <button
                    key={code}
                    onClick={() => changeUserLanguage(code as SupportedLanguage)}
                    disabled={translating}
                    className={`p-2 text-xs rounded-lg border-2 transition-colors duration-200 ${
                      session.language === code
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'bg-white/80 text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-white'
                    } ${translating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="text-center">
                      <div className="text-sm mb-1">{info.flag}</div>
                      <div className="font-medium leading-tight text-xs">{info.nativeName}</div>
                    </div>
                  </button>
                ))}
              </div>
              
              {translating && (
                <div className="text-center py-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/80 rounded-lg">
                    <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                    <span className="text-xs text-emerald-800">Traduction en cours...</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white/60 rounded-lg p-3 border border-white/40">
              <div className="flex items-center gap-2">
                <span className="text-lg">{supportedLanguages[session.language as keyof typeof supportedLanguages]?.flag}</span>
                <div>
                  <p className="font-medium text-emerald-900 text-sm">
                    {supportedLanguages[session.language as keyof typeof supportedLanguages]?.nativeName || supportedLanguages.fr.nativeName}
                  </p>
                  <p className="text-xs text-emerald-700">Langue sélectionnée</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-md border border-gray-100/50 mb-4 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-900">
                  Question {session.currentQuestionIndex + 1} sur {questions.length}
                </span>
                <div className="text-xs text-gray-500">Progression du questionnaire</div>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                <svg className="w-3 h-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-medium text-orange-900">
                  ~{formatTime(session.estimatedRemainingTime)} restant
                </span>
              </div>
            </div>
          </div>
          
          {/* Barre de progression améliorée */}
          <div className="relative">
            <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
              <div 
                className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-700 ease-out shadow-md relative overflow-hidden"
                style={{ width: `${progressPercentage}%` }}
              >
                {/* Effet de brillance */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
              </div>
            </div>
            <div className="absolute -top-6 transition-all duration-700 ease-out" style={{ left: `calc(${progressPercentage}% - 16px)` }}>
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                {progressPercentage}%
              </div>
            </div>
          </div>
        </div>

        {/* Question principale */}
        <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-md border border-gray-100/50 p-6 relative">
          {/* Effet de fond subtil */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30 pointer-events-none"></div>
          
          {currentQuestion && (
            <>
              <div className="text-center mb-6 relative z-10">
                {/* Icône de la question avec effet */}
                <div className="relative inline-block mb-4">
                  <div className="text-4xl filter drop-shadow-sm">{currentQuestion.icon_emoji}</div>
                </div>
                
                <div className="space-y-4">
                  {/* Section travailleur social */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200/50 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-md flex items-center justify-center">
                        <Users className="w-3 h-3 text-white" />
                      </div>
                      <h3 className="text-sm font-bold text-indigo-900">
                        POUR LE TRAVAILLEUR SOCIAL
                      </h3>
                    </div>
                    <p className="text-lg text-indigo-800 font-medium leading-relaxed">
                      {questions.find(q => q.id === currentQuestion.id)?.question}
                    </p>
                  </div>

                  {/* Section usager (si traduite) */}
                  {session.language !== 'fr' && (
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/50 rounded-xl p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-md flex items-center justify-center">
                          <Globe className="w-3 h-3 text-white" />
                        </div>
                        <h3 className="text-sm font-bold text-emerald-900">
                          {getHeaderTextForUser(session.language)} ({supportedLanguages[session.language as keyof typeof supportedLanguages]?.nativeName})
                        </h3>
                      </div>
                      <div className="text-lg text-emerald-800 font-medium leading-relaxed">
                        {translating ? (
                          <div className="flex items-center justify-center gap-2 py-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Traduction en cours...</span>
                          </div>
                        ) : (
                          currentQuestion.question
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Options de réponse */}
              <div className="flex justify-center mt-8 relative z-10 px-4 pb-8">{currentQuestion.type_reponse === 'Selecteur_Nationalite' ? (
                  <NationalitySelector
                    value={session.responses[currentQuestion.key_reponse] || ''}
                    onChange={(value) => handleAnswer('value', value)}
                    options={currentQuestion.options_json}
                    disabled={translating}
                  />
                ) : currentQuestion.type_reponse === 'Nombre_Entier' || currentQuestion.type_reponse === 'Nombre_Personnes' ? (
                  <NumberInput
                    value={session.responses[currentQuestion.key_reponse] || ''}
                    onChange={(value) => handleAnswer('value', value)}
                    validation={currentQuestion.validation_rules || {}}
                    disabled={translating}
                  />
                ) : currentQuestion.type_reponse === 'Montant_Euro' ? (
                  <EuroInput
                    value={session.responses[currentQuestion.key_reponse] || ''}
                    onChange={(value) => handleAnswer('value', value)}
                    validation={currentQuestion.validation_rules || {}}
                    disabled={translating}
                  />
                ) : (
                  // Rendu soft et professionnel pour Oui_Non et choix multiples
                  <div className="flex gap-4 justify-center flex-wrap w-full max-w-xl mx-auto">
                    {Object.entries(currentQuestion.options_json).map(([key, value]) => (
                      <button
                        key={key}
                        onClick={() => handleAnswer(key, value as string)}
                        disabled={translating}
                        className={`group relative px-8 py-3 text-base font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg min-w-[120px] ${
                          key === 'opt_oui' 
                            ? 'bg-white text-green-700 border-2 border-green-200 hover:bg-green-50 hover:border-green-300'
                            : key === 'opt_non'
                            ? 'bg-white text-red-700 border-2 border-red-200 hover:bg-red-50 hover:border-red-300'
                            : 'bg-white text-blue-700 border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          {key === 'opt_oui' && (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          )}
                          {key === 'opt_non' && (
                            <AlertCircle className="w-4 h-4 text-red-600" />
                          )}
                          {!['opt_oui', 'opt_non'].includes(key) && (
                            <div className="w-4 h-4 rounded-full border-2 border-current"></div>
                          )}
                          <span>{value as string}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer avec navigation */}
        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={onBack}
            className="group flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-800 bg-white/60 hover:bg-white/80 rounded-xl transition-all duration-300 backdrop-blur-sm border border-gray-200/50 hover:border-gray-300/50 shadow-md hover:shadow-lg"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="font-medium">Retour</span>
          </button>
          
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200/50 shadow-sm">
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-xs font-medium text-green-900">
                Vos réponses ne sont PAS sauvées
              </span>
              <span className="text-xs text-green-700">
                Respect total de la vie privée
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EligibilityWizardShared; 