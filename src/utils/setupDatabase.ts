import { supabase } from '../lib/supabase/client';

export async function setupDatabase() {
  console.log('🔧 Configuration de la base de données...');
  
  try {
    // 1. Insérer des messages de test
    const { error: messagesError } = await supabase
      .from('messages')
      .upsert([
        {
          cle: 'BIENVENUE',
          fr: 'Bienvenue dans AssistLux',
          de: 'Willkommen bei AssistLux',
          en: 'Welcome to AssistLux',
          lu: 'Wëllkomm bei AssistLux',
          pt: 'Bem-vindo ao AssistLux',
          contexte: 'general'
        },
        {
          cle: 'AIDE_SOCIALE',
          fr: 'Aide sociale',
          de: 'Sozialhilfe',
          en: 'Social assistance',
          lu: 'Sozial Hëllef',
          pt: 'Assistência social',
          contexte: 'general'
        },
        {
          cle: 'COMMENCER',
          fr: 'Commencer',
          de: 'Beginnen',
          en: 'Start',
          lu: 'Ufänken',
          pt: 'Começar',
          contexte: 'bouton'
        }
      ], { onConflict: 'cle' });

    if (messagesError) {
      console.error('Erreur lors de l\'insertion des messages:', messagesError);
    } else {
      console.log('✅ Messages insérés avec succès');
    }

    // 2. Insérer la configuration technique
    const { error: configError } = await supabase
      .from('configuration_technique')
      .upsert([
        {
          cle: 'APP_VERSION',
          valeur: '1.0.0',
          type_valeur: 'string',
          description: 'Version de l\'application'
        },
        {
          cle: 'MAX_FILE_SIZE_MB',
          valeur: '10',
          type_valeur: 'number',
          description: 'Taille maximale des fichiers en MB'
        },
        {
          cle: 'LANGUES_SUPPORTEES',
          valeur: '["fr","de","en","lu","pt"]',
          type_valeur: 'json',
          description: 'Langues supportées par l\'application'
        },
        {
          cle: 'MAINTENANCE_MODE',
          valeur: 'false',
          type_valeur: 'boolean',
          description: 'Mode maintenance activé'
        }
      ], { onConflict: 'cle' });

    if (configError) {
      console.error('Erreur lors de l\'insertion de la configuration:', configError);
    } else {
      console.log('✅ Configuration technique insérée avec succès');
    }

    // 3. Insérer une aide de test
    const { data: aideData, error: aideError } = await supabase
      .from('config_aide')
      .upsert([
        {
          nom_aide: 'Aide au logement',
          description_courte: 'Assistance financière pour le logement',
          description_longue: 'Cette aide permet d\'obtenir une assistance financière pour les frais de logement selon vos revenus et votre situation familiale.',
          actif: true,
          ordre_affichage: 1,
          icone: 'home',
          couleur: '#3B82F6'
        }
      ], { onConflict: 'nom_aide' })
      .select();

    if (aideError) {
      console.error('Erreur lors de l\'insertion de l\'aide:', aideError);
    } else {
      console.log('✅ Aide de test insérée avec succès');
    }

    console.log('🎉 Configuration de la base de données terminée !');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la configuration de la base de données:', error);
    return false;
  }
}

export async function checkDatabaseTables() {
  const tables = [
    'config_aide',
    'messages', 
    'configuration_technique',
    'etapes',
    'champs_formulaire',
    'documents',
    'baremes',
    'adresses_envoi',
    'modeles_fichiers',
    'statistiques_validation'
  ];

  const results = [];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      results.push({
        table,
        exists: !error,
        error: error?.message || null
      });
    } catch (err) {
      results.push({
        table,
        exists: false,
        error: err instanceof Error ? err.message : 'Erreur inconnue'
      });
    }
  }

  return results;
}

export async function checkTableStructure() {
  console.log('🔍 Vérification de la structure des tables...');
  
  const checks = [];
  
  // Vérifier config_aide
  try {
    const { data, error } = await supabase
      .from('config_aide')
      .select('id, nom_aide, actif, ordre_affichage')
      .limit(1);
    
    checks.push({
      table: 'config_aide',
      status: !error ? 'OK' : 'Erreur',
      error: error?.message || null
    });
  } catch (err) {
    checks.push({
      table: 'config_aide',
      status: 'Erreur',
      error: err instanceof Error ? err.message : 'Erreur inconnue'
    });
  }

  // Vérifier messages
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('id, cle, fr, de')
      .limit(1);
    
    checks.push({
      table: 'messages',
      status: !error ? 'OK' : 'Erreur',
      error: error?.message || null
    });
  } catch (err) {
    checks.push({
      table: 'messages',
      status: 'Erreur',
      error: err instanceof Error ? err.message : 'Erreur inconnue'
    });
  }

  // Vérifier configuration_technique
  try {
    const { data, error } = await supabase
      .from('configuration_technique')
      .select('id, cle, valeur, type_valeur')
      .limit(1);
    
    checks.push({
      table: 'configuration_technique',
      status: !error ? 'OK' : 'Erreur',
      error: error?.message || null
    });
  } catch (err) {
    checks.push({
      table: 'configuration_technique',
      status: 'Erreur',
      error: err instanceof Error ? err.message : 'Erreur inconnue'
    });
  }

  return checks;
} 