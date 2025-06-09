import React, { useState, useEffect } from 'react';
import { formConfigService } from '../services/FormConfigService';
import { Database, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';

interface TestResult {
  test: string;
  status: 'loading' | 'success' | 'error';
  data?: any;
  error?: string;
  duration?: number;
}

const FormConfigTest: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateTest = (testName: string, update: Partial<TestResult>) => {
    setTests(prev => prev.map(test => 
      test.test === testName ? { ...test, ...update } : test
    ));
  };

  const runTests = async () => {
    setIsRunning(true);
    
    // Initialiser les tests
    const testList = [
      'Connexion Supabase',
      'Tables disponibles',
      'Chargement des aides',
      'Configuration Assistance Judiciaire',
      'Messages multilingues',
      'Configuration technique'
    ];

    setTests(testList.map(test => ({ test, status: 'loading' as const })));

    // Test 1: Connexion Supabase
    try {
      const startTime = Date.now();
      const isConnected = await formConfigService.testConnection();
      const duration = Date.now() - startTime;
      
      updateTest('Connexion Supabase', {
        status: isConnected ? 'success' : 'error',
        data: { connected: isConnected },
        duration
      });
    } catch (error) {
      updateTest('Connexion Supabase', {
        status: 'error',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }

    // Test 2: Vérifier les tables disponibles
    try {
      const startTime = Date.now();
      const { supabase } = await import('../lib/supabase/client');
      
      // Tester l'accès aux tables principales
      const tableTests = await Promise.allSettled([
        supabase.from('config_aide').select('count').limit(1),
        supabase.from('etapes').select('count').limit(1),
        supabase.from('champs_formulaire').select('count').limit(1),
        supabase.from('documents').select('count').limit(1),
        supabase.from('messages').select('count').limit(1),
        supabase.from('baremes').select('count').limit(1),
        supabase.from('adresses_envoi').select('count').limit(1),
        supabase.from('modeles_fichiers').select('count').limit(1),
        supabase.from('configuration_technique').select('count').limit(1),
        supabase.from('statistiques_validation').select('count').limit(1)
      ]);

      const tableNames = [
        'config_aide', 'etapes', 'champs_formulaire', 'documents', 'messages',
        'baremes', 'adresses_envoi', 'modeles_fichiers', 'configuration_technique', 'statistiques_validation'
      ];

      const tableStatus = tableTests.map((result, index) => ({
        table: tableNames[index],
        exists: result.status === 'fulfilled' && !result.value.error,
        error: result.status === 'rejected' ? result.reason : 
               (result.value.error ? result.value.error.message : null)
      }));

      const duration = Date.now() - startTime;
      const existingTables = tableStatus.filter(t => t.exists).length;
      
      updateTest('Tables disponibles', {
        status: existingTables > 0 ? 'success' : 'error',
        data: { tables: tableStatus, count: `${existingTables}/10` },
        duration
      });
    } catch (error) {
      updateTest('Tables disponibles', {
        status: 'error',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }

    // Test 3: Chargement des aides
    try {
      const startTime = Date.now();
      const aides = await formConfigService.getAides();
      const duration = Date.now() - startTime;
      
      updateTest('Chargement des aides', {
        status: 'success',
        data: { count: aides.length, aides: aides.slice(0, 3) }, // Afficher seulement les 3 premières
        duration
      });
    } catch (error) {
      updateTest('Chargement des aides', {
        status: 'error',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }

    // Test 4: Configuration spécifique (Assistance Judiciaire)
    try {
      const startTime = Date.now();
      const aides = await formConfigService.getAides();
      
      if (aides.length > 0) {
        const config = await formConfigService.getConfigurationAide(aides[0].id);
        const duration = Date.now() - startTime;
        
        updateTest('Configuration Assistance Judiciaire', {
          status: 'success',
          data: {
            aide: config.aide?.nom || 'N/A',
            etapes: config.etapes.length,
            champs: config.champs.length,
            documents: config.documents.length
          },
          duration
        });
      } else {
        updateTest('Configuration Assistance Judiciaire', {
          status: 'error',
          error: 'Aucune aide trouvée'
        });
      }
    } catch (error) {
      updateTest('Configuration Assistance Judiciaire', {
        status: 'error',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }

    // Test 5: Messages multilingues
    try {
      const startTime = Date.now();
      const messageFr = await formConfigService.getMessage('BIENVENUE', 'fr');
      const messageDe = await formConfigService.getMessage('BIENVENUE', 'de');
      const messageEn = await formConfigService.getMessage('BIENVENUE', 'en');
      const duration = Date.now() - startTime;
      
      updateTest('Messages multilingues', {
        status: 'success',
        data: { fr: messageFr, de: messageDe, en: messageEn },
        duration
      });
    } catch (error) {
      updateTest('Messages multilingues', {
        status: 'error',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }

    // Test 6: Configuration technique
    try {
      const startTime = Date.now();
      const config = await formConfigService.getConfigTechnique('APP_VERSION');
      const duration = Date.now() - startTime;
      
      updateTest('Configuration technique', {
        status: 'success',
        data: { APP_VERSION: config },
        duration
      });
    } catch (error) {
      updateTest('Configuration technique', {
        status: 'error',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }

    setIsRunning(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'loading':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6 text-white" />
              <h1 className="text-xl font-bold text-white">
                Test FormConfigService - Configuration des Aides Sociales
              </h1>
            </div>
            <button
              onClick={runTests}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
              Relancer les tests
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid gap-4">
            {tests.map((test, index) => (
              <div
                key={test.test}
                className={`border rounded-lg p-4 transition-all duration-300 ${getStatusColor(test.status)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(test.status)}
                    <h3 className="font-semibold text-gray-900">
                      {index + 1}. {test.test}
                    </h3>
                  </div>
                  {test.duration && (
                    <span className="text-sm text-gray-500">
                      {test.duration}ms
                    </span>
                  )}
                </div>

                {test.error && (
                  <div className="mt-2 p-3 bg-red-100 border border-red-200 rounded text-red-700 text-sm">
                    <strong>Erreur:</strong> {test.error}
                  </div>
                )}

                {test.data && (
                  <div className="mt-2 p-3 bg-gray-100 border border-gray-200 rounded">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
                      {JSON.stringify(test.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>

          {tests.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Résumé des tests</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {tests.filter(t => t.status === 'success').length}
                  </div>
                  <div className="text-gray-600">Réussis</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {tests.filter(t => t.status === 'error').length}
                  </div>
                  <div className="text-gray-600">Échoués</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {tests.filter(t => t.status === 'loading').length}
                  </div>
                  <div className="text-gray-600">En cours</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormConfigTest; 