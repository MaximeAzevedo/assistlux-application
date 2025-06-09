import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Scale, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2,
  User,
  Euro,
  FileText,
  Home
} from 'lucide-react';

const AssistanceJudiciaireWizard: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    situation: '',
    revenus: '',
    personnesCharge: 0,
    typeAffaire: ''
  });

  const handleBack = () => {
    if (currentStep === 1) {
      navigate('/effectuer-demarche');
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Votre situation personnelle
              </h2>
              <p className="text-gray-600">
                Commençons par comprendre votre situation actuelle
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quelle est votre situation familiale ?
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {['Célibataire', 'Marié(e)', 'Divorcé(e)', 'Veuf/Veuve', 'En concubinage'].map((option) => (
                    <button
                      key={option}
                      onClick={() => setFormData({...formData, situation: option})}
                      className={`p-4 text-left rounded-lg border-2 transition-all ${
                        formData.situation === option
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Vos revenus mensuels
              </h2>
              <p className="text-gray-600">
                Ces informations nous aident à évaluer votre éligibilité
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quel est votre revenu mensuel net ?
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    'Moins de 1 500€',
                    '1 500€ - 2 500€',
                    '2 500€ - 3 500€',
                    '3 500€ - 4 500€',
                    'Plus de 4 500€'
                  ].map((option) => (
                    <button
                      key={option}
                      onClick={() => setFormData({...formData, revenus: option})}
                      className={`p-4 text-left rounded-lg border-2 transition-all ${
                        formData.revenus === option
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Personnes à charge
              </h2>
              <p className="text-gray-600">
                Combien de personnes sont à votre charge ?
              </p>
            </div>

            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => setFormData({...formData, personnesCharge: Math.max(0, formData.personnesCharge - 1)})}
                className="w-12 h-12 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xl font-bold"
              >
                -
              </button>
              <div className="text-4xl font-bold text-purple-600 w-16 text-center">
                {formData.personnesCharge}
              </div>
              <button
                onClick={() => setFormData({...formData, personnesCharge: formData.personnesCharge + 1})}
                className="w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center text-xl font-bold"
              >
                +
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Type d'affaire judiciaire
              </h2>
              <p className="text-gray-600">
                Pour quel type de procédure avez-vous besoin d'aide ?
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                {[
                  'Divorce / Séparation',
                  'Garde d\'enfants',
                  'Succession / Héritage',
                  'Litige commercial',
                  'Droit du travail',
                  'Autre'
                ].map((option) => (
                  <button
                    key={option}
                    onClick={() => setFormData({...formData, typeAffaire: option})}
                    className={`p-4 text-left rounded-lg border-2 transition-all ${
                      formData.typeAffaire === option
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Évaluation terminée !
              </h2>
              <p className="text-gray-600">
                Voici le résultat de votre éligibilité à l'assistance judiciaire
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                ✅ Vous êtes éligible à l'assistance judiciaire
              </h3>
              <p className="text-green-800 text-sm mb-4">
                Basé sur vos revenus et votre situation, vous pouvez bénéficier d'une aide juridictionnelle.
              </p>
              
              <div className="space-y-2 text-sm">
                <p><strong>Prochaines étapes :</strong></p>
                <ul className="list-disc list-inside space-y-1 text-green-700">
                  <li>Télécharger le formulaire de demande</li>
                  <li>Rassembler les documents justificatifs</li>
                  <li>Déposer votre dossier au tribunal</li>
                </ul>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 pt-20 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/80 backdrop-blur-xl rounded-[24px] shadow-xl border border-gray-100/50 p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Assistance Judiciaire
              </h1>
              <p className="text-gray-600 text-sm">
                Étape {currentStep} sur 5
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 5) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Step Content */}
          <div className="mb-8">
            {renderStep()}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>

            {currentStep < 5 && (
              <button
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && !formData.situation) ||
                  (currentStep === 2 && !formData.revenus) ||
                  (currentStep === 4 && !formData.typeAffaire)
                }
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {currentStep === 5 && (
              <button
                onClick={() => navigate('/espace-personnel')}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200"
              >
                Continuer vers mon espace
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssistanceJudiciaireWizard; 