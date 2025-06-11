import { createClient } from '@supabase/supabase-js';
import { aiService } from '../lib/aiService';
import { SupportedLanguage } from '../lib/translation';

export interface Question {
  id: string;
  ordre: number;
  question: string;
  key_reponse: string;
  type_reponse: QuestionType;
  options_json: any;
  branchements_json: any;
  condition_affichage?: string;
  help_text?: string;
  estimated_time_seconds?: number;
  icon_emoji?: string;
  difficulty_level?: string;
  validation_rules?: ValidationRules;
}

// Nouveaux types de questions
export type QuestionType = 
  | 'Oui_Non'
  | 'Choix_Multiple_ABC' 
  | 'Choix_Multiple_Simple'
  | 'Nombre_Entier'         // Nouveau : pour âge, nombre d'enfants
  | 'Montant_Euro'          // Nouveau : pour revenus précis
  | 'Selecteur_Nationalite' // Nouveau : pour nationalités détaillées
  | 'Nombre_Personnes';     // Nouveau : pour composition du foyer

// Règles de validation
export interface ValidationRules {
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
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
  language: SupportedLanguage;
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
          icon_emoji: '📄',
          estimated_time_seconds: 20
        },
        {
          id: 'PROF_S03',
          ordre: 3,
          question: 'Quelle est votre nationalité ?',
          key_reponse: 'q_nationalite_cat',
          type_reponse: 'Selecteur_Nationalite',
          options_json: {
            // EUROPE
            'AD': { label: 'Andorre', flag: '🇦🇩', continent: 'Europe', eligibility: 'A' },
            'AL': { label: 'Albanie', flag: '🇦🇱', continent: 'Europe', eligibility: 'B' },
            'AT': { label: 'Autriche', flag: '🇦🇹', continent: 'Europe', eligibility: 'A' },
            'BE': { label: 'Belgique', flag: '🇧🇪', continent: 'Europe', eligibility: 'A' },
            'BG': { label: 'Bulgarie', flag: '🇧🇬', continent: 'Europe', eligibility: 'A' },
            'BY': { label: 'Biélorussie', flag: '🇧🇾', continent: 'Europe', eligibility: 'C' },
            'CH': { label: 'Suisse', flag: '🇨🇭', continent: 'Europe', eligibility: 'A' },
            'CZ': { label: 'République tchèque', flag: '🇨🇿', continent: 'Europe', eligibility: 'A' },
            'DE': { label: 'Allemagne', flag: '🇩🇪', continent: 'Europe', eligibility: 'A' },
            'DK': { label: 'Danemark', flag: '🇩🇰', continent: 'Europe', eligibility: 'A' },
            'EE': { label: 'Estonie', flag: '🇪🇪', continent: 'Europe', eligibility: 'A' },
            'ES': { label: 'Espagne', flag: '🇪🇸', continent: 'Europe', eligibility: 'A' },
            'FI': { label: 'Finlande', flag: '🇫🇮', continent: 'Europe', eligibility: 'A' },
            'FR': { label: 'France', flag: '🇫🇷', continent: 'Europe', eligibility: 'A' },
            'GB': { label: 'Royaume-Uni', flag: '🇬🇧', continent: 'Europe', eligibility: 'B' },
            'GR': { label: 'Grèce', flag: '🇬🇷', continent: 'Europe', eligibility: 'A' },
            'HR': { label: 'Croatie', flag: '🇭🇷', continent: 'Europe', eligibility: 'A' },
            'HU': { label: 'Hongrie', flag: '🇭🇺', continent: 'Europe', eligibility: 'A' },
            'IE': { label: 'Irlande', flag: '🇮🇪', continent: 'Europe', eligibility: 'A' },
            'IS': { label: 'Islande', flag: '🇮🇸', continent: 'Europe', eligibility: 'A' },
            'IT': { label: 'Italie', flag: '🇮🇹', continent: 'Europe', eligibility: 'A' },
            'LI': { label: 'Liechtenstein', flag: '🇱🇮', continent: 'Europe', eligibility: 'A' },
            'LT': { label: 'Lituanie', flag: '🇱🇹', continent: 'Europe', eligibility: 'A' },
            'LU': { label: 'Luxembourg', flag: '🇱🇺', continent: 'Europe', eligibility: 'A' },
            'LV': { label: 'Lettonie', flag: '🇱🇻', continent: 'Europe', eligibility: 'A' },
            'MC': { label: 'Monaco', flag: '🇲🇨', continent: 'Europe', eligibility: 'A' },
            'MD': { label: 'Moldavie', flag: '🇲🇩', continent: 'Europe', eligibility: 'C' },
            'ME': { label: 'Monténégro', flag: '🇲🇪', continent: 'Europe', eligibility: 'B' },
            'MK': { label: 'Macédoine du Nord', flag: '🇲🇰', continent: 'Europe', eligibility: 'B' },
            'MT': { label: 'Malte', flag: '🇲🇹', continent: 'Europe', eligibility: 'A' },
            'NL': { label: 'Pays-Bas', flag: '🇳🇱', continent: 'Europe', eligibility: 'A' },
            'NO': { label: 'Norvège', flag: '🇳🇴', continent: 'Europe', eligibility: 'A' },
            'PL': { label: 'Pologne', flag: '🇵🇱', continent: 'Europe', eligibility: 'A' },
            'PT': { label: 'Portugal', flag: '🇵🇹', continent: 'Europe', eligibility: 'A' },
            'RO': { label: 'Roumanie', flag: '🇷🇴', continent: 'Europe', eligibility: 'A' },
            'RS': { label: 'Serbie', flag: '🇷🇸', continent: 'Europe', eligibility: 'B' },
            'RU': { label: 'Russie', flag: '🇷🇺', continent: 'Europe', eligibility: 'C' },
            'SE': { label: 'Suède', flag: '🇸🇪', continent: 'Europe', eligibility: 'A' },
            'SI': { label: 'Slovénie', flag: '🇸🇮', continent: 'Europe', eligibility: 'A' },
            'SK': { label: 'Slovaquie', flag: '🇸🇰', continent: 'Europe', eligibility: 'A' },
            'SM': { label: 'Saint-Marin', flag: '🇸🇲', continent: 'Europe', eligibility: 'A' },
            'UA': { label: 'Ukraine', flag: '🇺🇦', continent: 'Europe', eligibility: 'C' },
            'VA': { label: 'Vatican', flag: '🇻🇦', continent: 'Europe', eligibility: 'A' },

            // AFRIQUE
            'DZ': { label: 'Algérie', flag: '🇩🇿', continent: 'Afrique', eligibility: 'C' },
            'AO': { label: 'Angola', flag: '🇦🇴', continent: 'Afrique', eligibility: 'C' },
            'BJ': { label: 'Bénin', flag: '🇧🇯', continent: 'Afrique', eligibility: 'C' },
            'BW': { label: 'Botswana', flag: '🇧🇼', continent: 'Afrique', eligibility: 'C' },
            'BF': { label: 'Burkina Faso', flag: '🇧🇫', continent: 'Afrique', eligibility: 'C' },
            'BI': { label: 'Burundi', flag: '🇧🇮', continent: 'Afrique', eligibility: 'C' },
            'CV': { label: 'Cap-Vert', flag: '🇨🇻', continent: 'Afrique', eligibility: 'C' },
            'CM': { label: 'Cameroun', flag: '🇨🇲', continent: 'Afrique', eligibility: 'C' },
            'CF': { label: 'République centrafricaine', flag: '🇨🇫', continent: 'Afrique', eligibility: 'C' },
            'TD': { label: 'Tchad', flag: '🇹🇩', continent: 'Afrique', eligibility: 'C' },
            'KM': { label: 'Comores', flag: '🇰🇲', continent: 'Afrique', eligibility: 'C' },
            'CG': { label: 'Congo', flag: '🇨🇬', continent: 'Afrique', eligibility: 'C' },
            'CD': { label: 'RD Congo', flag: '🇨🇩', continent: 'Afrique', eligibility: 'C' },
            'CI': { label: 'Côte d\'Ivoire', flag: '🇨🇮', continent: 'Afrique', eligibility: 'C' },
            'DJ': { label: 'Djibouti', flag: '🇩🇯', continent: 'Afrique', eligibility: 'C' },
            'EG': { label: 'Égypte', flag: '🇪🇬', continent: 'Afrique', eligibility: 'C' },
            'GQ': { label: 'Guinée équatoriale', flag: '🇬🇶', continent: 'Afrique', eligibility: 'C' },
            'ER': { label: 'Érythrée', flag: '🇪🇷', continent: 'Afrique', eligibility: 'C' },
            'ET': { label: 'Éthiopie', flag: '🇪🇹', continent: 'Afrique', eligibility: 'C' },
            'GA': { label: 'Gabon', flag: '🇬🇦', continent: 'Afrique', eligibility: 'C' },
            'GM': { label: 'Gambie', flag: '🇬🇲', continent: 'Afrique', eligibility: 'C' },
            'GH': { label: 'Ghana', flag: '🇬🇭', continent: 'Afrique', eligibility: 'C' },
            'GN': { label: 'Guinée', flag: '🇬🇳', continent: 'Afrique', eligibility: 'C' },
            'GW': { label: 'Guinée-Bissau', flag: '🇬🇼', continent: 'Afrique', eligibility: 'C' },
            'KE': { label: 'Kenya', flag: '🇰🇪', continent: 'Afrique', eligibility: 'C' },
            'LS': { label: 'Lesotho', flag: '🇱🇸', continent: 'Afrique', eligibility: 'C' },
            'LR': { label: 'Libéria', flag: '🇱🇷', continent: 'Afrique', eligibility: 'C' },
            'LY': { label: 'Libye', flag: '🇱🇾', continent: 'Afrique', eligibility: 'C' },
            'MG': { label: 'Madagascar', flag: '🇲🇬', continent: 'Afrique', eligibility: 'C' },
            'MW': { label: 'Malawi', flag: '🇲🇼', continent: 'Afrique', eligibility: 'C' },
            'ML': { label: 'Mali', flag: '🇲🇱', continent: 'Afrique', eligibility: 'C' },
            'MR': { label: 'Mauritanie', flag: '🇲🇷', continent: 'Afrique', eligibility: 'C' },
            'MU': { label: 'Maurice', flag: '🇲🇺', continent: 'Afrique', eligibility: 'C' },
            'MA': { label: 'Maroc', flag: '🇲🇦', continent: 'Afrique', eligibility: 'C' },
            'MZ': { label: 'Mozambique', flag: '🇲🇿', continent: 'Afrique', eligibility: 'C' },
            'NA': { label: 'Namibie', flag: '🇳🇦', continent: 'Afrique', eligibility: 'C' },
            'NE': { label: 'Niger', flag: '🇳🇪', continent: 'Afrique', eligibility: 'C' },
            'NG': { label: 'Nigéria', flag: '🇳🇬', continent: 'Afrique', eligibility: 'C' },
            'RW': { label: 'Rwanda', flag: '🇷🇼', continent: 'Afrique', eligibility: 'C' },
            'SN': { label: 'Sénégal', flag: '🇸🇳', continent: 'Afrique', eligibility: 'C' },
            'SC': { label: 'Seychelles', flag: '🇸🇨', continent: 'Afrique', eligibility: 'C' },
            'SL': { label: 'Sierra Leone', flag: '🇸🇱', continent: 'Afrique', eligibility: 'C' },
            'SO': { label: 'Somalie', flag: '🇸🇴', continent: 'Afrique', eligibility: 'C' },
            'ZA': { label: 'Afrique du Sud', flag: '🇿🇦', continent: 'Afrique', eligibility: 'B' },
            'SS': { label: 'Soudan du Sud', flag: '🇸🇸', continent: 'Afrique', eligibility: 'C' },
            'SD': { label: 'Soudan', flag: '🇸🇩', continent: 'Afrique', eligibility: 'C' },
            'SZ': { label: 'Eswatini', flag: '🇸🇿', continent: 'Afrique', eligibility: 'C' },
            'TZ': { label: 'Tanzanie', flag: '🇹🇿', continent: 'Afrique', eligibility: 'C' },
            'TG': { label: 'Togo', flag: '🇹🇬', continent: 'Afrique', eligibility: 'C' },
            'TN': { label: 'Tunisie', flag: '🇹🇳', continent: 'Afrique', eligibility: 'C' },
            'UG': { label: 'Ouganda', flag: '🇺🇬', continent: 'Afrique', eligibility: 'C' },
            'ZM': { label: 'Zambie', flag: '🇿🇲', continent: 'Afrique', eligibility: 'C' },
            'ZW': { label: 'Zimbabwe', flag: '🇿🇼', continent: 'Afrique', eligibility: 'C' },

            // ASIE
            'AF': { label: 'Afghanistan', flag: '🇦🇫', continent: 'Asie', eligibility: 'C' },
            'BD': { label: 'Bangladesh', flag: '🇧🇩', continent: 'Asie', eligibility: 'C' },
            'BT': { label: 'Bhoutan', flag: '🇧🇹', continent: 'Asie', eligibility: 'C' },
            'BN': { label: 'Brunei', flag: '🇧🇳', continent: 'Asie', eligibility: 'C' },
            'KH': { label: 'Cambodge', flag: '🇰🇭', continent: 'Asie', eligibility: 'C' },
            'CN': { label: 'Chine', flag: '🇨🇳', continent: 'Asie', eligibility: 'C' },
            'IN': { label: 'Inde', flag: '🇮🇳', continent: 'Asie', eligibility: 'C' },
            'ID': { label: 'Indonésie', flag: '🇮🇩', continent: 'Asie', eligibility: 'C' },
            'IR': { label: 'Iran', flag: '🇮🇷', continent: 'Asie', eligibility: 'C' },
            'IQ': { label: 'Irak', flag: '🇮🇶', continent: 'Asie', eligibility: 'C' },
            'JP': { label: 'Japon', flag: '🇯🇵', continent: 'Asie', eligibility: 'B' },
            'JO': { label: 'Jordanie', flag: '🇯🇴', continent: 'Asie', eligibility: 'C' },
            'KZ': { label: 'Kazakhstan', flag: '🇰🇿', continent: 'Asie', eligibility: 'C' },
            'KW': { label: 'Koweït', flag: '🇰🇼', continent: 'Asie', eligibility: 'C' },
            'KG': { label: 'Kirghizistan', flag: '🇰🇬', continent: 'Asie', eligibility: 'C' },
            'LA': { label: 'Laos', flag: '🇱🇦', continent: 'Asie', eligibility: 'C' },
            'LB': { label: 'Liban', flag: '🇱🇧', continent: 'Asie', eligibility: 'C' },
            'MY': { label: 'Malaisie', flag: '🇲🇾', continent: 'Asie', eligibility: 'C' },
            'MV': { label: 'Maldives', flag: '🇲🇻', continent: 'Asie', eligibility: 'C' },
            'MN': { label: 'Mongolie', flag: '🇲🇳', continent: 'Asie', eligibility: 'C' },
            'MM': { label: 'Myanmar', flag: '🇲🇲', continent: 'Asie', eligibility: 'C' },
            'NP': { label: 'Népal', flag: '🇳🇵', continent: 'Asie', eligibility: 'C' },
            'KP': { label: 'Corée du Nord', flag: '🇰🇵', continent: 'Asie', eligibility: 'C' },
            'OM': { label: 'Oman', flag: '🇴🇲', continent: 'Asie', eligibility: 'C' },
            'PK': { label: 'Pakistan', flag: '🇵🇰', continent: 'Asie', eligibility: 'C' },
            'PH': { label: 'Philippines', flag: '🇵🇭', continent: 'Asie', eligibility: 'C' },
            'QA': { label: 'Qatar', flag: '🇶🇦', continent: 'Asie', eligibility: 'C' },
            'SA': { label: 'Arabie saoudite', flag: '🇸🇦', continent: 'Asie', eligibility: 'C' },
            'SG': { label: 'Singapour', flag: '🇸🇬', continent: 'Asie', eligibility: 'B' },
            'KR': { label: 'Corée du Sud', flag: '🇰🇷', continent: 'Asie', eligibility: 'B' },
            'LK': { label: 'Sri Lanka', flag: '🇱🇰', continent: 'Asie', eligibility: 'C' },
            'SY': { label: 'Syrie', flag: '🇸🇾', continent: 'Asie', eligibility: 'C' },
            'TW': { label: 'Taïwan', flag: '🇹🇼', continent: 'Asie', eligibility: 'C' },
            'TJ': { label: 'Tadjikistan', flag: '🇹🇯', continent: 'Asie', eligibility: 'C' },
            'TH': { label: 'Thaïlande', flag: '🇹🇭', continent: 'Asie', eligibility: 'C' },
            'TL': { label: 'Timor oriental', flag: '🇹🇱', continent: 'Asie', eligibility: 'C' },
            'TR': { label: 'Turquie', flag: '🇹🇷', continent: 'Asie', eligibility: 'C' },
            'TM': { label: 'Turkménistan', flag: '🇹🇲', continent: 'Asie', eligibility: 'C' },
            'AE': { label: 'Émirats arabes unis', flag: '🇦🇪', continent: 'Asie', eligibility: 'C' },
            'UZ': { label: 'Ouzbékistan', flag: '🇺🇿', continent: 'Asie', eligibility: 'C' },
            'VN': { label: 'Vietnam', flag: '🇻🇳', continent: 'Asie', eligibility: 'C' },
            'YE': { label: 'Yémen', flag: '🇾🇪', continent: 'Asie', eligibility: 'C' },

            // AMÉRIQUE DU NORD
            'CA': { label: 'Canada', flag: '🇨🇦', continent: 'Amérique du Nord', eligibility: 'B' },
            'CR': { label: 'Costa Rica', flag: '🇨🇷', continent: 'Amérique du Nord', eligibility: 'C' },
            'CU': { label: 'Cuba', flag: '🇨🇺', continent: 'Amérique du Nord', eligibility: 'C' },
            'DO': { label: 'République dominicaine', flag: '🇩🇴', continent: 'Amérique du Nord', eligibility: 'C' },
            'SV': { label: 'Salvador', flag: '🇸🇻', continent: 'Amérique du Nord', eligibility: 'C' },
            'GT': { label: 'Guatemala', flag: '🇬🇹', continent: 'Amérique du Nord', eligibility: 'C' },
            'HT': { label: 'Haïti', flag: '🇭🇹', continent: 'Amérique du Nord', eligibility: 'C' },
            'HN': { label: 'Honduras', flag: '🇭🇳', continent: 'Amérique du Nord', eligibility: 'C' },
            'JM': { label: 'Jamaïque', flag: '🇯🇲', continent: 'Amérique du Nord', eligibility: 'C' },
            'MX': { label: 'Mexique', flag: '🇲🇽', continent: 'Amérique du Nord', eligibility: 'C' },
            'NI': { label: 'Nicaragua', flag: '🇳🇮', continent: 'Amérique du Nord', eligibility: 'C' },
            'PA': { label: 'Panama', flag: '🇵🇦', continent: 'Amérique du Nord', eligibility: 'C' },
            'TT': { label: 'Trinité-et-Tobago', flag: '🇹🇹', continent: 'Amérique du Nord', eligibility: 'C' },
            'US': { label: 'États-Unis', flag: '🇺🇸', continent: 'Amérique du Nord', eligibility: 'B' },

            // AMÉRIQUE DU SUD
            'AR': { label: 'Argentine', flag: '🇦🇷', continent: 'Amérique du Sud', eligibility: 'C' },
            'BO': { label: 'Bolivie', flag: '🇧🇴', continent: 'Amérique du Sud', eligibility: 'C' },
            'BR': { label: 'Brésil', flag: '🇧🇷', continent: 'Amérique du Sud', eligibility: 'B' },
            'CL': { label: 'Chili', flag: '🇨🇱', continent: 'Amérique du Sud', eligibility: 'C' },
            'CO': { label: 'Colombie', flag: '🇨🇴', continent: 'Amérique du Sud', eligibility: 'C' },
            'EC': { label: 'Équateur', flag: '🇪🇨', continent: 'Amérique du Sud', eligibility: 'C' },
            'GY': { label: 'Guyana', flag: '🇬🇾', continent: 'Amérique du Sud', eligibility: 'C' },
            'PY': { label: 'Paraguay', flag: '🇵🇾', continent: 'Amérique du Sud', eligibility: 'C' },
            'PE': { label: 'Pérou', flag: '🇵🇪', continent: 'Amérique du Sud', eligibility: 'C' },
            'SR': { label: 'Suriname', flag: '🇸🇷', continent: 'Amérique du Sud', eligibility: 'C' },
            'UY': { label: 'Uruguay', flag: '🇺🇾', continent: 'Amérique du Sud', eligibility: 'C' },
            'VE': { label: 'Venezuela', flag: '🇻🇪', continent: 'Amérique du Sud', eligibility: 'C' },

            // OCÉANIE
            'AU': { label: 'Australie', flag: '🇦🇺', continent: 'Océanie', eligibility: 'B' },
            'FJ': { label: 'Fidji', flag: '🇫🇯', continent: 'Océanie', eligibility: 'C' },
            'KI': { label: 'Kiribati', flag: '🇰🇮', continent: 'Océanie', eligibility: 'C' },
            'MH': { label: 'Marshall', flag: '🇲🇭', continent: 'Océanie', eligibility: 'C' },
            'FM': { label: 'Micronésie', flag: '🇫🇲', continent: 'Océanie', eligibility: 'C' },
            'NR': { label: 'Nauru', flag: '🇳🇷', continent: 'Océanie', eligibility: 'C' },
            'NZ': { label: 'Nouvelle-Zélande', flag: '🇳🇿', continent: 'Océanie', eligibility: 'B' },
            'PW': { label: 'Palaos', flag: '🇵🇼', continent: 'Océanie', eligibility: 'C' },
            'PG': { label: 'Papouasie-Nouvelle-Guinée', flag: '🇵🇬', continent: 'Océanie', eligibility: 'C' },
            'WS': { label: 'Samoa', flag: '🇼🇸', continent: 'Océanie', eligibility: 'C' },
            'SB': { label: 'Îles Salomon', flag: '🇸🇧', continent: 'Océanie', eligibility: 'C' },
            'TO': { label: 'Tonga', flag: '🇹🇴', continent: 'Océanie', eligibility: 'C' },
            'TV': { label: 'Tuvalu', flag: '🇹🇻', continent: 'Océanie', eligibility: 'C' },
            'VU': { label: 'Vanuatu', flag: '🇻🇺', continent: 'Océanie', eligibility: 'C' }
          },
          branchements_json: { 
            default: 'PROF_S04'
          },
          help_text: 'Votre nationalité détermine certaines conditions d\'éligibilité aux aides luxembourgeoises',
          icon_emoji: '🌍',
          estimated_time_seconds: 30
        },
        {
          id: 'PROF_S04',
          ordre: 4,
          question: 'Quel est votre âge ?',
          key_reponse: 'q_age_exact',
          type_reponse: 'Nombre_Entier',
          options_json: {},
          branchements_json: { continue: 'PROF_S05' },
          validation_rules: { 
            required: true, 
            min: 16, 
            max: 100, 
            step: 1,
            unit: 'ans'
          },
          help_text: 'Votre âge détermine l\'éligibilité à certaines aides (seuil 25 ans pour REVIS)',
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
          question: 'Combien d\'enfants à charge avez-vous exactement ?',
          key_reponse: 'q_nb_enfants_exact',
          type_reponse: 'Nombre_Entier',
          options_json: {},
          branchements_json: { continue: 'PROF_S06' },
          validation_rules: { 
            required: true, 
            min: 1, 
            max: 15, 
            step: 1,
            unit: 'enfants'
          },
          help_text: 'Le nombre exact d\'enfants permet de calculer précisément les montants d\'aide',
          icon_emoji: '👨‍👩‍👧‍👦',
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
          question: 'Combien de personnes composent votre foyer exactement ?',
          key_reponse: 'q_composition_menage',
          type_reponse: 'Nombre_Personnes',
          options_json: {},
          branchements_json: { continue: 'PROF_S08' },
          validation_rules: { 
            required: true, 
            min: 1, 
            max: 20, 
            step: 1,
            unit: 'personnes'
          },
          help_text: 'Comptez vous-même + conjoint + enfants + toute autre personne vivant sous le même toit',
          icon_emoji: '🏘️',
          estimated_time_seconds: 25
        },
        {
          id: 'PROF_S08',
          ordre: 9,
          question: 'Quels sont vos revenus mensuels nets du foyer ?',
          key_reponse: 'q_revenus_nets_exact',
          type_reponse: 'Montant_Euro',
          options_json: {},
          branchements_json: { continue: 'PROF_S09' },
          validation_rules: { 
            required: true, 
            min: 0, 
            max: 15000, 
            step: 50,
            unit: '€/mois'
          },
          help_text: 'Comptez tous les revenus nets : salaires, pensions, allocations familiales, etc.',
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
          icon_emoji: '🏡',
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
      const nationalityResponse = responses.q_nationalite_cat;
      let eligibilityCategory = 'C'; // Par défaut
      
      // Déterminer la catégorie d'éligibilité basée sur la nationalité
      if (nationalityResponse) {
        // Si c'est un code pays, récupérer la catégorie d'éligibilité
        const questions = await this.loadQuestions();
        const nationalityQuestion = questions.find(q => q.key_reponse === 'q_nationalite_cat');
        const nationalityData = nationalityQuestion?.options_json[nationalityResponse];
        
        if (nationalityData && nationalityData.eligibility) {
          eligibilityCategory = nationalityData.eligibility;
        } else if (['opt_A'].includes(nationalityResponse)) {
          eligibilityCategory = 'A';
        } else if (['opt_B'].includes(nationalityResponse)) {
          eligibilityCategory = 'B';
        }
      }
      
      if (
        responses.q_residence_lux === 'opt_oui' &&
        responses.q_sejour_legal_rnpp === 'opt_oui' &&
        ['A', 'B'].includes(eligibilityCategory) &&
        (parseInt(responses.q_age_exact) >= 25 || responses.q_parent_enceinte === 'opt_oui') &&
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
        responses.q_nb_enfants_exact && 
        responses.q_enfants_scolarises === 'opt_oui' && 
        responses.q_revenus_nets_exact &&
        parseInt(responses.q_revenus_nets_exact) < 3000
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
      if (responses.q_revenus_nets_exact && parseInt(responses.q_revenus_nets_exact) < 3500 && responses.q_logement_situation === 'opt_A') {
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
      if (responses.q_revenus_nets_exact && parseInt(responses.q_revenus_nets_exact) < 3000) {
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
      // Traductions étendues pour toutes les langues supportées
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
          'Avez-vous 25 ans oder méi ?': 
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
            'SinnÄr monatleg netto Akommes vum Stot ënner 3000€?',
          'Quelle est votre situation de logement ?': 
            'Wéi ass Är Wunnsituatioun?',
          'Avez-vous des enfants scolarisés entre 6 et 18 ans ?': 
            'Hutt Dir Schoolkanner tëschent 6 an 18 Joer?'
        },
        'en': {
          'Habitez-vous et résidez-vous de façon principale au Luxembourg ?': 
            'Do you live and reside primarily in Luxembourg?',
          'Avez-vous un titre de séjour valide au Luxembourg ?': 
            'Do you have a valid residence permit in Luxembourg?',
          'Quelle est votre nationalité ?': 
            'What is your nationality?',
          'Avez-vous 25 ans ou plus ?': 
            'Are you 25 years old or older?',
          'Avez-vous des enfants à charge de moins de 18 ans ?': 
            'Do you have dependent children under 18 years old?',
          'Combien d\'enfants à charge avez-vous ?': 
            'How many dependent children do you have?',
          'Êtes-vous inscrit(e) comme demandeur d\'emploi à l\'ADEM ?': 
            'Are you registered as a job seeker with ADEM?',
          'Combien de personnes composent votre foyer ?': 
            'How many people make up your household?',
          'Vos revenus mensuels nets du foyer sont-ils inférieurs à 3000€ ?': 
            'Is your household\'s monthly net income less than €3000?',
          'Quelle est votre situation de logement ?': 
            'What is your housing situation?',
          'Avez-vous des enfants scolarisés entre 6 et 18 ans ?': 
            'Do you have school-age children between 6 and 18 years old?'
        },
        'pt': {
          'Habitez-vous et résidez-vous de façon principale au Luxembourg ?': 
            'Vive e reside principalmente no Luxemburgo?',
          'Avez-vous un titre de séjour valide au Luxembourg ?': 
            'Tem uma autorização de residência válida no Luxemburgo?',
          'Quelle est votre nationalité ?': 
            'Qual é a sua nacionalidade?',
          'Avez-vous 25 ans ou mais ?': 
            'Tem 25 anos ou mais?',
          'Avez-vous des enfants à charge de moins de 18 ans ?': 
            'Tem filhos dependentes com menos de 18 anos?',
          'Combien d\'enfants à charge avez-vous ?': 
            'Quantos filhos dependentes tem?',
          'Êtes-vous inscrit(e) como demandeur d\'emploi à l\'ADEM ?': 
            'Está inscrito como candidato a emprego na ADEM?',
          'Combien de personnes composent votre foyer ?': 
            'Quantas pessoas compõem o seu agregado familiar?',
          'Vos revenus mensuels nets du foyer sont-ils inférieurs à 3000€ ?': 
            'Os rendimentos líquidos mensais do seu agregado são inferiores a 3000€?',
          'Quelle est votre situation de logement ?': 
            'Qual é a sua situação habitacional?',
          'Avez-vous des enfants scolarisés entre 6 et 18 ans ?': 
            'Tem filhos em idade escolar entre os 6 e 18 anos?'
        },
        'es': {
          'Habitez-vous et résidez-vous de façon principale au Luxembourg ?': 
            '¿Vive y reside principalmente en Luxemburgo?',
          'Avez-vous un titre de séjour valide au Luxembourg ?': 
            '¿Tiene un permiso de residencia válido en Luxemburgo?',
          'Quelle est votre nationalité ?': 
            '¿Cuál es su nacionalidad?',
          'Avez-vous 25 ans o más ?': 
            '¿Tiene 25 años o más?',
          'Avez-vous des enfants à charge de moins de 18 ans ?': 
            '¿Tiene hijos dependientes menores de 18 años?',
          'Combien d\'enfants à charge avez-vous ?': 
            '¿Cuántos hijos dependientes tiene?',
          'Êtes-vous inscrit(e) como demandeur d\'emploi à l\'ADEM ?': 
            '¿Está registrado como solicitante de empleo en ADEM?',
          'Combien de personnes composent votre foyer ?': 
            '¿Cuántas personas componen su hogar?',
          'Vos revenus mensuels nets du foyer sont-ils inférieurs à 3000€ ?': 
            '¿Los ingresos netos mensuales de su hogar son inferiores a 3000€?',
          'Quelle est votre situation de logement ?': 
            '¿Cuál es su situación de vivienda?',
          'Avez-vous des enfants scolarisés entre 6 et 18 ans ?': 
            '¿Tiene hijos en edad escolar entre 6 y 18 años?'
        },
        'it': {
          'Habitez-vous et résidez-vous de façon principale au Luxembourg ?': 
            'Vive e risiede principalmente in Lussemburgo?',
          'Avez-vous un titre de séjour valide au Luxembourg ?': 
            'Ha un permesso di soggiorno valido in Lussemburgo?',
          'Quelle est votre nationalité ?': 
            'Qual è la sua nazionalità?',
          'Avez-vous 25 ans o più ?': 
            'Ha 25 anni o più?',
          'Avez-vous des enfants à charge de moins de 18 ans ?': 
            'Ha figli a carico di età inferiore ai 18 anni?',
          'Combien d\'enfants à charge avez-vous ?': 
            'Quanti figli a carico ha?',
          'Êtes-vous inscrit(e) come demandeur d\'emploi à l\'ADEM ?': 
            'È registrato come cerca lavoro presso ADEM?',
          'Combien de personnes composent votre foyer ?': 
            'Quante persone compongono il suo nucleo familiare?',
          'Vos revenus mensuels nets du foyer sont-ils inférieurs à 3000€ ?': 
            'Il reddito netto mensile del suo nucleo è inferiore a 3000€?',
          'Quelle est votre situation de logement ?': 
            'Qual è la sua situazione abitativa?',
          'Avez-vous des enfants scolarisés entre 6 et 18 ans ?': 
            'Ha figli in età scolare tra i 6 e i 18 anni?'
        },
        'ar': {
          'Habitez-vous et résidez-vous de façon principale au Luxembourg ?': 
            'هل تعيش وتقيم بشكل أساسي في لوكسمبورغ؟',
          'Avez-vous un titre de séjour valide au Luxembourg ?': 
            'هل لديك تصريح إقامة صالح في لوكسمبورغ؟',
          'Quelle est votre nationalité ?': 
            'ما هي جنسيتك؟',
          'Avez-vous 25 ans أو أكثر؟': 
            'هل عمرك 25 سنة أو أكثر؟',
          'Avez-vous des enfants عند تربية أطفال تحت 18 سنة؟': 
            'هل لديك أطفال تحت 18 سنة تعولهم؟',
          'Combien d\'enfants عند تربية أطفال؟': 
            'كم عدد الأطفال الذين تعولهم؟',
          'Êtes-vous inscrit(e) comme demandeur d\'emploi عند الإعلان عن الوظيفة؟': 
            'هل أنت مسجل كباحث عن عمل في ADEM؟',
          'Combien de الأشخاص الذين يصلحون لمنزلك؟': 
            'كم عدد الأشخاص الذين يصلحون لمنزلك؟',
          'هل دخل منزلك الإيرادات الصافية الشهرية أقل من 3000€؟': 
            'هل دخل منزلك الإيرادات الصافية الشهرية أقل من 3000€؟',
          'ما هي حالة سكنك؟': 
            'ما هي حالة سكنك؟',
          'آیا فرزندان دانش‌آموز بین ۶ تا ۱۸ سال دارید؟': 
            'آیا فرزندان دانش‌آموز بین ۶ تا ۱۸ سال دارید؟'
        },
        'pl': {
          'Habitez-vous et résidez-vous de façon principale au Luxembourg ?': 
            'Czy mieszka Pan/Pani głównie w Luksemburgu?',
          'Avez-vous un titre de séjour valide au Luxembourg ?': 
            'Czy ma Pan/Pani ważne zezwolenie na pobyt w Luksemburgu?',
          'Quelle est votre nationalité ?': 
            'Jakie jest Pana/Pani obywatelstwo?',
          'Avez-vous 25 ans lub więcej ?': 
            'Czy ma Pan/Pani 25 lat lub więcej?',
          'Avez-vous des enfants à charge de moins de 18 ans ?': 
            'Czy ma Pan/Pani dzieci na utrzymaniu poniżej 18 lat?',
          'Combien d\'enfants à charge avez-vous ?': 
            'Ile dzieci ma Pan/Pani na utrzymaniu?',
          'Êtes-vous inscrit(e) comme demandeur d\'emploi à l\'ADEM ?': 
            'Czy jest Pan/Pani zarejestrowany jako poszukujący pracy w ADEM?',
          'Combien de personnes composent votre foyer ?': 
            'Ile osób składa się na Pana/Pani gospodarstwo domowe?',
          'Vos revenus mensuels nets du foyer sont-ils inférieurs à 3000€ ?': 
            'Czy miesięczne dochody netto gospodarstwa są niższe niż 3000€?',
          'Quelle est votre situation de logement ?': 
            'Jaka jest Pana/Pani sytuacja mieszkaniowa?',
          'Avez-vous des enfants scolarisés entre 6 et 18 ans ?': 
            'Czy ma Pan/Pani dzieci w wieku szkolnym między 6 a 18 lat?'
        },
        'ru': {
          'Habitez-vous et résidez-vous de façon principale au Luxembourg ?': 
            'Проживаете ли вы постоянно в Люксембурге?',
          'Avez-vous un titre de séjour valide au Luxembourg ?': 
            'Есть ли у вас действующее разрешение на пребывание в Люксембурге?',
          'Quelle est votre nationalité ?': 
            'Какое у вас гражданство?',
          'Avez-vous 25 лет или больше ?': 
            'Вам 25 лет или больше?',
          'Avez-vous des enfants на иждивении младше 18 лет ?': 
            'Есть ли у вас дети на иждивении младше 18 лет?',
          'Combien d\'enfants на иждивении ?': 
            'Сколько у вас детей на иждивении?',
          'Êtes-vous inscrit(e) как ищущий работу в ADEM ?': 
            'Зарегистрированы ли вы как ищущий работу в ADEM?',
          'Combien de людей в вашем домохозяйстве ?': 
            'Сколько человек в вашем домохозяйстве?',
          'Ваш месячный чистый доход домохозяйства менее 3000€ ?': 
            'Ваш месячный чистый доход домохозяйства менее 3000€?',
          'Какая у вас жилищная ситуация ?': 
            'Какая у вас жилищная ситуация?',
          'Есть ли у вас дети школьного возраста от 6 до 18 лет ?': 
            'Есть ли у вас дети школьного возраста от 6 до 18 лет?'
        },
        'nl': {
          'Habitez-vous et résidez-vous de façon principale au Luxembourg ?': 
            'Woont en verblijft u hoofdzakelijk in Luxemburg?',
          'Avez-vous un titre de séjour valide au Luxembourg ?': 
            'Heeft u een geldige verblijfsvergunning in Luxemburg?',
          'Quelle est votre nationalité ?': 
            'Wat is uw nationaliteit?',
          'Avez-vous 25 jaar of ouder ?': 
            'Bent u 25 jaar of ouder?',
          'Avez-vous des enfants ten laste jonger dan 18 jaar ?': 
            'Heeft u kinderen ten laste jonger dan 18 jaar?',
          'Combien d\'enfants heeft u ten laste ?': 
            'Hoeveel kinderen heeft u ten laste?',
          'Êtes-vous ingeschreven als werkzoekende bij ADEM ?': 
            'Bent u ingeschreven als werkzoekende bij ADEM?',
          'Uit hoeveel personen bestaat uw huishouden ?': 
            'Uit hoeveel personen bestaat uw huishouden?',
          'Is het maandelijkse netto-inkomen van uw huishouden minder dan €3000 ?': 
            'Is het maandelijkse netto-inkomen van uw huishouden minder dan €3000?',
          'Wat is uw woonsituatie ?': 
            'Wat is uw woonsituatie?',
          'Heeft u schoolgaande kinderen tussen 6 en 18 jaar ?': 
            'Heeft u schoolgaande kinderen tussen 6 en 18 jaar?'
        },
        'tr': {
          'Habitez-vous et résidez-vous de façon principale au Luxembourg ?': 
            'Lüksemburg\'da yaşıyor ve oturuyorsunuz mu?',
          'Avez-vous un titre de séjour valide au Luxembourg ?': 
            'Lüksemburg\'da geçerli bir oturma izniniz var mı?',
          'Quelle est votre nationalité ?': 
            'Vatandaşlığınız nedir?',
          'Avez-vous 25 yaşında veya daha büyük müsünüz ?': 
            '25 yaşında veya daha büyük müsünüz?',
          'Avez-vous des enfants 18 yaşından küçük bakmakla yükümlü olduğunuz çocuklarınız var mı ?': 
            '18 yaşından küçük bakmakla yükümlü olduğunuz çocuklarınız var mı?',
          'Kaç çocuğunuz var ?': 
            'Kaç çocuğunuz var?',
          'Êtes-vous inscrit(e) comme demandeur d\'emploi à l\'ADEM ?': 
            'ADEM\'de iş arayan olarak kayıtlı mısınız?',
          'Combien de personnes composent votre foyer ?': 
            'Hanenizde kaç kişi yaşıyor?',
          'Vos revenus mensuels nets du foyer sont-ils inférieurs à 3000€ ?': 
            'Hanenizin aylık net geliri 3000€\'dan az mı?',
          'Quelle est votre situation de logement ?': 
            'Konut durumunuz nedir?',
          'Avez-vous des enfants scolarisés entre 6 et 18 ans ?': 
            '6-18 yaş arası okul çağında çocuklarınız var mı?'
        },
        'fa': {
          'Habitez-vous et résidez-vous de façon principale au Luxembourg ?': 
            'آیا عمدتاً در لوکزامبورگ زندگی و اقامت دارید؟',
          'Avez-vous un titre de séjour valide au Luxembourg ?': 
            'آیا مجوز اقامت معتبری در لوکزامبورگ دارید؟',
          'Quelle est votre nationalité ?': 
            'ملیت شما چیست؟',
          'Avez-vous 25 ساله یا بالاتر هستید؟': 
            'آیا ۲۵ ساله یا بالاتر هستید؟',
          'آیا فرزندان تحت تکفل زیر ۱۸ سال دارید؟': 
            'آیا فرزندان تحت تکفل زیر ۱۸ سال دارید؟',
          'چند فرزند تحت تکفل دارید؟': 
            'چند فرزند تحت تکفل دارید؟',
          'آیا در ADEM به عنوان جویای کار ثبت نام کرده‌اید؟': 
            'آیا در ADEM به عنوان جویای کار ثبت نام کرده‌اید؟',
          'خانواده شما از چند نفر تشکیل شده؟': 
            'خانواده شما از چند نفر تشکیل شده؟',
          'آیا درآمد ماهانه خالص خانواده شما کمتر از ۳۰۰۰ یورو است؟': 
            'آیا درآمد ماهانه خالص خانواده شما کمتر از ۳۰۰۰ یورو است؟',
          'وضعیت مسکن شما چگونه است؟': 
            'وضعیت مسکن شما چگونه است؟',
          'آیا فرزندان دانش‌آموز بین ۶ تا ۱۸ سال دارید؟': 
            'آیا فرزندان دانش‌آموز بین ۶ تا ۱۸ سال دارید؟'
        },
        'ur': {
          'Habitez-vous et résidez-vous de façon principale au Luxembourg ?': 
            'کیا آپ بنیادی طور پر لکسمبرگ میں رہتے اور بستے ہیں؟',
          'Avez-vous un titre de séjour valide au Luxembourg ?': 
            'کیا آپ کے پاس لکسمبرگ میں قانونی اقامت کی اجازت ہے؟',
          'Quelle est votre nationalité ?': 
            'آپ کی قومیت کیا ہے؟',
          'Avez-vous 25 سال یا اس سے زیادہ ہے؟': 
            'کیا آپ کی عمر 25 سال یا اس سے زیادہ ہے؟',
          'کیا آپ کے 18 سال سے کم عمر کے بچے ہیں؟': 
            'کیا آپ کے 18 سال سے کم عمر کے بچے ہیں؟',
          'آپ کے کتنے بچے ہیں؟': 
            'آپ کے کتنے بچے ہیں؟',
          'آیا آپ ADEM میں ملازمت کے طالب کے طور پر رجسٹرڈ ہیں؟': 
            'آیا آپ ADEM میں ملازمت کے طالب کے طور پر رجسٹرڈ ہیں؟',
          'آپ کے گھر میں کتنے لوگ رہتے ہیں؟': 
            'آپ کے گھر میں کتنے لوگ رہتے ہیں؟',
          'آیا آپ کے گھر کی ماہانہ خالص آمدنی 3000€ سے کم ہے؟': 
            'آیا آپ کے گھر کی ماہانہ خالص آمدنی 3000€ سے کم ہے؟',
          'آپ کی رہائش کی صورتحال کیا ہے؟': 
            'آپ کی رہائش کی صورتحال کیا ہے؟',
          'آیا آپ کے 6 سے 18 سال کی عمر کے سکول جانے والے بچے ہیں؟': 
            'آیا آپ کے 6 سے 18 سال کی عمر کے سکول جانے والے بچے ہیں؟'
        },
        'ro': {
          'Habitez-vous et résidez-vous de façon principale au Luxembourg ?': 
            'Locuiți și rezidați în principal în Luxemburg?',
          'Avez-vous un titre de séjour valide au Luxembourg ?': 
            'Aveți o autorizație de ședere validă în Luxemburg?',
          'Quelle est votre nationalité ?': 
            'Care este naționalitatea dumneavoastră?',
          'Avez-vous 25 de ani sau mai mult ?': 
            'Aveți 25 de ani sau mai mult?',
          'Aveți copii în întreținere sub 18 ani ?': 
            'Aveți copii în întreținere sub 18 ani?',
          'Câți copii aveți în întreținere ?': 
            'Câți copii aveți în întreținere?',
          'Sunteți înregistrat ca solicitant de locuri de muncă la ADEM ?': 
            'Sunteți înregistrat ca solicitant de locuri de muncă la ADEM?',
          'Din câte persoane este compusă gospodăria dumneavoastră ?': 
            'Din câte persoane este compusă gospodăria dumneavoastră?',
          'Veniturile nete lunare ale gospodăriei sunt mai mici de 3000€ ?': 
            'Veniturile nete lunare ale gospodăriei sunt mai mici de 3000€?',
          'Care este situația dumneavoastră de locuință ?': 
            'Care este situația dumneavoastră de locuință?',
          'Aveți copii școlari între 6 și 18 ani ?': 
            'Aveți copii școlari între 6 și 18 ani?'
        }
        // Maintenant toutes les 15 langues supportées sont couvertes
      };

      const translatedQuestion = translations[targetLanguage]?.[question.question] || question.question;

      // Traduire les options de base (Oui/Non)
      let translatedOptions = question.options_json;
      
      const optionTranslations: Record<string, Record<string, string>> = {
        'de': { opt_oui: 'Ja', opt_non: 'Nein' },
        'lu': { opt_oui: 'Jo', opt_non: 'Nee' },
        'en': { opt_oui: 'Yes', opt_non: 'No' },
        'pt': { opt_oui: 'Sim', opt_non: 'Não' },
        'es': { opt_oui: 'Sí', opt_non: 'No' },
        'it': { opt_oui: 'Sì', opt_non: 'No' },
        'ar': { opt_oui: 'نعم', opt_non: 'لا' },
        'pl': { opt_oui: 'Tak', opt_non: 'Nie' },
        'ru': { opt_oui: 'Да', opt_non: 'Нет' },
        'nl': { opt_oui: 'Ja', opt_non: 'Nee' },
        'tr': { opt_oui: 'Evet', opt_non: 'Hayır' },
        'fa': { opt_oui: 'بله', opt_non: 'خیر' },
        'ur': { opt_oui: 'ہاں', opt_non: 'نہیں' },
        'ro': { opt_oui: 'Da', opt_non: 'Nu' }
      };

      if (optionTranslations[targetLanguage]) {
        translatedOptions = {
          ...question.options_json,
          ...optionTranslations[targetLanguage]
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