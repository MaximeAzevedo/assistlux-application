import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://smfvnuvtbxtoocnqmabg.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtZnZudXZ0Ynh0b29jbnFtYWJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwNDk3NjksImV4cCI6MjA2MjYyNTc2OX0.BgIgVj8T-vXz0X_rDQjv3oqh7nPT7m5X5Q5rU7xm1Dw'
);

// Questions d'éligibilité refaites pour être cohérentes
const questions = [
  {
    ordre: 1,
    question: 'Résidez-vous au Luxembourg ?',
    key_reponse: 'q_residence_lux',
    type_reponse: 'Oui_Non',
    options_json: {
      opt_oui: 'Oui, je réside au Luxembourg',
      opt_non: 'Non, je ne réside pas au Luxembourg'
    },
    condition_affichage: null
  },
  {
    ordre: 2,
    question: 'Quelle est votre catégorie de nationalité ?',
    key_reponse: 'q_nationalite_cat',
    type_reponse: 'Choix_Multiple_ABC',
    options_json: {
      opt_A: 'UE/EEE/Suisse (Catégorie A)',
      opt_B: 'Pays tiers avec autorisation de séjour (Catégorie B)',
      opt_C: 'Autre situation (Catégorie C)'
    },
    condition_affichage: 'q_residence_lux = opt_oui'
  },
  {
    ordre: 3,
    question: 'Êtes-vous inscrit légalement au Registre National des Personnes Physiques (RNPP) ?',
    key_reponse: 'q_sejour_legal_rnpp',
    type_reponse: 'Oui_Non',
    options_json: {
      opt_oui: 'Oui, séjour légal',
      opt_non: 'Non, séjour irrégulier'
    },
    condition_affichage: 'q_residence_lux = opt_oui'
  },
  {
    ordre: 4,
    question: 'Quel est votre âge ?',
    key_reponse: 'q_age',
    type_reponse: 'Number',
    options_json: null,
    condition_affichage: 'q_residence_lux = opt_oui'
  },
  {
    ordre: 5,
    question: 'Êtes-vous hébergé dans une institution (maison de retraite, centre d\'hébergement, etc.) ?',
    key_reponse: 'q_institution',
    type_reponse: 'Oui_Non',
    options_json: {
      opt_oui: 'Oui, en institution',
      opt_non: 'Non, logement indépendant'
    },
    condition_affichage: 'q_residence_lux = opt_oui AND q_age >= 18'
  },
  {
    ordre: 6,
    question: 'Combien de personnes composent votre ménage (vous inclus) ?',
    key_reponse: 'q_composition_menage',
    type_reponse: 'Number',
    options_json: null,
    condition_affichage: 'q_residence_lux = opt_oui AND q_age >= 18 AND q_institution = opt_non'
  },
  {
    ordre: 7,
    question: 'Quels sont vos revenus mensuels nets totaux (en euros) ?',
    key_reponse: 'q_revenus_mensuels',
    type_reponse: 'Number',
    options_json: null,
    condition_affichage: 'q_residence_lux = opt_oui AND q_age >= 18 AND q_institution = opt_non'
  },
  {
    ordre: 8,
    question: 'Quelle est votre situation professionnelle ?',
    key_reponse: 'q_statut_professionnel',
    type_reponse: 'Choix_Multiple_ABC',
    options_json: {
      opt_salarie: 'Salarié',
      opt_independant: 'Indépendant',
      opt_chomeur: 'Demandeur d\'emploi',
      opt_retraite: 'Retraité',
      opt_etudiant: 'Étudiant',
      opt_invalide: 'En incapacité',
      opt_autre: 'Autre'
    },
    condition_affichage: 'q_residence_lux = opt_oui AND q_age >= 18 AND q_institution = opt_non'
  }
];

// Conclusions d'éligibilité refaites avec logique cohérente
const conclusions = [
  {
    titre_aide: 'Aide au logement',
    logic_condition: 'q_residence_lux = opt_oui AND q_age >= 18 AND q_institution = opt_non AND q_revenus_mensuels <= 3000 AND (q_nationalite_cat = opt_A OR (q_nationalite_cat != opt_A AND q_sejour_legal_rnpp = opt_oui))',
    texte_conclusion: 'D\'après vos réponses, cette aide semble correspondre à votre situation. L\'aide au logement soutient les ménages à revenus modestes dans leurs frais de logement. Une évaluation détaillée de votre dossier par les services compétents confirmera votre éligibilité.',
    categorie: 'Eligible',
    url_formulaire: 'https://logement.public.lu/fr/aides-logement/',
    url_source: 'https://www.fondsdulogement.lu',
    action: 'Télécharger le formulaire'
  },
  {
    titre_aide: 'Revenu minimum garanti (RMG)',
    logic_condition: 'q_residence_lux = opt_oui AND q_age >= 25 AND q_institution = opt_non AND q_revenus_mensuels <= 1500 AND (q_nationalite_cat = opt_A OR (q_nationalite_cat != opt_A AND q_sejour_legal_rnpp = opt_oui))',
    texte_conclusion: 'Votre profil correspond aux critères généraux du revenu minimum garanti. Cette aide assure un niveau de vie minimum aux personnes en difficulté financière. Nous vous encourageons à déposer une demande pour une évaluation personnalisée.',
    categorie: 'Eligible',
    url_formulaire: 'https://cnas.public.lu/fr/aides-financieres/rmg.html',
    url_source: 'https://www.cnas.lu',
    action: 'Faire une demande'
  },
  {
    titre_aide: 'Allocation de vie chère',
    logic_condition: 'q_residence_lux = opt_oui AND q_age >= 18 AND q_institution = opt_non AND q_revenus_mensuels <= 4000 AND (q_nationalite_cat = opt_A OR (q_nationalite_cat != opt_A AND q_sejour_legal_rnpp = opt_oui))',
    texte_conclusion: 'Cette allocation pourrait vous aider à compenser partiellement la hausse du coût de la vie. Votre situation semble compatible avec les conditions d\'éligibilité. Un examen détaillé de votre dossier permettra de confirmer vos droits.',
    categorie: 'Eligible',
    url_formulaire: 'https://mfamigr.gouvernement.lu/fr/le-ministere/aides-et-services/allocation-vie-chere.html',
    url_source: 'https://www.guichet.public.lu',
    action: 'Simuler mon éligibilité'
  },
  {
    titre_aide: 'Aide sociale pour personnes âgées',
    logic_condition: 'q_residence_lux = opt_oui AND q_age >= 60 AND q_institution = opt_non AND q_revenus_mensuels <= 2500 AND (q_nationalite_cat = opt_A OR (q_nationalite_cat != opt_A AND q_sejour_legal_rnpp = opt_oui))',
    texte_conclusion: 'Votre âge et votre situation financière suggèrent une possible éligibilité à l\'aide sociale pour personnes âgées. Cette aide est évaluée au cas par cas. Nous recommandons de prendre contact avec les services sociaux pour une analyse personnalisée.',
    categorie: 'Maybe',
    url_formulaire: 'https://cnas.public.lu/fr/aides-financieres/personnes-agees.html',
    url_source: 'https://www.cnas.lu',
    action: 'Prendre contact'
  },
  {
    titre_aide: 'Bourse d\'études supérieures',
    logic_condition: 'q_residence_lux = opt_oui AND q_age >= 18 AND q_age <= 30 AND q_institution = opt_non AND q_statut_professionnel = opt_etudiant AND q_revenus_mensuels <= 2000 AND (q_nationalite_cat = opt_A OR (q_nationalite_cat != opt_A AND q_sejour_legal_rnpp = opt_oui))',
    texte_conclusion: 'En tant qu\'étudiant avec des revenus limités, vous pourriez bénéficier d\'une bourse d\'études. L\'attribution dépend de critères académiques et financiers spécifiques. Contactez le CEDIES pour connaître les modalités exactes.',
    categorie: 'Maybe',
    url_formulaire: 'https://www.cedies.public.lu',
    url_source: 'https://portal.education.lu',
    action: 'Simuler ma bourse'
  },
  {
    titre_aide: 'Information résidence Luxembourg',
    logic_condition: 'q_residence_lux = opt_non',
    texte_conclusion: 'La résidence au Luxembourg est généralement requise pour bénéficier des aides sociales nationales. Si vous prévoyez de vous installer au Luxembourg, renseignez-vous sur les délais de carence éventuels. Certaines aides européennes ou de votre pays de résidence pourraient être disponibles.',
    categorie: 'Ineligible',
    url_formulaire: 'https://www.luxembourg.lu/fr/vivre-luxembourg',
    url_source: 'https://guichet.public.lu',
    action: 'S\'informer sur l\'installation'
  },
  {
    titre_aide: 'Information aide aux mineurs',
    logic_condition: 'q_residence_lux = opt_oui AND q_age < 18',
    texte_conclusion: 'Les aides pour mineurs relèvent généralement de dispositifs spécialisés (allocations familiales, aide à l\'enfance). Vos parents ou tuteurs légaux peuvent se renseigner auprès des services sociaux communaux ou du SNJ (Service National de la Jeunesse).',
    categorie: 'Ineligible',
    url_formulaire: 'https://snj.public.lu/',
    url_source: 'https://www.cae.lu',
    action: 'Contacter le SNJ'
  },
  {
    titre_aide: 'Information hébergement institutionnel',
    logic_condition: 'q_residence_lux = opt_oui AND q_age >= 18 AND q_institution = opt_oui',
    texte_conclusion: 'Pour les personnes hébergées en institution, des aides spécifiques existent selon le type d\'établissement. L\'assistant social de votre institution peut vous renseigner sur les dispositifs adaptés à votre situation particulière.',
    categorie: 'Ineligible',
    url_formulaire: 'https://cnas.public.lu/fr/aides-financieres/',
    url_source: 'https://www.cns.lu',
    action: 'Contacter l\'assistant social'
  }
];

async function setupEligibilityData() {
  try {
    console.log('🔄 Configuration des données d\'éligibilité refaites...');

    // 1. Nettoyer les données existantes
    console.log('🗑️ Suppression des anciennes données...');
    
    const { error: deleteQuestionsError } = await supabase
      .from('questions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (deleteQuestionsError) {
      console.warn('⚠️ Erreur suppression questions:', deleteQuestionsError.message);
    }

    const { error: deleteConclusionsError } = await supabase
      .from('conclusions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (deleteConclusionsError) {
      console.warn('⚠️ Erreur suppression conclusions:', deleteConclusionsError.message);
    }

    // 2. Insérer les nouvelles questions
    console.log('📝 Insertion des questions refaites...');
    
    const { data: questionsData, error: questionsError } = await supabase
      .from('questions')
      .insert(questions)
      .select();

    if (questionsError) {
      console.error('❌ Erreur insertion questions:', questionsError);
      return;
    }

    console.log(`✅ ${questionsData?.length || 0} questions insérées`);

    // 3. Insérer les nouvelles conclusions
    console.log('🎯 Insertion des conclusions refaites...');
    
    const { data: conclusionsData, error: conclusionsError } = await supabase
      .from('conclusions')
      .insert(conclusions)
      .select();

    if (conclusionsError) {
      console.error('❌ Erreur insertion conclusions:', conclusionsError);
      return;
    }

    console.log(`✅ ${conclusionsData?.length || 0} conclusions insérées`);

    // 4. Test de la logique
    console.log('\n🧪 Test de la logique refaite...');
    
    const testCases = [
      {
        name: 'Résident éligible standard',
        answers: {
          q_residence_lux: 'opt_oui',
          q_nationalite_cat: 'opt_A',
          q_sejour_legal_rnpp: 'opt_oui',
          q_age: 25,
          q_institution: 'opt_non',
          q_revenus_mensuels: 2500,
          q_statut_professionnel: 'opt_salarie'
        }
      },
      {
        name: 'Non-résident',
        answers: {
          q_residence_lux: 'opt_non'
        }
      },
      {
        name: 'Mineur',
        answers: {
          q_residence_lux: 'opt_oui',
          q_age: 16
        }
      },
      {
        name: 'Étudiant éligible bourse',
        answers: {
          q_residence_lux: 'opt_oui',
          q_nationalite_cat: 'opt_A',
          q_sejour_legal_rnpp: 'opt_oui',
          q_age: 22,
          q_institution: 'opt_non',
          q_revenus_mensuels: 1200,
          q_statut_professionnel: 'opt_etudiant'
        }
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n📋 Test: ${testCase.name}`);
      console.log('Réponses:', testCase.answers);
      
      // Simpler logic evaluation pour les tests
      const eligibleConclusions = conclusions.filter(conclusion => {
        return evaluateSimpleCondition(conclusion.logic_condition, testCase.answers);
      });

      console.log(`Résultats: ${eligibleConclusions.length} aides trouvées`);
      eligibleConclusions.forEach(c => {
        console.log(`   • ${c.titre_aide} (${c.categorie})`);
      });
    }

    console.log('\n🎉 Configuration terminée avec succès !');
    console.log('✨ Le système d\'éligibilité est prêt à fonctionner');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Fonction simplifiée d'évaluation pour les tests
function evaluateSimpleCondition(condition, answers) {
  if (!condition) return true;

  try {
    // Handle AND
    if (condition.includes(' AND ')) {
      return condition
        .split(' AND ')
        .every(subCond => evaluateSimpleCondition(subCond.trim(), answers));
    }

    // Handle OR
    if (condition.includes(' OR ')) {
      return condition
        .split(' OR ')
        .some(subCond => evaluateSimpleCondition(subCond.trim(), answers));
    }

    // Handle parentheses
    if (condition.includes('(') && condition.includes(')')) {
      const innerMatch = condition.match(/\(([^()]+)\)/);
      if (innerMatch) {
        const innerResult = evaluateSimpleCondition(innerMatch[1], answers);
        const newCondition = condition.replace(innerMatch[0], innerResult.toString());
        return evaluateSimpleCondition(newCondition, answers);
      }
    }

    // Handle inequality
    if (condition.includes(' != ')) {
      const [key, value] = condition.split(' != ').map(s => s.trim());
      return answers[key] !== value;
    }

    // Handle equality
    if (condition.includes(' = ')) {
      const [key, value] = condition.split(' = ').map(s => s.trim());
      return answers[key] === value;
    }

    // Handle numeric comparisons
    const numericMatch = condition.match(/^(.+?)\s*([><]=?)\s*(.+)$/);
    if (numericMatch) {
      const [, key, operator, valueStr] = numericMatch;
      const value = parseFloat(valueStr.trim());
      const userValue = parseFloat(answers[key.trim()]);
      
      if (isNaN(value) || isNaN(userValue)) return false;
      
      switch (operator) {
        case '>=': return userValue >= value;
        case '<=': return userValue <= value;
        case '>': return userValue > value;
        case '<': return userValue < value;
        default: return false;
      }
    }

    return false;
  } catch (error) {
    console.error('Erreur évaluation:', error);
    return false;
  }
}

// Exécuter la configuration
setupEligibilityData(); 