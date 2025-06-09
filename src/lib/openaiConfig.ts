import { AzureOpenAI } from 'openai';

// Configuration Azure OpenAI EU (RGPD Compliant - Sweden Central)
const AZURE_OPENAI_API_KEY = import.meta.env.VITE_AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_ENDPOINT = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_API_VERSION = import.meta.env.VITE_AZURE_OPENAI_API_VERSION;
const AZURE_OPENAI_DEPLOYMENT_NAME = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT_NAME;

let azureOpenAIClient: any;

if (!AZURE_OPENAI_API_KEY || !AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_DEPLOYMENT_NAME) {
  console.warn('Variables Azure OpenAI manquantes - Fonctionnalités IA désactivées');
  console.warn('Vérifiez: VITE_AZURE_OPENAI_API_KEY, VITE_AZURE_OPENAI_ENDPOINT, VITE_AZURE_OPENAI_DEPLOYMENT_NAME');
  
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
  // Créer une instance singleton d'Azure OpenAI EU
  azureOpenAIClient = new AzureOpenAI({
    apiKey: AZURE_OPENAI_API_KEY,
    endpoint: AZURE_OPENAI_ENDPOINT,
    apiVersion: AZURE_OPENAI_API_VERSION,
    dangerouslyAllowBrowser: true
  });
  
  console.log('🇪🇺 Azure OpenAI EU configuré:', {
    endpoint: AZURE_OPENAI_ENDPOINT.slice(0, 30) + '...',
    deployment: AZURE_OPENAI_DEPLOYMENT_NAME,
    region: 'swedencentral'
  });
}

// Export du modèle de déploiement pour tous les services
export const DEPLOYMENT_NAME = AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o-mini';

export default azureOpenAIClient;