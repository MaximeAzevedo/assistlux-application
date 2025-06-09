import React from 'react';
import EligibilityWizardRefactored from '../components/EligibilityChecker/EligibilityWizardRefactored';
import { useNavigate } from 'react-router-dom';

const EligibilityWizardDirect: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#ffffff' }}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Vérificateur d'Éligibilité AssistLux
          </h1>
          <p className="text-lg text-gray-600">
            Découvrez les aides sociales auxquelles vous avez droit au Luxembourg
          </p>
        </div>

        <EligibilityWizardRefactored onBack={handleBack} />
      </div>
    </div>
  );
};

export default EligibilityWizardDirect; 