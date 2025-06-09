import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2,
  User,
  Euro,
  FileText,
  Upload,
  Sparkles,
  Loader2
} from 'lucide-react';
import SmartDocumentUpload from '../DocumentScanner/SmartDocumentUpload';
import { DocumentScanResult } from '../../services/DocumentScannerService';
import { FormConfigService, ConfigAide, Etape, ChampFormulaire, Document } from '../../services/FormConfigService';

interface FormData {
  [key: string]: any;
}

const AideLogementWizard: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Configuration chargée depuis Supabase
  const [aide, setAide] = useState<ConfigAide | null>(null);
  const [etapes, setEtapes] = useState<Etape[]>([]);
  const [champsParEtape, setChampsParEtape] = useState<Record<number, ChampFormulaire[]>>({});
  const [documents, setDocuments] = useState<Document[]>([]);
  
  // Données du formulaire dynamique
  const [formData, setFormData] = useState<FormData>({});
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());
  const [documentsValides, setDocumentsValides] = useState<Record<string, boolean>>({});

  const formConfigService = FormConfigService.getInstance();

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger la configuration complète de l'aide au logement (ID = 1)
      const config = await formConfigService.getConfigurationAide(1);
      
      console.log('🏠 Configuration aide au logement chargée:', config);

      setAide(config.aide);
      setEtapes(config.etapes);
      setDocuments(config.documents);

      // Charger les champs pour chaque étape
      const champsMap: Record<number, ChampFormulaire[]> = {};
      for (const etape of config.etapes) {
        const champs = await formConfigService.getChampsEtape(etape.id);
        champsMap[etape.id] = champs;
      }
      setChampsParEtape(champsMap);

      // Initialiser formData avec des valeurs par défaut
      const initialData: FormData = {};
      Object.values(champsMap).flat().forEach(champ => {
        if (champ.type_champ === 'number') {
          initialData[champ.nom_champ] = 0;
        } else if (champ.type_champ === 'checkbox') {
          initialData[champ.nom_champ] = false;
        } else {
          initialData[champ.nom_champ] = '';
        }
      });
      setFormData(initialData);

    } catch (err) {
      console.error('❌ Erreur lors du chargement de la configuration:', err);
      setError('Erreur lors du chargement de la configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 1) {
      navigate('/effectuer-demarche');
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (currentStep < etapes.length + 1) { // +1 pour l'étape de récapitulatif
      setCurrentStep(currentStep + 1);
    }
  };

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  // Fonction appelée quand le scanner extrait des données
  const handleDataExtracted = (extractedData: Record<string, any>) => {
    console.log('🎯 Données reçues du scanner:', extractedData);
    
    const updates: Partial<FormData> = {};
    const newAutoFilledFields = new Set(autoFilledFields);

    // Mapper les données extraites vers le formulaire
    Object.entries(extractedData).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        updates[key] = value;
        newAutoFilledFields.add(key);
      }
    });

    if (Object.keys(updates).length > 0) {
      updateFormData(updates);
      setAutoFilledFields(newAutoFilledFields);
      
      console.log(`✨ ${Object.keys(updates).length} champs pré-remplis automatiquement !`);
    }
  };

  const handleDocumentValidation = (documentType: string, isValid: boolean, result: DocumentScanResult) => {
    setDocumentsValides(prev => ({
      ...prev,
      [documentType]: isValid
    }));
  };

  const renderFieldWithAutoFill = (champ: ChampFormulaire) => {
    const isAutoFilled = autoFilledFields.has(champ.nom_champ);
    const value = formData[champ.nom_champ] || '';
    
    return (
      <div key={champ.id} className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {champ.label_fr}
          {champ.obligatoire && <span className="text-red-500 ml-1">*</span>}
          {isAutoFilled && (
            <span className="ml-2 inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
              <Sparkles className="w-3 h-3" />
              Pré-rempli automatiquement
            </span>
          )}
        </label>
        
        {champ.type_champ === 'select' && champ.options_select ? (
          <select
            value={value}
            onChange={(e) => updateFormData({ [champ.nom_champ]: e.target.value })}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              isAutoFilled ? 'bg-green-50 border-green-300' : 'border-gray-300'
            }`}
          >
            <option value="">Sélectionnez...</option>
            {champ.options_select.map((option: string) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        ) : champ.type_champ === 'number' ? (
          <input
            type="number"
            value={value}
            onChange={(e) => updateFormData({ [champ.nom_champ]: parseFloat(e.target.value) || 0 })}
            placeholder={champ.placeholder_fr || ''}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              isAutoFilled ? 'bg-green-50 border-green-300' : 'border-gray-300'
            }`}
          />
        ) : champ.type_champ === 'textarea' ? (
          <textarea
            value={value}
            onChange={(e) => updateFormData({ [champ.nom_champ]: e.target.value })}
            placeholder={champ.placeholder_fr || ''}
            rows={3}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              isAutoFilled ? 'bg-green-50 border-green-300' : 'border-gray-300'
            }`}
          />
        ) : champ.type_champ === 'checkbox' ? (
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id={champ.nom_champ}
              checked={value}
              onChange={(e) => updateFormData({ [champ.nom_champ]: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor={champ.nom_champ} className="text-sm font-medium text-gray-700">
              {champ.label_fr}
            </label>
          </div>
        ) : (
          <input
            type={champ.type_champ}
            value={value}
            onChange={(e) => updateFormData({ [champ.nom_champ]: e.target.value })}
            placeholder={champ.placeholder_fr || ''}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              isAutoFilled ? 'bg-green-50 border-green-300' : 'border-gray-300'
            }`}
          />
        )}
      </div>
    );
  };

  const renderStep = () => {
    if (currentStep <= etapes.length) {
      const etape = etapes[currentStep - 1];
      const champs = champsParEtape[etape.id] || [];
      
      // Déterminer le type de scanner selon l'étape
      const getDocumentTypeForStep = (stepIndex: number) => {
        switch (stepIndex) {
          case 1: return 'piece_identite';
          case 2: return 'justificatif_revenus';
          case 3: return 'contrat_bail';
          case 4: return 'justificatif_domicile';
          default: return null;
        }
      };

      const documentType = getDocumentTypeForStep(currentStep);

      return (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
              {currentStep === 1 && <User className="w-6 h-6 text-blue-600" />}
              {currentStep === 2 && <Euro className="w-6 h-6 text-blue-600" />}
              {currentStep === 3 && <Home className="w-6 h-6 text-blue-600" />}
              {currentStep === 4 && <FileText className="w-6 h-6 text-blue-600" />}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {etape.nom_etape}
            </h2>
            <p className="text-gray-600">
              {etape.description}
            </p>
          </div>

          {/* Scanner de documents si applicable */}
          {documentType && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-900 mb-3">
                📷 Scanner votre document
              </h3>
              <SmartDocumentUpload
                expectedDocumentType={documentType}
                documentName={`Document pour ${etape.nom_etape}`}
                onDataExtracted={handleDataExtracted}
                onValidationComplete={(isValid, result) => handleDocumentValidation(documentType, isValid, result)}
              />
            </div>
          )}

          {/* Champs du formulaire */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {champs.map(champ => renderFieldWithAutoFill(champ))}
          </div>
        </div>
      );
    }

    // Étape de récapitulatif
    return (
      <div className="space-y-6">
        <div className="text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Récapitulatif de votre demande
          </h2>
          <p className="text-gray-600">
            Vérifiez vos informations avant de soumettre votre demande d'aide au logement.
          </p>
        </div>

        <div className="bg-white border rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {Object.entries(formData).map(([key, value]) => (
              <div key={key}>
                <span className="font-medium text-gray-700 capitalize">
                  {key.replace('_', ' ')} :
                </span>
                <span className="ml-2">{String(value)}</span>
              </div>
            ))}
          </div>

          {/* Statut des documents */}
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-2">Documents validés :</h4>
            <div className="space-y-2">
              {Object.entries(documentsValides).map(([docType, isValid]) => (
                <div key={docType} className="flex items-center gap-2">
                  {isValid ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                  )}
                  <span className="text-sm">{docType.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const isStepValid = () => {
    if (currentStep > etapes.length) return true; // Récapitulatif
    
    const etape = etapes[currentStep - 1];
    const champs = champsParEtape[etape.id] || [];
    
    // Vérifier que tous les champs obligatoires sont remplis
    return champs.every(champ => {
      if (!champ.obligatoire) return true;
      const value = formData[champ.nom_champ];
      return value !== undefined && value !== null && value !== '';
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement de la configuration...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/effectuer-demarche')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="container mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {aide?.nom_aide || 'Aide au logement'}
          </h1>
          <p className="text-gray-600">
            Étape {currentStep} sur {etapes.length + 1} - Scanner intelligent activé
          </p>
        </div>

        {/* Barre de progression */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-2">
            {Array.from({ length: etapes.length + 1 }, (_, i) => i + 1).map((step) => (
              <div
                key={step}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step}
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / (etapes.length + 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Contenu de l'étape */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            {renderStep()}

            {/* Boutons de navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>

              {currentStep <= etapes.length && (
                <button
                  onClick={handleNext}
                  disabled={!isStepValid()}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {currentStep > etapes.length && (
                <button
                  onClick={() => {
                    console.log('🎉 Demande soumise:', formData);
                    navigate('/espace-personnel');
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200"
                >
                  Soumettre la demande
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AideLogementWizard; 