import { supabase } from '../lib/supabase/client';

export interface MapLocation {
  id: string;
  nom_fr: string;
  nom_de?: string;
  nom_en?: string;
  nom_lu?: string;
  nom_pt?: string;
  nom_es?: string;
  nom_ar?: string;
  nom_uk?: string;
  description_fr?: string;
  description_de?: string;
  description_en?: string;
  adresse_fr?: string;
  adresse_de?: string;
  adresse_en?: string;
  notes_fr?: string;
  notes_de?: string;
  notes_en?: string;
  latitude: number;
  longitude: number;
  telephone?: string;
  email?: string;
  site_web?: string;
  categorie: string;
  type_service_fr?: string;
  type_service_de?: string;
  type_service_en?: string;
  actif?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface HorairesOuverture {
  id: string;
  location_id: string;
  jour_semaine: number; // 1=Lundi, 7=Dimanche
  heure_ouverture_matin?: string;
  heure_fermeture_matin?: string;
  heure_ouverture_apres_midi?: string;
  heure_fermeture_apres_midi?: string;
  ferme: boolean;
  ouvert_24h: boolean;
}

export class MapService {
  // Récupérer tous les services actifs
  static async getActiveLocations(langue: string = 'fr'): Promise<MapLocation[]> {
    try {
      const { data, error } = await supabase
        .from('map_locations')
        .select('*')
        .eq('actif', true)
        .order('nom_fr');

      if (error) {
        console.error('Erreur lors du chargement des services:', error);
        // Retourner des données de fallback si la nouvelle structure n'existe pas encore
        return this.getFallbackData();
      }

      return data || [];
    } catch (error) {
      console.error('Erreur de connexion:', error);
      return this.getFallbackData();
    }
  }

  // Récupérer un service par ID avec ses horaires
  static async getLocationById(id: string): Promise<MapLocation | null> {
    try {
      const { data, error } = await supabase
        .from('map_locations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors du chargement du service:', error);
      return null;
    }
  }

  // Récupérer les horaires d'un service
  static async getHoraires(locationId: string): Promise<HorairesOuverture[]> {
    try {
      const { data, error } = await supabase
        .from('horaires_ouverture')
        .select('*')
        .eq('location_id', locationId)
        .order('jour_semaine');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors du chargement des horaires:', error);
      return [];
    }
  }

  // Rechercher des services par catégorie
  static async getLocationsByCategory(categorie: string): Promise<MapLocation[]> {
    try {
      const { data, error } = await supabase
        .from('map_locations')
        .select('*')
        .eq('categorie', categorie)
        .eq('actif', true)
        .order('nom_fr');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la recherche par catégorie:', error);
      return [];
    }
  }

  // Recherche textuelle
  static async searchLocations(query: string, langue: string = 'fr'): Promise<MapLocation[]> {
    try {
      const searchColumn = `nom_${langue}`;
      const descriptionColumn = `description_${langue}`;
      
      const { data, error } = await supabase
        .from('map_locations')
        .select('*')
        .or(`${searchColumn}.ilike.%${query}%,${descriptionColumn}.ilike.%${query}%`)
        .eq('actif', true)
        .order('nom_fr');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      return [];
    }
  }

  // Obtenir le nom dans la langue demandée
  static getLocalizedName(location: MapLocation, langue: string = 'fr'): string {
    const nameKey = `nom_${langue}` as keyof MapLocation;
    return (location[nameKey] as string) || location.nom_fr || 'Service sans nom';
  }

  // Obtenir la description dans la langue demandée
  static getLocalizedDescription(location: MapLocation, langue: string = 'fr'): string {
    const descKey = `description_${langue}` as keyof MapLocation;
    return (location[descKey] as string) || location.description_fr || '';
  }

  // Obtenir l'adresse dans la langue demandée
  static getLocalizedAddress(location: MapLocation, langue: string = 'fr'): string {
    const addrKey = `adresse_${langue}` as keyof MapLocation;
    return (location[addrKey] as string) || location.adresse_fr || '';
  }

  // Obtenir les notes dans la langue demandée
  static getLocalizedNotes(location: MapLocation, langue: string = 'fr'): string {
    const notesKey = `notes_${langue}` as keyof MapLocation;
    return (location[notesKey] as string) || location.notes_fr || '';
  }

  // Formater les horaires pour affichage
  static formatHoraires(horaires: HorairesOuverture[], langue: string = 'fr'): string {
    if (!horaires.length) return 'Horaires non disponibles';

    const joursNoms = {
      fr: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
      de: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'],
      en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    };

    const noms = joursNoms[langue as keyof typeof joursNoms] || joursNoms.fr;

    return horaires.map(h => {
      const jour = noms[h.jour_semaine - 1];
      
      if (h.ferme) return `${jour}: Fermé`;
      if (h.ouvert_24h) return `${jour}: 24h/24`;
      
      let horaire = jour + ': ';
      if (h.heure_ouverture_matin && h.heure_fermeture_matin) {
        horaire += `${h.heure_ouverture_matin}-${h.heure_fermeture_matin}`;
      }
      if (h.heure_ouverture_apres_midi && h.heure_fermeture_apres_midi) {
        if (h.heure_ouverture_matin) horaire += ', ';
        horaire += `${h.heure_ouverture_apres_midi}-${h.heure_fermeture_apres_midi}`;
      }
      
      return horaire;
    }).join('\n');
  }

  // Données de fallback si la nouvelle structure n'existe pas encore
  private static getFallbackData(): MapLocation[] {
    return [
      {
        id: '1',
        nom_fr: 'Banque Alimentaire Luxembourg',
        nom_de: 'Lebensmittelbank Luxemburg',
        nom_en: 'Food Bank Luxembourg',
        description_fr: 'Distribution gratuite de denrées alimentaires aux personnes dans le besoin',
        description_de: 'Kostenlose Verteilung von Lebensmitteln an Bedürftige',
        description_en: 'Free distribution of food to people in need',
        adresse_fr: '33 Rue de Strasbourg, 2560 Luxembourg',
        notes_fr: 'Pour qui: Familles en difficulté financière, personnes isolées. Quoi: Colis alimentaires gratuits, produits frais et secs. Comment: Sur présentation de justificatifs de revenus, inscription préalable recommandée.',
        latitude: 49.6116,
        longitude: 6.1319,
        telephone: '+352 26 39 04 1',
        email: 'info@banquealimentaire.lu',
        site_web: 'https://www.banquealimentaire.lu',
        categorie: 'aide_alimentaire',
        type_service_fr: 'Distribution alimentaire',
        actif: true
      },
      {
        id: '2',
        nom_fr: 'Caritas Luxembourg',
        nom_de: 'Caritas Luxemburg',
        nom_en: 'Caritas Luxembourg',
        description_fr: 'Aide sociale et accompagnement des personnes en difficulté',
        description_de: 'Soziale Hilfe und Begleitung von Menschen in Not',
        description_en: 'Social assistance and support for people in difficulty',
        adresse_fr: '29 Rue Michel Welter, 2730 Luxembourg',
        notes_fr: 'Pour qui: Toute personne en situation de précarité. Quoi: Accompagnement social, aide administrative, soutien psychologique. Comment: Prise de rendez-vous par téléphone, accueil sans condition.',
        latitude: 49.6097,
        longitude: 6.1296,
        telephone: '+352 40 21 31 1',
        email: 'info@caritas.lu',
        site_web: 'https://www.caritas.lu',
        categorie: 'aide_sociale',
        type_service_fr: 'Accompagnement social',
        actif: true
      },
      {
        id: '3',
        nom_fr: 'Croix-Rouge Luxembourg',
        nom_de: 'Rotes Kreuz Luxemburg',
        nom_en: 'Red Cross Luxembourg',
        description_fr: 'Services d\'urgence sociale et aide humanitaire',
        description_de: 'Soziale Notdienste und humanitäre Hilfe',
        description_en: 'Social emergency services and humanitarian aid',
        adresse_fr: '44 Boulevard Joseph II, 1840 Luxembourg',
        notes_fr: 'Pour qui: Personnes en situation d\'urgence sociale, migrants, sans-abri. Quoi: Hébergement d\'urgence, aide alimentaire, vêtements. Comment: Accueil 24h/24 pour urgences, services sociaux sur rendez-vous.',
        latitude: 49.6116,
        longitude: 6.1300,
        telephone: '+352 27 55 4000',
        email: 'info@croix-rouge.lu',
        site_web: 'https://www.croix-rouge.lu',
        categorie: 'urgence_sociale',
        type_service_fr: 'Services d\'urgence',
        actif: true
      }
    ];
  }
} 