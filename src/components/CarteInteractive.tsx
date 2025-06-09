import React, { useState, useEffect } from 'react';
import { MapService, MapLocation } from '../services/MapService';

const CarteInteractive: React.FC = () => {
  const [services, setServices] = useState<MapLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<MapLocation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [langue, setLangue] = useState('fr');

  const categories = [
    { value: 'all', label: 'Tous les services' },
    { value: 'aide_alimentaire', label: 'Aide alimentaire' },
    { value: 'aide_sociale', label: 'Aide sociale' },
    { value: 'urgence_sociale', label: 'Urgence sociale' },
    { value: 'logement', label: 'Logement' },
    { value: 'sante', label: 'Santé' },
    { value: 'juridique', label: 'Juridique' }
  ];

  const langues = [
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'en', label: 'English' },
    { code: 'lu', label: 'Lëtzebuergesch' }
  ];

  useEffect(() => {
    loadServices();
  }, [selectedCategory, langue]);

  const loadServices = async () => {
    setLoading(true);
    try {
      let data: MapLocation[];
      
      if (selectedCategory === 'all') {
        data = await MapService.getActiveLocations(langue);
      } else {
        data = await MapService.getLocationsByCategory(selectedCategory);
      }
      
      setServices(data);
    } catch (error) {
      console.error('Erreur lors du chargement des services:', error);
    }
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadServices();
      return;
    }

    setLoading(true);
    try {
      const results = await MapService.searchLocations(searchQuery, langue);
      setServices(results);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
    }
    setLoading(false);
  };

  const openGoogleMaps = (service: MapLocation) => {
    const address = MapService.getLocalizedAddress(service, langue);
    const query = encodeURIComponent(`${MapService.getLocalizedName(service, langue)}, ${address}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec contrôles */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🗺️ Carte Interactive des Services d'Aide
              </h1>
              <p className="text-gray-600 mt-1">
                Trouvez les services d'assistance sociale près de chez vous
              </p>
            </div>

            {/* Sélecteur de langue */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Langue:</label>
              <select
                value={langue}
                onChange={(e) => setLangue(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {langues.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Barre de recherche et filtres */}
          <div className="mt-6 flex flex-col lg:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                placeholder="Rechercher un service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                onClick={handleSearch}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                🔍 Rechercher
              </button>
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-3 text-gray-600">Chargement des services...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedService(service)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {MapService.getLocalizedName(service, langue)}
                    </h3>
                    <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                      {service.categorie.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {MapService.getLocalizedDescription(service, langue)}
                  </p>

                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center">
                      <span className="w-4 h-4 mr-2">📍</span>
                      {MapService.getLocalizedAddress(service, langue)}
                    </div>
                    
                    {service.telephone && (
                      <div className="flex items-center">
                        <span className="w-4 h-4 mr-2">📞</span>
                        {service.telephone}
                      </div>
                    )}

                    {service.email && (
                      <div className="flex items-center">
                        <span className="w-4 h-4 mr-2">✉️</span>
                        {service.email}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openGoogleMaps(service);
                      }}
                      className="flex-1 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      🗺️ Voir sur la carte
                    </button>
                    
                    {service.site_web && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(service.site_web, '_blank');
                        }}
                        className="bg-gray-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        🌐 Site web
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && services.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun service trouvé
            </h3>
            <p className="text-gray-600">
              Essayez de modifier vos critères de recherche ou votre catégorie.
            </p>
          </div>
        )}
      </div>

      {/* Modal de détails */}
      {selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {MapService.getLocalizedName(selectedService, langue)}
                </h2>
                <button
                  onClick={() => setSelectedService(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700">
                    {MapService.getLocalizedDescription(selectedService, langue)}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Adresse</h3>
                  <p className="text-gray-700">
                    {MapService.getLocalizedAddress(selectedService, langue)}
                  </p>
                </div>

                {MapService.getLocalizedNotes(selectedService, langue) && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Informations pratiques</h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-blue-800 whitespace-pre-line">
                        {MapService.getLocalizedNotes(selectedService, langue)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedService.telephone && (
                    <div>
                      <h4 className="font-medium text-gray-900">Téléphone</h4>
                      <p className="text-gray-700">{selectedService.telephone}</p>
                    </div>
                  )}

                  {selectedService.email && (
                    <div>
                      <h4 className="font-medium text-gray-900">Email</h4>
                      <p className="text-gray-700">{selectedService.email}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => openGoogleMaps(selectedService)}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    🗺️ Voir sur Google Maps
                  </button>
                  
                  {selectedService.site_web && (
                    <button
                      onClick={() => window.open(selectedService.site_web, '_blank')}
                      className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      🌐 Visiter le site web
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarteInteractive; 