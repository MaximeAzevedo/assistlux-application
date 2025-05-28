import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import AuthRequired from './components/AuthRequired';
import Dashboard from './components/Dashboard';

// Lazy loading des composants lourds
const Login = React.lazy(() => import('./components/Login'));
const Signup = React.lazy(() => import('./components/Signup'));
const PersonalSpace = React.lazy(() => import('./components/PersonalSpace/PersonalSpace'));
const CarteInteractive = React.lazy(() => import('./pages/CarteInteractive'));
const ScanPage = React.lazy(() => import('./pages/ScanPage'));
const ProcessAssistant = React.lazy(() => import('./pages/ProcessAssistant'));

// Composant de chargement
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
  </div>
);

function App() {
  return (
    <Layout>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/personal-space" element={
            <AuthRequired>
              <PersonalSpace />
            </AuthRequired>
          } />
          
          {/* Scanner Route */}
          <Route path="/scan" element={<ScanPage />} />
          
          {/* Carte Interactive Route */}
          <Route path="/carte-interactive" element={<CarteInteractive />} />

          {/* Process Assistant Route */}
          <Route path="/effectuer-demarche" element={<ProcessAssistant />} />
          
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default App;