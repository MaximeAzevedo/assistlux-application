import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import Layout from './components/Layout';
import DocumentScanner from './components/DocumentScanner';
import PersonalSpace from './components/PersonalSpace/PersonalSpace';
import EligibilityWizardDirect from './pages/EligibilityWizardDirect';
import VerificateurEligibilite from './pages/VerificateurEligibilite';
import ProcessAssistant from './pages/ProcessAssistant';
import CarteInteractive from './pages/CarteInteractive';
import ContentPage from './components/ContentPage';
import Dashboard from './components/Dashboard';
import DatabaseSetup from './components/DatabaseSetup';
import ProceduresGuide from './components/ProceduresGuide/ProceduresGuide';
import PreparationLogementSocial from './components/PreparationLogementSocial/PreparationLogementSocial';
import AdminPage from './pages/Admin';
import InterviewTranslator from './components/InterviewTranslator/InterviewTranslator';
import FileConverter from './components/FileConverter/FileConverter';

// Composant de chargement
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
  </div>
);

function App() {
  return (
    <Layout>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Page d'accueil principale */}
          <Route path="/" element={<Dashboard />} />
          
          {/* Fonctionnalités principales */}
          <Route path="/scan" element={<DocumentScanner />} />
          <Route path="/verificateur-eligibilite" element={<VerificateurEligibilite />} />
          <Route path="/eligibility-wizard" element={<EligibilityWizardDirect />} />
          <Route path="/eligibility-check" element={<ProcessAssistant />} />
          <Route path="/effectuer-demarche" element={<ProceduresGuide />} />
          <Route path="/preparation-logement-social" element={<PreparationLogementSocial />} />
          <Route path="/espace-personnel" element={<PersonalSpace />} />
          <Route path="/guide-demarches" element={<ProceduresGuide />} />
          <Route path="/carte-interactive" element={<CarteInteractive />} />
          <Route path="/aides-et-informations" element={<Dashboard />} />
          
          {/* Nouvelles fonctionnalités */}
          <Route path="/traducteur-entretiens" element={<InterviewTranslator />} />
          <Route path="/convertisseur-fichiers" element={<FileConverter />} />
          
          {/* Pages de développement */}
          <Route path="/database-setup" element={<DatabaseSetup />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default App;