import { ArrowLeft, ArrowRight, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NavigationButtons: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const goBack = () => {
    navigate(-1);
  };

  const goToMainMenu = () => {
    navigate('/');
  };

  return (
    <div className="fixed bottom-6 left-6 flex flex-col gap-3 z-50">
      <button
        onClick={goToMainMenu}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-lg transition-colors"
      >
        <Home className="w-4 h-4" />
        {t('nav.mainMenu')}
      </button>
      <button
        onClick={goBack}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg shadow-lg transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('nav.back')}
      </button>
    </div>
  );
};

export default NavigationButtons;