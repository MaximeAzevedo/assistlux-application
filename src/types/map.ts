export interface MapLocation {
  id: string;
  name: string;
  category: MapCategory;
  position: [number, number];
  address: string;
  phone?: string;
  website?: string;
  email?: string;
  hours?: string;
  description?: string;
  services?: string[];
  languages?: string[];
  accessibility?: {
    wheelchair: boolean;
    parking: boolean;
    publicTransport: boolean;
  };
  lastUpdated: string;
}

export type MapCategory =
  | 'hebergement'
  | 'alimentation'
  | 'sante'
  | 'administration'
  | 'emploi'
  | 'juridique'
  | 'education'
  | 'mobilite'
  | 'services';

export interface CategoryInfo {
  id: MapCategory;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const CATEGORIES: Record<MapCategory, CategoryInfo> = {
  hebergement: {
    id: 'hebergement',
    name: 'Hébergement',
    description: 'Centres d\'hébergement, foyers et logements d\'urgence',
    icon: 'Home',
    color: 'blue'
  },
  alimentation: {
    id: 'alimentation',
    name: 'Alimentation',
    description: 'Banques alimentaires et restaurants sociaux',
    icon: 'Utensils',
    color: 'green'
  },
  sante: {
    id: 'sante',
    name: 'Santé & Soins',
    description: 'Services médicaux, centres de santé et assistance médicale',
    icon: 'Heart',
    color: 'red'
  },
  administration: {
    id: 'administration',
    name: 'Offices Sociaux & Administratifs',
    description: 'Services administratifs et bureaux d\'aide sociale',
    icon: 'Building',
    color: 'purple'
  },
  emploi: {
    id: 'emploi',
    name: 'Emploi & Formation',
    description: 'Centres de formation et services d\'aide à l\'emploi',
    icon: 'Briefcase',
    color: 'orange'
  },
  juridique: {
    id: 'juridique',
    name: 'Aide Juridique',
    description: 'Services d\'assistance juridique et conseils légaux',
    icon: 'Scale',
    color: 'indigo'
  },
  education: {
    id: 'education',
    name: 'Éducation & Langues',
    description: 'Centres d\'apprentissage et écoles de langues',
    icon: 'GraduationCap',
    color: 'yellow'
  },
  mobilite: {
    id: 'mobilite',
    name: 'Mobilité & Transports',
    description: 'Services de transport et aide à la mobilité',
    icon: 'Bus',
    color: 'emerald'
  },
  services: {
    id: 'services',
    name: 'Services Spécifiques',
    description: 'Services spécialisés et assistance particulière',
    icon: 'LifeBuoy',
    color: 'rose'
  }
};