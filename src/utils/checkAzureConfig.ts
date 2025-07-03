// Utilitaire pour vérifier la configuration Azure Speech Services

export interface AzureConfigCheck {
  isConfigured: boolean;
  missingVars: string[];
  suggestions: string[];
}

export const checkAzureSpeechConfig = (): AzureConfigCheck => {
  const requiredVars = [
    'VITE_AZURE_SPEECH_KEY',
    'VITE_AZURE_SPEECH_REGION'
  ];

  const missingVars: string[] = [];
  
  requiredVars.forEach(varName => {
    const value = import.meta.env[varName];
    if (!value || value.trim() === '') {
      missingVars.push(varName);
    }
  });

  const isConfigured = missingVars.length === 0;

  const suggestions: string[] = [];
  
  if (!isConfigured) {
    suggestions.push('🔧 Configuration Azure Speech Services requise :');
    suggestions.push('');
    suggestions.push('1. Créez un fichier .env à la racine du projet');
    suggestions.push('2. Ajoutez vos clés Azure Speech :');
    suggestions.push('');
    missingVars.forEach(varName => {
      if (varName === 'VITE_AZURE_SPEECH_KEY') {
        suggestions.push(`${varName}=votre_cle_azure_speech`);
      } else if (varName === 'VITE_AZURE_SPEECH_REGION') {
        suggestions.push(`${varName}=westeurope  # ou votre région`);
      }
    });
    suggestions.push('');
    suggestions.push('3. Redémarrez le serveur de développement');
    suggestions.push('');
    suggestions.push('📍 Où obtenir vos clés :');
    suggestions.push('• Portail Azure → Cognitive Services → Speech');
    suggestions.push('• Région recommandée : westeurope (RGPD)');
  }

  return {
    isConfigured,
    missingVars,
    suggestions
  };
};

// Fonction asynchrone pour vérifier la configuration Azure
export const checkAzureConfiguration = async (): Promise<boolean> => {
  const config = checkAzureSpeechConfig();
  return config.isConfigured;
};

export const logAzureConfigStatus = (): void => {
  const config = checkAzureSpeechConfig();
  
  if (config.isConfigured) {
    console.log('✅ Azure Speech Services configuré');
    console.log(`🌍 Région: ${import.meta.env.VITE_AZURE_SPEECH_REGION}`);
  } else {
    console.warn('⚠️ Azure Speech Services non configuré');
    config.suggestions.forEach(suggestion => {
      console.warn(suggestion);
    });
  }
}; 