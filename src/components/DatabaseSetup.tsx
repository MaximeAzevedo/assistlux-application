import React, { useState } from 'react';
import { setupDatabase, checkDatabaseTables, checkTableStructure } from '../utils/setupDatabase';
import { formConfigService } from '../services/FormConfigService';

const DatabaseSetup: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [setupResult, setSetupResult] = useState<string | null>(null);
  const [tableStatus, setTableStatus] = useState<any[]>([]);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [structureResults, setStructureResults] = useState<any[]>([]);

  const handleSetupDatabase = async () => {
    setIsLoading(true);
    setSetupResult(null);
    
    try {
      const success = await setupDatabase();
      setSetupResult(success ? 'Configuration réussie !' : 'Erreur lors de la configuration');
      
      // Vérifier les tables après la configuration
      const tables = await checkDatabaseTables();
      setTableStatus(tables);
    } catch (error) {
      setSetupResult(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckStructure = async () => {
    setIsLoading(true);
    setStructureResults([]);
    
    try {
      const results = await checkTableStructure();
      setStructureResults(results);
    } catch (error) {
      console.error('Erreur lors de la vérification de structure:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestServices = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    const tests = [
      {
        name: 'Test connexion',
        test: () => formConfigService.testConnection()
      },
      {
        name: 'Chargement des aides',
        test: () => formConfigService.getAides()
      },
      {
        name: 'Message BIENVENUE (FR)',
        test: () => formConfigService.getMessage('BIENVENUE', 'fr')
      },
      {
        name: 'Message BIENVENUE (DE)',
        test: () => formConfigService.getMessage('BIENVENUE', 'de')
      },
      {
        name: 'Configuration APP_VERSION',
        test: () => formConfigService.getConfigTechnique('APP_VERSION')
      }
    ];

    const results = [];
    
    for (const test of tests) {
      try {
        const startTime = Date.now();
        const result = await test.test();
        const duration = Date.now() - startTime;
        
        results.push({
          name: test.name,
          status: 'success',
          result,
          duration: `${duration}ms`
        });
      } catch (error) {
        results.push({
          name: test.name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        });
      }
    }
    
    setTestResults(results);
    setIsLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Configuration de la base de données AssistLux
        </h1>
        
        <div className="space-y-4">
          <button
            onClick={handleSetupDatabase}
            disabled={isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Configuration en cours...' : 'Configurer la base de données'}
          </button>
          
          <button
            onClick={handleCheckStructure}
            disabled={isLoading}
            className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 disabled:opacity-50 ml-4"
          >
            {isLoading ? 'Vérification...' : 'Vérifier la structure'}
          </button>
          
          <button
            onClick={handleTestServices}
            disabled={isLoading}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 ml-4"
          >
            {isLoading ? 'Tests en cours...' : 'Tester les services'}
          </button>
        </div>

        {setupResult && (
          <div className={`mt-4 p-4 rounded-md ${
            setupResult.includes('Erreur') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {setupResult}
          </div>
        )}
      </div>

      {/* Vérification de structure */}
      {structureResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Vérification de structure</h2>
          <div className="space-y-3">
            {structureResults.map((check, index) => (
              <div
                key={index}
                className={`p-3 rounded-md border ${
                  check.status === 'OK' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{check.table}</span>
                  <span className={`text-sm ${
                    check.status === 'OK' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {check.status === 'OK' ? '✅ Structure OK' : '❌ Problème de structure'}
                  </span>
                </div>
                {check.error && (
                  <p className="text-sm text-red-600 mt-1">{check.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statut des tables */}
      {tableStatus.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Statut des tables</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tableStatus.map((table, index) => (
              <div
                key={index}
                className={`p-3 rounded-md border ${
                  table.exists ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{table.table}</span>
                  <span className={`text-sm ${
                    table.exists ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {table.exists ? '✅ Existe' : '❌ Manquante'}
                  </span>
                </div>
                {table.error && (
                  <p className="text-sm text-red-600 mt-1">{table.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Résultats des tests */}
      {testResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Résultats des tests</h2>
          <div className="space-y-3">
            {testResults.map((test, index) => (
              <div
                key={index}
                className={`p-4 rounded-md border ${
                  test.status === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{test.name}</span>
                  <span className={`text-sm ${
                    test.status === 'success' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {test.status === 'success' ? '✅ Réussi' : '❌ Échec'}
                    {test.duration && ` (${test.duration})`}
                  </span>
                </div>
                
                {test.result && (
                  <div className="mt-2">
                    <pre className="text-sm bg-gray-100 p-2 rounded overflow-x-auto">
                      {typeof test.result === 'object' 
                        ? JSON.stringify(test.result, null, 2)
                        : String(test.result)
                      }
                    </pre>
                  </div>
                )}
                
                {test.error && (
                  <p className="text-sm text-red-600 mt-2">{test.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseSetup; 