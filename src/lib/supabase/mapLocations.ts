import { createClient } from '@supabase/supabase-js';
import { MapLocation, MapCategory } from '../../types/map';
import i18next from 'i18next';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Fonction utilitaire pour obtenir les horaires dans la bonne langue
function getLocalizedHours(location: Record<string, any>, language: string): string {
  const hoursColumns = {
    'fr': 'horaires_fr',
    'de': 'horaires_de', 
    'en': 'horaires_en',
    'lu': 'horaires_lu',
    'pt': 'horaires_pt'
  };
  
  const column = hoursColumns[language as keyof typeof hoursColumns] || 'horaires_fr';
  return location[column] || location.hours || 'Horaires à confirmer par téléphone';
}

export async function getLocations(category?: MapCategory): Promise<MapLocation[]> {
  try {
    const tableName = 'fr_map_locations'; // Utiliser toujours la table française mise à jour
    const currentLanguage = i18next.language || 'fr';
    
    let query = supabase.from(tableName).select(`
      *,
      horaires_fr,
      horaires_de,
      horaires_en,
      horaires_lu,
      horaires_pt
    `);
    
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Erreur lors de la récupération des locations:', error);
      throw error;
    }
    
    if (!data) {
      return [];
    }
    
    return data.map((location: any) => ({
      id: location.id,
      name: location.name,
      category: location.category as MapCategory,
      position: [
        parseFloat(location.latitude) || 0,
        parseFloat(location.longitude) || 0
      ] as [number, number],
      address: location.address,
      phone: location.phone,
      email: location.email,
      website: location.website,
      hours: getLocalizedHours(location, currentLanguage), // Utiliser les horaires localisés
      description: location.Notes || location.notes,
      services: location['Service type'] ? [location['Service type']] : [],
      languages: [],
      accessibility: {
        wheelchair: false,
        parking: false,
        publicTransport: false
      },
      lastUpdated: location.created_at || new Date().toISOString()
    }));
  } catch (error) {
    console.error('Erreur dans getLocations:', error);
    return [];
  }
}

export async function getLocationById(id: string): Promise<MapLocation | null> {
  try {
    const currentLanguage = i18next.language || 'fr';
    
    const { data, error } = await supabase
      .from('fr_map_locations')
      .select(`
        *,
        horaires_fr,
        horaires_de,
        horaires_en,
        horaires_lu,
        horaires_pt
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Erreur lors de la récupération de la location:', error);
      return null;
    }
    
    if (!data) {
      return null;
    }
    
    return {
      id: data.id,
      name: data.name,
      category: data.category as MapCategory,
      position: [
        parseFloat(data.latitude) || 0,
        parseFloat(data.longitude) || 0
      ] as [number, number],
      address: data.address,
      phone: data.phone,
      email: data.email,
      website: data.website,
      hours: getLocalizedHours(data, currentLanguage), // Utiliser les horaires localisés
      description: data.Notes || data.notes,
      services: data['Service type'] ? [data['Service type']] : [],
      languages: [],
      accessibility: {
        wheelchair: false,
        parking: false,
        publicTransport: false
      },
      lastUpdated: data.created_at || new Date().toISOString()
    };
  } catch (error) {
    console.error('Erreur dans getLocationById:', error);
    return null;
  }
}

export async function getNearbyLocations(
  latitude: number,
  longitude: number,
  radiusKm: number = 5,
  category?: MapCategory
): Promise<MapLocation[]> {
  try {
    const tableName = i18next.language === 'fr' ? 'fr_map_locations' : 'map_locations';
    const currentLanguage = i18next.language || 'fr';
    
    let query = supabase.rpc('nearby_locations', {
      lat: latitude,
      lng: longitude,
      radius_km: radiusKm,
      table_name: tableName
    });
    if (category && category !== ('all' as MapCategory)) {
      query = query.eq('category', category);
    }
    const { data, error } = await query;
    if (error) throw error;
    
    return data.map((location: Record<string, any>) => ({
      id: location.id,
      name: location.name,
      category: location.category,
      position: [
        parseFloat(location.latitude) || 0,
        parseFloat(location.longitude) || 0
      ],
      address: location.address,
      phone: location.phone,
      website: location.website,
      email: location.email,
      hours: getLocalizedHours(location, currentLanguage),
      description: location.public_info,
      services: location.service_type || [],
      languages: [],
      accessibility: {
        wheelchair: false,
        parking: false,
        publicTransport: false
      },
      lastUpdated: location.created_at
    }));
  } catch (error) {
    console.error('Erreur lors du chargement des locations à proximité:', error);
    return [];
  }
}