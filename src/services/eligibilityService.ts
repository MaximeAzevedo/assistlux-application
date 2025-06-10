export interface Question {
  id: string;
  ordre: number;
  question: string;
  key_reponse: string;
  type_reponse: string;
  options_json: any;
  branchements_json: any;
  condition_affichage?: string;
  help_text?: string;
  estimated_time_seconds?: number;
  icon_emoji?: string;
  difficulty_level?: string;
}

export interface EligibilityConclusion {
  id: string;
  titre_aide: string;
  logic_condition: string;
  texte_conclusion: string;
  categorie: string;
  action: string;
  url_formulaire?: string;
  url_source?: string;
}

export interface EligibilitySession {
  sessionId: string;
  responses: Record<string, string>;
  currentQuestionIndex: number;
  language: 'fr' | 'de' | 'lu' | 'en';
  startTime: Date;
  estimatedRemainingTime: number;
}

export interface EligibilityResult {
  eligible_aids: EligibilityConclusion[];
  ineligible_aids: EligibilityConclusion[];
  session_summary: {
    total_time: number;
    questions_answered: number;
    language_used: string;
  };
}

class EligibilityService {
  private readonly PROJECT_ID = 'smfvnuvtbxtoocnqmabg';

  /**
   * Charger toutes les questions depuis Supabase
   */
  async loadQuestions(): Promise<Question[]> {
    try {
      // Pour l'instant, utilisons des données statiques mais dans la vraie structure
      // TODO: Remplacer par appel MCP réel quand intégré
      const questions: Question[] = [
        {
          id: 'PROF_S01',
          ordre: 1,
          question: 'Habitez-vous et résidez-vous de façon principale au Luxembourg ?',
          key_reponse: 'q_residence_lux',
          type_reponse: 'Oui_Non',
          options_json: { opt_oui: 'Oui', opt_non: 'Non' },
          branchements_json: { opt_oui: 'PROF_S02', opt_non: 'PROF_END' },
          help_text: 'Votre adresse principale doit être au Luxembourg depuis au moins 6 mois',
          icon_emoji: '🏠',
          estimated_time_seconds: 15
        },
        {
          id: 'PROF_S02',
          ordre: 2,
          question: 'Avez-vous un titre de séjour valide au Luxembourg ?',
          key_reponse: 'q_sejour_legal_rnpp',
          type_reponse: 'Oui_Non',
          options_json: { opt_oui: 'Oui', opt_non: 'Non' },
          branchements_json: { opt_oui: 'PROF_S03', opt_non: 'PROF_END' },
          help_text: 'Un titre de séjour valide signifie que vous pouvez légalement vivre au Luxembourg',
          icon_emoji: '📋',
          estimated_time_seconds: 20
        },
        {
          id: 'PROF_S03',
          ordre: 3,
          question: 'Quelle est votre nationalité ?',
          key_reponse: 'q_nationalite_cat',
          type_reponse: 'Choix_Multiple_ABC',
          options_json: { opt_A: 'Lux/UE/EEE/Suisse', opt_B: 'Autre (≥ 5 ans)', opt_C: 'Autre (< 5 ans)' },
          branchements_json: { opt_A: 'PROF_S04', opt_B: 'PROF_S04', opt_C: 'PROF_S04' },
          help_text: 'Votre nationalité détermine certaines conditions d\'éligibilité',
          icon_emoji: '🌍',
          estimated_time_seconds: 25
        },
        {
          id: 'PROF_S04',
          ordre: 4,
          question: 'Avez-vous 25 ans ou plus ?',
          key_reponse: 'q_age_25plus',
          type_reponse: 'Oui_Non',
          options_json: { opt_oui: 'Oui', opt_non: 'Non' },
          branchements_json: { opt_oui: 'PROF_S06', opt_non: 'PROF_S05' },
          help_text: 'L\'âge de 25 ans est un seuil important pour certaines aides',
          icon_emoji: '🎂',
          estimated_time_seconds: 10
        },
        {
          id: 'PROF_S05',
          ordre: 5,
          question: 'Avez-vous des enfants à charge de moins de 18 ans ?',
          key_reponse: 'q_parent_enceinte',
          type_reponse: 'Oui_Non',
          options_json: { opt_oui: 'Oui', opt_non: 'Non' },
          branchements_json: { opt_oui: 'PROF_S05B', opt_non: 'PROF_S06' },
          help_text: 'Les enfants à charge donnent droit à des aides spécifiques',
          icon_emoji: '👶',
          estimated_time_seconds: 15
        },
        {
          id: 'PROF_S05B',
          ordre: 6,
          question: 'Combien d\'enfants à charge avez-vous ?',
          key_reponse: 'q_nb_enfants',
          type_reponse: 'Choix_Multiple_Simple',
          options_json: { opt_1: '1 enfant', opt_2: '2 enfants', opt_3: '3 enfants ou plus' },
          branchements_json: { opt_1: 'PROF_S06', opt_2: 'PROF_S06', opt_3: 'PROF_S06' },
          help_text: 'Précisez le nombre exact pour calculer les montants d\'aide',
          icon_emoji: '🔢',
          estimated_time_seconds: 15
        },
        {
          id: 'PROF_S06',
          ordre: 7,
          question: 'Êtes-vous inscrit(e) comme demandeur d\'emploi à l\'ADEM ?',
          key_reponse: 'q_dispo_emploi_adem',
          type_reponse: 'Oui_Non',
          options_json: { opt_oui: 'Oui', opt_non: 'Non' },
          branchements_json: { opt_oui: 'PROF_S07', opt_non: 'PROF_S07' },
          help_text: 'L\'ADEM aide à retrouver un emploi et donne accès à certaines aides',
          icon_emoji: '💼',
          estimated_time_seconds: 20
        },
        {
          id: 'PROF_S07',
          ordre: 8,
          question: 'Combien de personnes composent votre foyer ?',
          key_reponse: 'q_composition_menage',
          type_reponse: 'Choix_Multiple_Simple',
          options_json: { opt_1_pers: '1', opt_2_pers: '2', opt_3_plus_pers: '3 ou plus' },
          branchements_json: { opt_1_pers: 'PROF_S08', opt_2_pers: 'PROF_S08', opt_3_plus_pers: 'PROF_S08' },
          help_text: 'Le nombre de personnes dans votre foyer influence les montants d\'aide',
          icon_emoji: '👥',
          estimated_time_seconds: 20
        },
        {
          id: 'PROF_S08',
          ordre: 9,
          question: 'Vos revenus mensuels nets du foyer sont-ils inférieurs à 3000€ ?',
          key_reponse: 'q_niv_revenus_qual',
          type_reponse: 'Oui_Non',
          options_json: { opt_oui: 'Oui, moins de 3000€', opt_non: 'Non, 3000€ ou plus' },
          branchements_json: { opt_oui: 'PROF_S09', opt_non: 'PROF_S09' },
          help_text: 'Comptez tous les revenus nets de votre foyer (salaires, pensions, etc.)',
          icon_emoji: '💰',
          estimated_time_seconds: 30,
          difficulty_level: 'medium'
        },
        {
          id: 'PROF_S09',
          ordre: 10,
          question: 'Quelle est votre situation de logement ?',
          key_reponse: 'q_logement_situation',
          type_reponse: 'Choix_Multiple_ABC',
          options_json: { opt_A: 'Locataire', opt_B: 'Propriétaire avec crédit', opt_C: 'Propriétaire sans crédit' },
          branchements_json: { opt_A: 'PROF_S10', opt_B: 'PROF_S10', opt_C: 'PROF_EVAL' },
          help_text: 'Votre situation de logement détermine les aides disponibles',
          icon_emoji: '🏘️',
          estimated_time_seconds: 20
        },
        {
          id: 'PROF_S10',
          ordre: 11,
          question: 'Avez-vous des enfants scolarisés entre 6 et 18 ans ?',
          key_reponse: 'q_enfants_scolarises',
          type_reponse: 'Oui_Non',
          options_json: { opt_oui: 'Oui', opt_non: 'Non' },
          branchements_json: { opt_oui: 'PROF_EVAL', opt_non: 'PROF_EVAL' },
          help_text: 'Les enfants scolarisés donnent droit à l\'allocation de rentrée scolaire',
          icon_emoji: '🎒',
          estimated_time_seconds: 15
        }
      ];

      return questions.sort((a, b) => a.ordre - b.ordre);
    } catch (error) {
      console.error('Erreur lors du chargement des questions:', error);
      throw new Error('Impossible de charger les questions d\'éligibilité');
    }
  }

  /**
   * Évaluer l'éligibilité basée sur les réponses
   */
  async evaluateEligibility(responses: Record<string, string>): Promise<EligibilityResult> {
    try {
      // Logique d'évaluation basée sur les conditions de la BDD
      const eligibleAids: EligibilityConclusion[] = [];
      const ineligibleAids: EligibilityConclusion[] = [];

      // AVC - Allocation de vie chère
      if (responses.q_residence_lux === 'opt_oui' && responses.q_sejour_legal_rnpp === 'opt_oui') {
        eligibleAids.push({
          id: 'AVC_C',
          titre_aide: 'Allocation de vie chère',
          logic_condition: 'q_residence_lux=opt_oui AND q_sejour_legal_rnpp=opt_oui',
          texte_conclusion: 'Vous êtes éligible à l\'Allocation de vie chère (AVC).',
          categorie: 'Eligible',
          action: 'Télécharger',
          url_formulaire: 'https://fns.public.lu/dam-assets/formulaires/dem_avc_pe_fr_de_pt_en-2024.pdf',
          url_source: 'fns.public.lu'
        });
      }

      // REVIS - Revenu d'Inclusion Sociale
      if (
        responses.q_residence_lux === 'opt_oui' &&
        responses.q_sejour_legal_rnpp === 'opt_oui' &&
        ['opt_A', 'opt_B'].includes(responses.q_nationalite_cat) &&
        (responses.q_age_25plus === 'opt_oui' || responses.q_parent_enceinte === 'opt_oui') &&
        responses.q_dispo_emploi_adem === 'opt_oui'
      ) {
        eligibleAids.push({
          id: 'REVIS_C',
          titre_aide: 'Revenu d\'Inclusion Sociale (REVIS)',
          logic_condition: 'Complex condition met',
          texte_conclusion: 'Vous êtes éligible au Revenu d\'Inclusion Sociale (REVIS).',
          categorie: 'Eligible',
          action: 'Télécharger',
          url_formulaire: 'https://guichet.public.lu/dam-assets/catalogue-formulaires/revis/demande-obtention-revis/revis-demande-obtention-fr.pdf',
          url_source: 'guichet.public.lu'
        });
      }

      // ARS - Allocation de rentrée scolaire
      if (
        responses.q_nb_enfants && 
        responses.q_enfants_scolarises === 'opt_oui' && 
        responses.q_niv_revenus_qual === 'opt_oui'
      ) {
        eligibleAids.push({
          id: 'ARS_C',
          titre_aide: 'Allocation de rentrée scolaire',
          logic_condition: 'Children and low income condition met',
          texte_conclusion: 'Vous êtes éligible à l\'Allocation de rentrée scolaire (ARS).',
          categorie: 'Eligible',
          action: 'Télécharger',
          url_formulaire: 'https://guichet.public.lu/dam-assets/catalogue-formulaires/ars/ars-demande-obtention-fr.pdf',
          url_source: 'guichet.public.lu'
        });
      }

      // Logement social
      if (responses.q_niv_revenus_qual === 'opt_oui' && responses.q_logement_situation === 'opt_A') {
        eligibleAids.push({
          id: 'LS_C',
          titre_aide: 'Logement social',
          logic_condition: 'Low income and renter',
          texte_conclusion: 'Vous êtes éligible à un logement social.',
          categorie: 'Eligible',
          action: 'Télécharger',
          url_formulaire: 'https://fondsdulogement.lu/sites/default/files/uploaded_files/renla_demande_obtention_fr.pdf',
          url_source: 'fondsdulogement.lu'
        });
      }

      // Prime énergie
      if (responses.q_niv_revenus_qual === 'opt_oui') {
        eligibleAids.push({
          id: 'PE_C',
          titre_aide: 'Prime énergie',
          logic_condition: 'Low income',
          texte_conclusion: 'Vous êtes éligible à la Prime énergie.',
          categorie: 'Eligible',
          action: 'Télécharger',
          url_formulaire: 'https://guichet.public.lu/dam-assets/catalogue-formulaires/prime-energie/prime-energie-demande-obtention-fr.pdf',
          url_source: 'guichet.public.lu'
        });
      }

      return {
        eligible_aids: eligibleAids,
        ineligible_aids: ineligibleAids,
        session_summary: {
          total_time: 0, // Calculer réellement
          questions_answered: Object.keys(responses).length,
          language_used: 'fr'
        }
      };

    } catch (error) {
      console.error('Erreur lors de l\'évaluation d\'éligibilité:', error);
      throw new Error('Impossible d\'évaluer l\'éligibilité');
    }
  }

  /**
   * Traduire une question avec IA
   */
  async translateQuestion(question: Question, targetLanguage: string): Promise<Question> {
    try {
      // Pour l'instant, traductions statiques
      // TODO: Intégrer avec OpenAI/Azure OpenAI pour traduction contextuelle
      
      const translations: Record<string, Record<string, string>> = {
        'de': {
          'Habitez-vous et résidez-vous de façon principale au Luxembourg ?': 
            'Wohnen und leben Sie hauptsächlich in Luxemburg?',
          'Avez-vous un titre de séjour valide au Luxembourg ?': 
            'Haben Sie eine gültige Aufenthaltserlaubnis in Luxemburg?',
          'Quelle est votre nationalité ?': 
            'Welche Staatsangehörigkeit haben Sie?',
          'Avez-vous 25 ans ou plus ?': 
            'Sind Sie 25 Jahre oder älter?',
          'Avez-vous des enfants à charge de moins de 18 ans ?': 
            'Haben Sie Kinder unter 18 Jahren zu versorgen?',
          'Combien d\'enfants à charge avez-vous ?': 
            'Wie viele Kinder haben Sie zu versorgen?',
          'Êtes-vous inscrit(e) comme demandeur d\'emploi à l\'ADEM ?': 
            'Sind Sie bei der ADEM als Arbeitsuchender registriert?',
          'Combien de personnes composent votre foyer ?': 
            'Wie viele Personen leben in Ihrem Haushalt?',
          'Vos revenus mensuels nets du foyer sont-ils inférieurs à 3000€ ?': 
            'Liegt Ihr monatliches Nettoeinkommen des Haushalts unter 3000€?',
          'Quelle est votre situation de logement ?': 
            'Wie ist Ihre Wohnsituation?',
          'Avez-vous des enfants scolarisés entre 6 et 18 ans ?': 
            'Haben Sie schulpflichtige Kinder zwischen 6 und 18 Jahren?'
        },
        'lu': {
          'Habitez-vous et résidez-vous de façon principale au Luxembourg ?': 
            'Wunnt Dir an huelt Dir Ären Haaptwohnsëtz zu Lëtzebuerg?',
          'Avez-vous un titre de séjour valide au Luxembourg ?': 
            'Hutt Dir eng gülteg Aufenthaltserlaubnis zu Lëtzebuerg?',
          'Quelle est votre nationalité ?': 
            'Wéi eng Nationalitéit hutt Dir?',
          'Avez-vous 25 ans ou plus ?': 
            'Sidd Dir 25 Joer al oder méi?',
          'Avez-vous des enfants à charge de moins de 18 ans ?': 
            'Hutt Dir Kanner ënner 18 Joer ze versuergen?',
          'Combien d\'enfants à charge avez-vous ?': 
            'Wéivill Kanner hutt Dir ze versuergen?',
          'Êtes-vous inscrit(e) comme demandeur d\'emploi à l\'ADEM ?': 
            'Sidd Dir bei der ADEM als Aarbechtsuchend agedroen?',
          'Combien de personnes composent votre foyer ?': 
            'Wéivill Leit wunnen an Ärem Stot?',
          'Vos revenus mensuels nets du foyer sont-ils inférieurs à 3000€ ?': 
            'Sinn Är monatleg netto Akommes vum Stot ënner 3000€?',
          'Quelle est votre situation de logement ?': 
            'Wéi ass Är Wunnsituatioun?',
          'Avez-vous des enfants scolarisés entre 6 et 18 ans ?': 
            'Hutt Dir Schoolkanner tëschent 6 an 18 Joer?'
        }
      };

      const translatedQuestion = translations[targetLanguage]?.[question.question] || question.question;

      // Traduire les options
      let translatedOptions = question.options_json;
      if (targetLanguage === 'de') {
        translatedOptions = {
          ...question.options_json,
          opt_oui: 'Ja',
          opt_non: 'Nein'
        };
      } else if (targetLanguage === 'lu') {
        translatedOptions = {
          ...question.options_json,
          opt_oui: 'Jo',
          opt_non: 'Nee'
        };
      } else if (targetLanguage === 'en') {
        translatedOptions = {
          ...question.options_json,
          opt_oui: 'Yes',
          opt_non: 'No'
        };
      }

      return {
        ...question,
        question: translatedQuestion,
        options_json: translatedOptions
      };

    } catch (error) {
      console.error('Erreur lors de la traduction:', error);
      return question; // Retourner la question originale en cas d'erreur
    }
  }

  /**
   * Générer un rapport bilingue
   */
  generateBilingualReport(
    result: EligibilityResult, 
    session: EligibilitySession,
    userLanguage: string = 'fr'
  ): { professional: string; user: string } {
    const professionalReport = `
=== RAPPORT PROFESSIONNEL ===
Session ID: ${session.sessionId}
Durée: ${Math.round((Date.now() - session.startTime.getTime()) / 1000 / 60)} minutes
Questions répondues: ${result.session_summary.questions_answered}
Langue utilisée: ${userLanguage}

AIDES ÉLIGIBLES (${result.eligible_aids.length}):
${result.eligible_aids.map(aid => `
• ${aid.titre_aide}
  Action: ${aid.action}
  Formulaire: ${aid.url_formulaire}
  Source: ${aid.url_source}
`).join('')}

PROCHAINES ÉTAPES:
${result.eligible_aids.length > 0 
  ? '1. Télécharger les formulaires\n2. Accompagner le remplissage\n3. Prévoir suivi dans 1 mois'
  : 'Orienter vers les services communaux pour aides locales'
}
    `;

    const userReport = `
=== VOTRE RÉSUMÉ ===
${result.eligible_aids.length > 0 
  ? `Excellente nouvelle ! Vous êtes éligible à ${result.eligible_aids.length} aide(s):`
  : 'Malheureusement, vous ne remplissez pas les critères pour les aides nationales.'
}

${result.eligible_aids.map(aid => `
✅ ${aid.titre_aide}
${aid.texte_conclusion}
📄 Formulaire disponible
`).join('')}

PROCHAINES ÉTAPES:
${result.eligible_aids.length > 0 
  ? '• Votre travailleur social vous aidera à remplir les formulaires\n• Gardez vos documents d\'identité et revenus\n• Un suivi sera organisé'
  : '• Renseignez-vous auprès de votre commune\n• Consultez guichet.public.lu pour plus d\'infos'
}

🔒 Ce rapport n'est pas sauvé - Respecte votre vie privée
    `;

    return {
      professional: professionalReport,
      user: userReport
    };
  }
}

export const eligibilityService = new EligibilityService(); 