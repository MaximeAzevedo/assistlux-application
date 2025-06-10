import { AzureOpenAI } from 'openai';

// Configuration Azure OpenAI EU (RGPD Compliant - Sweden Central)
// ⚠️ ATTENTION: En production, ces appels doivent passer par un proxy backend
const AZURE_OPENAI_API_KEY = import.meta.env.VITE_AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_ENDPOINT = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_API_VERSION = import.meta.env.VITE_AZURE_OPENAI_API_VERSION;
const AZURE_OPENAI_DEPLOYMENT_NAME = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT_NAME;

// Variable pour déterminer si on utilise un proxy backend ou l'API directe
const USE_BACKEND_PROXY = import.meta.env.VITE_USE_BACKEND_PROXY === 'true';
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || '/api';

let azureOpenAIClient: any;

// Interface pour les appels proxy
interface ProxyRequest {
  messages: Array<{ role: string; content: any }>;
  model?: string;
  max_tokens?: number;
  temperature?: number;
}

// Client proxy sécurisé (recommandé pour production)
const createProxyClient = () => ({
  chat: {
    completions: {
      create: async (params: ProxyRequest) => {
        try {
          const response = await fetch(`${BACKEND_API_URL}/azure-openai/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
          });

          if (!response.ok) {
            throw new Error(`Proxy request failed: ${response.status}`);
          }

          return await response.json();
        } catch (error) {
          console.error('Erreur proxy Azure OpenAI:', error);
          throw error;
        }
      }
    }
  }
});

if (USE_BACKEND_PROXY) {
  // Mode production sécurisé avec proxy backend
  azureOpenAIClient = createProxyClient();
  console.log('🔒 Mode sécurisé: Utilisation du proxy backend pour Azure OpenAI');
} else if (!AZURE_OPENAI_API_KEY || !AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_DEPLOYMENT_NAME) {
  console.warn('Variables Azure OpenAI manquantes - Fonctionnalités IA désactivées');
  console.warn('Vérifiez: VITE_AZURE_OPENAI_API_KEY, VITE_AZURE_OPENAI_ENDPOINT, VITE_AZURE_OPENAI_DEPLOYMENT_NAME');
  console.warn('⚠️ Pour la production, configurez VITE_USE_BACKEND_PROXY=true');
  
  // Créer un mock d'Azure OpenAI pour éviter les erreurs
  azureOpenAIClient = {
    chat: {
      completions: {
        create: async () => {
          console.warn('Azure OpenAI non configuré - Ajoutez les variables Azure OpenAI dans votre fichier .env');
          return {
            choices: [{
              message: {
                content: 'Désolé, l\'IA n\'est pas disponible. Veuillez configurer Azure OpenAI EU.'
              }
            }]
          };
        }
      }
    }
  };
} else {
  // Mode développement avec accès direct (UNIQUEMENT pour développement)
  console.warn('⚠️ MODE DÉVELOPPEMENT: Accès direct Azure OpenAI');
  console.warn('🔒 PRODUCTION: Configurez VITE_USE_BACKEND_PROXY=true pour la sécurité');
  
  azureOpenAIClient = new AzureOpenAI({
    apiKey: AZURE_OPENAI_API_KEY,
    endpoint: AZURE_OPENAI_ENDPOINT,
    apiVersion: AZURE_OPENAI_API_VERSION,
    dangerouslyAllowBrowser: true // ⚠️ UNIQUEMENT EN DÉVELOPPEMENT
  });
  
  console.log('🇪🇺 Azure OpenAI EU configuré (mode dev):', {
    endpoint: AZURE_OPENAI_ENDPOINT.slice(0, 30) + '...',
    deployment: AZURE_OPENAI_DEPLOYMENT_NAME,
    region: 'swedencentral'
  });
}

// Export du modèle de déploiement pour tous les services
export const DEPLOYMENT_NAME = AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o-mini';

export default azureOpenAIClient;