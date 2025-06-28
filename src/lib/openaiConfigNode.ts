import { AzureOpenAI } from 'openai';

// ═══════════════════════════════════════════════════════════
// CLIENT AZURE OPENAI POUR NODE.JS - AssistLux
// Compatible avec les scripts tsx
// ═══════════════════════════════════════════════════════════

// Configuration depuis les variables d'environnement Node.js
const AZURE_OPENAI_API_KEY = process.env.VITE_AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_ENDPOINT = process.env.VITE_AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_API_VERSION = process.env.VITE_AZURE_OPENAI_API_VERSION || '2024-05-01-preview';
const AZURE_OPENAI_DEPLOYMENT_NAME = process.env.VITE_AZURE_OPENAI_DEPLOYMENT_NAME;

const logger = {
  log: (...args: any[]) => console.log('[OpenAI Node]', ...args),
  warn: (...args: any[]) => console.warn('[OpenAI Node]', ...args),
  error: (...args: any[]) => console.error('[OpenAI Node]', ...args),
};

let azureOpenAIClient: any;

if (!AZURE_OPENAI_API_KEY || !AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_DEPLOYMENT_NAME) {
  logger.warn('Variables Azure OpenAI manquantes dans .env');
  logger.warn('Requises: VITE_AZURE_OPENAI_API_KEY, VITE_AZURE_OPENAI_ENDPOINT, VITE_AZURE_OPENAI_DEPLOYMENT_NAME');
  
  // Client mock pour éviter les erreurs
  azureOpenAIClient = {
    embeddings: {
      create: async () => {
        throw new Error('Azure OpenAI non configuré - Variables manquantes dans .env');
      }
    },
    chat: {
      completions: {
        create: async () => {
          throw new Error('Azure OpenAI non configuré - Variables manquantes dans .env');
        }
      }
    }
  };
} else {
  logger.log('🔌 Initialisation Azure OpenAI pour Node.js');
  logger.log('🇪🇺 Endpoint:', AZURE_OPENAI_ENDPOINT.slice(0, 30) + '...');
  logger.log('🤖 Déploiement:', AZURE_OPENAI_DEPLOYMENT_NAME);
  
  azureOpenAIClient = new AzureOpenAI({
    apiKey: AZURE_OPENAI_API_KEY,
    endpoint: AZURE_OPENAI_ENDPOINT,
    apiVersion: AZURE_OPENAI_API_VERSION,
    // Pas de dangerouslyAllowBrowser en Node.js
  });
  
  logger.log('✅ Client Azure OpenAI initialisé');
}

export const DEPLOYMENT_NAME = AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o-mini';
export { azureOpenAIClient }; 