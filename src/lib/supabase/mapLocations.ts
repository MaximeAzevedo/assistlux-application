import { createClient } from '@supabase/supabase-js';
import { MapLocation, MapCategory } from '../../types/map';
import i18next from 'i18next';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getLocations(category?: MapCategory): Promise<MapLocation[]> {
  try {
    const tableName = i18next.language === 'fr' ? 'fr_map_locations' : 'map_locations';
    let query = supabase.from(tableName).select('*');
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data.map(location => ({
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
      hours: location.hours,
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
    return [];
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
    let query = supabase.rpc('nearby_locations', {
      lat: latitude,
      lng: longitude,
      radius_km: radiusKm,
      table_name: tableName
    });
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data.map(location => ({
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
      hours: location.hours,
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
    return [];
  }
}