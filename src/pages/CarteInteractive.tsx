import React, { useState, useEffect } from 'react';
import { Wrapper } from '@googlemaps/react-wrapper';
import { 
  MapPin, 
  ChevronDown, 
  Navigation, 
  Phone, 
  Mail, 
  Globe,
  Clock,
  Users,
  Info,
  ArrowDown
} from 'lucide-react';
import { getLocations } from '../lib/supabase/mapLocations';
import { MapLocation, MapCategory, CATEGORIES } from '../types/map';

interface MapComponentProps {
  center: google.maps.LatLngLiteral;
  zoom: number;
  locations: MapLocation[];
}

const MapComponent: React.FC<MapComponentProps> = ({ center, zoom, locations }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [map, setMap] = React.useState<google.maps.Map>();
  const [markers, setMarkers] = React.useState<google.maps.Marker[]>([]);
  const [infoWindow, setInfoWindow] = React.useState<google.maps.InfoWindow>();

  React.useEffect(() => {
    if (ref.current && !map) {
      const newMap = new window.google.maps.Map(ref.current, {
        center,
        zoom,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      });
      setMap(newMap);
      setInfoWindow(new google.maps.InfoWindow());
    }
  }, [ref, map, center, zoom]);

  React.useEffect(() => {
    if (!map || !infoWindow) return;

    markers.forEach(marker => marker.setMap(null));
    setMarkers([]);

    const newMarkers = locations.map(location => {
      const marker = new google.maps.Marker({
        position: { 
          lat: location.position[0], 
          lng: location.position[1] 
        },
        map,
        title: location.name
      });

      marker.addListener('click', () => {
        const content = `
          <div class="p-4 max-w-sm bg-white rounded-xl shadow-sm">
            <h3 class="text-lg font-semibold mb-1">${location.name}</h3>
            ${location.services.length > 0 ? `
              <p class="text-gray-600 text-sm mb-2">${location.services.join(', ')}</p>
            ` : ''}
            <p class="text-purple-600 text-sm mb-3">${location.category}</p>
            
            ${location.phone || location.email ? `
              <div class="space-y-2 mb-3">
                ${location.phone ? `
                  <a href="tel:${location.phone}" class="flex items-center gap-2 text-gray-600 hover:text-purple-600">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    ${location.phone}
                  </a>
                ` : ''}
                ${location.email ? `
                  <a href="mailto:${location.email}" class="flex items-center gap-2 text-gray-600 hover:text-purple-600">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    ${location.email}
                  </a>
                ` : ''}
              </div>
            ` : ''}
            
            ${location.hours ? `
              <p class="text-sm mt-2">${location.hours}</p>
            ` : ''}

            <a href="https://www.google.com/maps/dir/?api=1&destination=${location.position[0]},${location.position[1]}" 
              target="_blank" rel="noopener noreferrer" 
              class="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 w-full transition-all mt-4">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
              Y Aller
            </a>
          </div>
        `;
        infoWindow.setContent(content);
        infoWindow.open(map, marker);
      });

      return marker;
    });

    setMarkers(newMarkers);
  }, [map, locations, infoWindow]);

  return <div ref={ref} className="w-full h-[45vh] lg:h-[400px] rounded-2xl" />;
};

const CarteInteractive: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [allLocations, setAllLocations] = useState<MapLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const center = { lat: 49.6116, lng: 6.1319 };

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        const data = await getLocations();
        setAllLocations(data);
        setLocations(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching locations:', error);
        setError(error instanceof Error ? error.message : 'Failed to load locations');
        setAllLocations([]);
        setLocations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  useEffect(() => {
    if (selectedCategory === 'all') {
      setLocations(allLocations);
    } else {
      setLocations(allLocations.filter(loc => loc.category === selectedCategory));
    }
  }, [selectedCategory, allLocations]);

  const scrollToList = () => {
    const listElement = document.getElementById('services-list');
    if (listElement) {
      listElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <div className="text-red-500 mb-4">
            <Info className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Erreur</h2>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const categories = ['all', ...Array.from(new Set(allLocations.map(loc => loc.category)))].sort((a, b) => {
    if (a === 'all') return -1;
    if (b === 'all') return 1;
    return a.localeCompare(b, 'fr', { sensitivity: 'base' });
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-transparent pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/80 backdrop-blur-xl rounded-[32px] shadow-2xl border border-gray-100/50 p-12">
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="mb-2">
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Carte Interactive des Services
                  </div>
                </h1>
                <p className="text-lg text-gray-600 font-light">
                  Trouvez les services d'assistance près de chez vous
                </p>
              </div>
            </div>

            <div className="mb-8">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Filtrer par catégorie
              </label>
              <div className="relative">
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="block w-full px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none pr-10 transition-all duration-200"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'Tous les services' : category}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="lg:flex lg:gap-8">
              <div className="lg:w-[35%] flex-shrink-0">
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 mb-4">
                  <Wrapper apiKey="AIzaSyBtpnSdC4fkMOhEyAYl1QmTGOD9e8Qe0Yk">
                    <MapComponent center={center} zoom={12} locations={locations} />
                  </Wrapper>
                </div>
                <button
                  onClick={scrollToList}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition-colors md:hidden"
                >
                  <ArrowDown className="w-5 h-5" />
                  Voir les services disponibles
                </button>
              </div>

              <div id="services-list" className="lg:w-[65%] mt-8 lg:mt-0 lg:pl-8">
                <div className="grid gap-6">
                  {locations.map(location => (
                    <div 
                      key={location.id}
                      className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 max-w-[600px]"
                    >
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{location.name}</h3>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                            {location.category}
                          </span>
                        </div>

                        {location.services.length > 0 && (
                          <div className="flex gap-3">
                            <Info className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-1">Services</h4>
                              <p className="text-gray-600">{location.services.join(', ')}</p>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-3">
                          <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-1">Adresse</h4>
                            <p className="text-gray-600">{location.address}</p>
                          </div>
                        </div>

                        {location.hours && (
                          <div className="flex gap-3">
                            <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-1">Horaires d'ouverture</h4>
                              <p className="text-gray-600">{location.hours}</p>
                            </div>
                          </div>
                        )}

                        {location.description && (
                          <div className="flex gap-3">
                            <Users className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-1">Infos complémentaires</h4>
                              <p className="text-gray-600">{location.description}</p>
                            </div>
                          </div>
                        )}

                        <div className="space-y-3">
                          {location.phone && (
                            <a 
                              href={`tel:${location.phone}`}
                              className="flex items-center gap-3 text-purple-600 hover:text-purple-700 transition-colors"
                            >
                              <Phone className="w-5 h-5" />
                              <span>{location.phone}</span>
                            </a>
                          )}

                          {location.email && (
                            <a 
                              href={`mailto:${location.email}`}
                              className="flex items-center gap-3 text-purple-600 hover:text-purple-700 transition-colors"
                            >
                              <Mail className="w-5 h-5" />
                              <span>{location.email}</span>
                            </a>
                          )}
                        </div>

                        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${location.position[0]},${location.position[1]}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
                          >
                            <Navigation className="w-4 h-4" />
                            Y Aller
                          </a>

                          {location.website && (
                            <a
                              href={location.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors"
                            >
                              <Globe className="w-4 h-4" />
                              <span className="text-sm">Site web</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarteInteractive;