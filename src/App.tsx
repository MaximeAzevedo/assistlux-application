import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import DocumentScanner from './components/DocumentScanner';
import DatabaseSetup from './components/DatabaseSetup';

// Import des vraies pages
import CarteInteractive from './pages/CarteInteractive';
import ProcessAssistant from './pages/ProcessAssistant';
import PersonalSpace from './components/PersonalSpace/PersonalSpace';
import ProceduresGuide from './components/ProceduresGuide/ProceduresGuide';
import AssistanceJudiciaireWizard from './components/AssistanceJudiciaire/AssistanceJudiciaireWizard';
import AideLogementWizard from './components/AideLogement/AideLogementWizard';
import AllocationVieCherePage from './components/AllocationVieChere/AllocationVieCherePage';
import AllocationVieChereConfirmation from './components/AllocationVieChere/AllocationVieChereConfirmation';
import VerificateurEligibilite from './pages/VerificateurEligibilite';
import EligibilityWizardDirect from './pages/EligibilityWizardDirect';

// Composant de chargement
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
  </div>
);

function App() {
  console.log('App: Démarrage AssistLux');
  
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
          <Route path="/effectuer-demarche/assistance-judiciaire" element={<AssistanceJudiciaireWizard />} />
          <Route path="/effectuer-demarche/aide-logement" element={<AideLogementWizard />} />
          <Route path="/allocation-vie-chere" element={<AllocationVieCherePage />} />
          <Route path="/allocation-vie-chere/confirmation" element={<AllocationVieChereConfirmation />} />
          <Route path="/espace-personnel" element={<PersonalSpace />} />
          <Route path="/guide-demarches" element={<ProceduresGuide />} />
          <Route path="/carte-interactive" element={<CarteInteractive />} />
          <Route path="/aides-et-informations" element={<Dashboard />} />
          
          {/* Pages de développement */}
          <Route path="/database-setup" element={<DatabaseSetup />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default App;