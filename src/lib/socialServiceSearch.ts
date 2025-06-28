import { supabase } from './supabase';

export interface ServiceSocial {
  id: string;
  name: string;
  service_type: string;
  category: string;
  address: string;
  phone: string;
  website: string;
  email: string;
  hours: string;
  informations: string;
  commune: string;
  relevance_score?: number;
}

export interface SearchResult {
  services: ServiceSocial[];
  total: number;
  query: string;
}

/**
 * Recherche des services sociaux avec scoring intelligent
 */
export async function searchSocialServices(
  query: string,
  limit: number = 10
): Promise<SearchResult> {
  try {
    // Utiliser la fonction PostgreSQL de recherche intelligente
    const { data, error } = await supabase
      .rpc('search_services_sociaux', {
        search_query: query,
        limit_results: limit
      });

    if (error) {
      console.error('Erreur lors de la recherche:', error);
      throw error;
    }

    return {
      services: data || [],
      total: data?.length || 0,
      query
    };
  } catch (error) {
    console.error('Erreur dans searchSocialServices:', error);
    return {
      services: [],
      total: 0,
      query
    };
  }
}

/**
 * Recherche par catégorie spécifique
 */
export async function searchByCategory(
  category: string,
  limit: number = 20
): Promise<ServiceSocial[]> {
  try {
    const { data, error } = await supabase
      .from('services_sociaux')
      .select('*')
      .ilike('category', `%${category}%`)
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur dans searchByCategory:', error);
    return [];
  }
}

/**
 * Recherche par commune
 */
export async function searchByCommune(
  commune: string,
  limit: number = 20
): Promise<ServiceSocial[]> {
  try {
    const { data, error } = await supabase
      .from('services_sociaux')
      .select('*')
      .or(`commune.ilike.%${commune}%,address.ilike.%${commune}%`)
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur dans searchByCommune:', error);
    return [];
  }
}

/**
 * Obtenir tous les services d'un type donné
 */
export async function getServicesByType(
  serviceType: string,
  limit: number = 50
): Promise<ServiceSocial[]> {
  try {
    const { data, error } = await supabase
      .from('services_sociaux')
      .select('*')
      .ilike('service_type', `%${serviceType}%`)
      .order('name')
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur dans getServicesByType:', error);
    return [];
  }
}

/**
 * Obtenir un service par son ID
 */
export async function getServiceById(id: string): Promise<ServiceSocial | null> {
  try {
    const { data, error } = await supabase
      .from('services_sociaux')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur dans getServiceById:', error);
    return null;
  }
}

/**
 * Formater les résultats pour le chatbot
 */
export function formatServicesForChat(services: ServiceSocial[]): string {
  if (services.length === 0) {
    return "Je n'ai trouvé aucun service correspondant à votre recherche.";
  }

  let response = `J'ai trouvé ${services.length} service${services.length > 1 ? 's' : ''} :\n\n`;

  services.forEach((service, index) => {
    response += `**${index + 1}. ${service.name}**\n`;
    response += `📍 **Adresse :** ${service.address}\n`;
    
    if (service.phone) {
      response += `📞 **Téléphone :** ${service.phone}\n`;
    }
    
    if (service.hours) {
      response += `🕒 **Horaires :** ${service.hours}\n`;
    }
    
    if (service.email) {
      response += `✉️ **Email :** ${service.email}\n`;
    }
    
    if (service.website) {
      response += `🌐 **Site web :** ${service.website}\n`;
    }
    
    if (service.informations) {
      // Limiter les informations pour éviter des réponses trop longues
      const infos = service.informations.length > 200 
        ? service.informations.substring(0, 200) + '...'
        : service.informations;
      response += `ℹ️ **Informations :** ${infos}\n`;
    }
    
    response += '\n---\n\n';
  });

  return response;
}

/**
 * Analyser la requête utilisateur pour extraire des mots-clés pertinents
 */
export function analyzeQuery(query: string): {
  keywords: string[];
  commune?: string;
  category?: string;
  serviceType?: string;
} {
  const lowerQuery = query.toLowerCase();
  
  // Communes luxembourgeoises courantes
  const communes = [
    'luxembourg', 'esch', 'differdange', 'dudelange', 'ettelbruck', 'diekirch',
    'grevenmacher', 'remich', 'echternach', 'mersch', 'redange', 'wiltz',
    'bettembourg', 'pétange', 'beggen', 'hollerich', 'bonnevoie', 'findel'
  ];
  
  // Types de services
  const serviceTypes = [
    'épicerie sociale', 'restaurant social', 'banque alimentaire',
    'aide hivernale', 'vestiaire', 'hébergement'
  ];
  
  // Catégories
  const categories = [
    'alimentation', 'hébergement', 'vêtements', 'besoins essentiels'
  ];
  
  const result: any = {
    keywords: query.split(' ').filter(word => word.length > 2)
  };
  
  // Détecter la commune
  const foundCommune = communes.find(commune => 
    lowerQuery.includes(commune)
  );
  if (foundCommune) {
    result.commune = foundCommune;
  }
  
  // Détecter le type de service
  const foundServiceType = serviceTypes.find(type => 
    lowerQuery.includes(type)
  );
  if (foundServiceType) {
    result.serviceType = foundServiceType;
  }
  
  // Détecter la catégorie
  const foundCategory = categories.find(category => 
    lowerQuery.includes(category)
  );
  if (foundCategory) {
    result.category = foundCategory;
  }
  
  return result;
} 