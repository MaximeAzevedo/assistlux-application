import { supabase } from '../lib/supabase/client';

// Types pour la configuration des aides sociales
export interface ConfigAide {
  id: number;
  nom_aide: string;
  description_courte: string;
  description_longue: string;
  actif: boolean;
  ordre_affichage: number;
  icone: string;
  couleur: string;
  created_at: string;
  updated_at: string;
}

export interface Etape {
  id: number;
  aide_id: number;
  nom_etape: string;
  description: string;
  ordre: number;
  obligatoire: boolean;
  conditions_affichage?: any;
  created_at: string;
}

export interface ChampFormulaire {
  id: number;
  etape_id: number;
  nom_champ: string;
  type_champ: string;
  label_fr?: string;
  label_de?: string;
  label_en?: string;
  label_lu?: string;
  label_pt?: string;
  placeholder_fr?: string;
  placeholder_de?: string;
  placeholder_en?: string;
  placeholder_lu?: string;
  placeholder_pt?: string;
  obligatoire: boolean;
  ordre: number;
  options_select?: any;
  validation_regex?: string;
  message_erreur_fr?: string;
  message_erreur_de?: string;
  message_erreur_en?: string;
  message_erreur_lu?: string;
  message_erreur_pt?: string;
  conditions_affichage?: any;
  created_at: string;
}

export interface Document {
  id: number;
  aide_id: number;
  nom_document: string;
  description_fr?: string;
  description_de?: string;
  description_en?: string;
  description_lu?: string;
  description_pt?: string;
  obligatoire: boolean;
  formats_acceptes: string;
  taille_max_mb: number;
  conditions_requises?: any;
  ordre: number;
  created_at: string;
}

export interface Message {
  id: number;
  cle: string;
  fr?: string;
  de?: string;
  en?: string;
  lu?: string;
  pt?: string;
  contexte?: string;
  created_at: string;
  updated_at: string;
}

export interface Bareme {
  id: number;
  aide_id: number;
  nom_bareme: string;
  type_calcul: string;
  parametres: any;
  conditions?: any;
  actif: boolean;
  date_debut?: string;
  date_fin?: string;
  created_at: string;
}

export interface AdresseEnvoi {
  id: number;
  aide_id: number;
  nom_organisme: string;
  adresse_ligne1?: string;
  adresse_ligne2?: string;
  code_postal?: string;
  ville?: string;
  pays: string;
  telephone?: string;
  email?: string;
  horaires_ouverture?: string;
  type_envoi: string;
  url_envoi_ligne?: string;
  created_at: string;
}

export interface ModeleFichier {
  id: number;
  aide_id: number;
  nom_modele: string;
  type_fichier?: string;
  template_content?: string;
  variables_disponibles?: any;
  langue: string;
  created_at: string;
}

export interface ConfigurationTechnique {
  id: number;
  cle: string;
  valeur: string;
  type_valeur: string;
  description?: string;
  modifiable: boolean;
  created_at: string;
  updated_at: string;
}

export interface StatistiqueValidation {
  id: number;
  table_name: string;
  exists: boolean;
  error?: string;
  count?: string;
  created_at: string;
}

export class FormConfigService {
  private static instance: FormConfigService;

  static getInstance(): FormConfigService {
    if (!FormConfigService.instance) {
      FormConfigService.instance = new FormConfigService();
    }
    return FormConfigService.instance;
  }

  private cache: Map<string, any> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    return expiry ? Date.now() < expiry : false;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_DURATION);
  }

  private getCache(key: string): any {
    if (this.isCacheValid(key)) {
      return this.cache.get(key);
    }
    return null;
  }

  // Récupérer toutes les aides disponibles
  async getAides(): Promise<ConfigAide[]> {
    const cacheKey = 'aides';
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('config_aide')
        .select('*')
        .eq('actif', true)
        .order('ordre_affichage');

      if (error) throw error;
      
      this.setCache(cacheKey, data || []);
      return data || [];
    } catch (error) {
      console.error('Erreur lors du chargement des aides:', error);
      throw error;
    }
  }

  // Récupérer la configuration complète d'une aide
  async getConfigurationAide(aideId: number): Promise<{
    aide: ConfigAide;
    etapes: Etape[];
    champs: ChampFormulaire[];
    documents: Document[];
    baremes: Bareme[];
    adresseEnvoi: AdresseEnvoi[];
    modelesFichiers: ModeleFichier[];
    statistiquesValidation: StatistiqueValidation[];
  }> {
    const cacheKey = `config_${aideId}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      // Charger les données de base en parallèle (seulement les tables qui existent)
      const [
        aideResult,
        etapesResult,
        documentsResult,
        baremesResult
      ] = await Promise.all([
        supabase.from('config_aide').select('*').eq('id', aideId).single(),
        supabase.from('etapes').select('*').eq('aide_id', aideId).order('ordre'),
        supabase.from('documents').select('*').eq('aide_id', aideId).order('ordre'),
        supabase.from('baremes').select('*').eq('aide_id', aideId)
      ]);

      // Vérifier les erreurs des requêtes de base
      const errors = [
        aideResult.error,
        etapesResult.error,
        documentsResult.error,
        baremesResult.error
      ].filter((error): error is NonNullable<typeof error> => error !== null);

      if (errors.length > 0) {
        throw new Error(`Erreurs lors du chargement: ${errors.map(e => e.message).join(', ')}`);
      }

      // Récupérer les champs pour chaque étape (CORRECTION DU BUG)
      const tousLesChamps: ChampFormulaire[] = [];
      if (etapesResult.data && etapesResult.data.length > 0) {
        for (const etape of etapesResult.data) {
          const { data: champsEtape, error: champsError } = await supabase
            .from('champs_formulaire')
            .select('*')
            .eq('etape_id', etape.id)  // ✅ CORRECTION: utiliser etape_id au lieu de aide_id
            .order('ordre');

          if (champsError) {
            console.error(`Erreur lors du chargement des champs pour l'étape ${etape.id}:`, champsError);
          } else {
            tousLesChamps.push(...(champsEtape || []));
          }
        }
      }

      const config = {
        aide: aideResult.data,
        etapes: etapesResult.data || [],
        champs: tousLesChamps,
        documents: documentsResult.data || [],
        baremes: baremesResult.data || [],
        adresseEnvoi: [], // Table n'existe pas encore
        modelesFichiers: [], // Table n'existe pas encore
        statistiquesValidation: [] // Table n'existe pas encore
      };

      this.setCache(cacheKey, config);
      return config;
    } catch (error) {
      console.error(`Erreur lors du chargement de la configuration pour l'aide ${aideId}:`, error);
      throw error;
    }
  }

  // Récupérer les étapes d'une aide
  async getEtapesAide(aideId: number): Promise<Etape[]> {
    const cacheKey = `etapes_${aideId}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('etapes')
        .select('*')
        .eq('aide_id', aideId)
        .order('ordre');

      if (error) throw error;
      
      this.setCache(cacheKey, data || []);
      return data || [];
    } catch (error) {
      console.error(`Erreur lors du chargement des étapes pour l'aide ${aideId}:`, error);
      throw error;
    }
  }

  // Récupérer les champs d'une étape
  async getChampsEtape(etapeId: number): Promise<ChampFormulaire[]> {
    const cacheKey = `champs_${etapeId}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('champs_formulaire')
        .select('*')
        .eq('etape_id', etapeId)
        .order('ordre');

      if (error) throw error;
      
      this.setCache(cacheKey, data || []);
      return data || [];
    } catch (error) {
      console.error(`Erreur lors du chargement des champs pour l'étape ${etapeId}:`, error);
      throw error;
    }
  }

  // Récupérer un message traduit
  async getMessage(cle: string, langue: string = 'fr'): Promise<string> {
    const cacheKey = `message_${cle}_${langue}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`${langue}, cle`)  // Sélectionner la colonne de langue et cle
        .eq('cle', cle)
        .single();

      if (error) {
        // Fallback vers le français si la langue demandée n'existe pas
        if (langue !== 'fr') {
          return this.getMessage(cle, 'fr');
        }
        throw error;
      }
      
      const message = (data as any)?.[langue] || cle;  // Cast explicite pour éviter l'erreur TypeScript
      this.setCache(cacheKey, message);
      return message;
    } catch (error) {
      console.error(`Erreur lors du chargement du message ${cle} en ${langue}:`, error);
      return cle; // Retourner la clé si le message n'est pas trouvé
    }
  }

  // Récupérer la configuration technique
  async getConfigTechnique(cle: string): Promise<any> {
    const cacheKey = `config_tech_${cle}`;
    const cached = this.getCache(cacheKey);
    if (cached !== null) return cached;

    try {
      const { data, error } = await supabase
        .from('configuration_technique')
        .select('*')
        .eq('cle', cle)
        .single();

      if (error) throw error;
      
      let valeur = data.valeur;
      
      // Parser selon le type
      switch (data.type_valeur) {
        case 'number':
          valeur = parseFloat(valeur);
          break;
        case 'boolean':
          valeur = valeur === 'true';
          break;
        case 'json':
          valeur = JSON.parse(valeur);
          break;
        default:
          // string - pas de transformation
          break;
      }
      
      this.setCache(cacheKey, valeur);
      return valeur;
    } catch (error) {
      console.error(`Erreur lors du chargement de la configuration technique ${cle}:`, error);
      throw error;
    }
  }

  // Vider le cache
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  // Tester la connexion à la base de données
  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('config_aide')
        .select('count')
        .limit(1);

      return !error;
    } catch (error) {
      console.error('Erreur de connexion à Supabase:', error);
      return false;
    }
  }
}

// Export de l'instance singleton
export const formConfigService = FormConfigService.getInstance(); 