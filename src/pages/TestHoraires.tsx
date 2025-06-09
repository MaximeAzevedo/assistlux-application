import React, { useState } from 'react';
import { supabase } from '../lib/supabase/client';
import { getLocations } from '../lib/supabase/mapLocations';
import { Clock, CheckCircle, AlertCircle, Database } from 'lucide-react';

export default function TestHoraires() {
  const [isLoading, setIsLoading] = useState(false);
  const [migrationResult, setMigrationResult] = useState<string>('');
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('fr');

  const runMigration = async () => {
    setIsLoading(true);
    setMigrationResult('');
    
    try {
      console.log('🚀 Début de la migration des horaires...');
      
      // Exécuter la migration SQL
      const migrationSQL = `
        -- Ajouter les colonnes d'horaires multilingues
        ALTER TABLE fr_map_locations 
        ADD COLUMN IF NOT EXISTS horaires_fr TEXT,
        ADD COLUMN IF NOT EXISTS horaires_de TEXT,
        ADD COLUMN IF NOT EXISTS horaires_en TEXT,
        ADD COLUMN IF NOT EXISTS horaires_lu TEXT,
        ADD COLUMN IF NOT EXISTS horaires_pt TEXT;

        -- Mettre à jour les données existantes avec des horaires bien formatés
        UPDATE fr_map_locations 
        SET 
          horaires_fr = CASE 
            WHEN name = 'Banque Alimentaire Luxembourg' THEN 
              'Lundi - Vendredi: 09h00 - 12h00 & 14h00 - 17h00' || E'\\n' ||
              'Samedi: 10h00 - 16h00' || E'\\n' ||
              'Dimanche: Fermé' || E'\\n' ||
              'Fermé les jours fériés'
            WHEN name = 'Caritas Luxembourg' THEN 
              'Lundi - Vendredi: 08h30 - 17h30' || E'\\n' ||
              'Samedi - Dimanche: Fermé' || E'\\n' ||
              'Rendez-vous recommandé'
            WHEN name = 'Croix-Rouge Luxembourg' THEN 
              'Urgences: 24h/24, 7j/7' || E'\\n' ||
              'Services administratifs: Lundi - Vendredi 09h00 - 17h00'
            ELSE 'Horaires à confirmer'
          END,
          horaires_de = CASE 
            WHEN name = 'Banque Alimentaire Luxembourg' THEN 
              'Montag - Freitag: 09:00 - 12:00 & 14:00 - 17:00' || E'\\n' ||
              'Samstag: 10:00 - 16:00' || E'\\n' ||
              'Sonntag: Geschlossen' || E'\\n' ||
              'An Feiertagen geschlossen'
            WHEN name = 'Caritas Luxembourg' THEN 
              'Montag - Freitag: 08:30 - 17:30' || E'\\n' ||
              'Samstag - Sonntag: Geschlossen' || E'\\n' ||
              'Termin empfohlen'
            WHEN name = 'Croix-Rouge Luxembourg' THEN 
              'Notfälle: 24/7' || E'\\n' ||
              'Verwaltung: Montag - Freitag 09:00 - 17:00'
            ELSE 'Öffnungszeiten zu bestätigen'
          END,
          horaires_en = CASE 
            WHEN name = 'Banque Alimentaire Luxembourg' THEN 
              'Monday - Friday: 09:00 - 12:00 & 14:00 - 17:00' || E'\\n' ||
              'Saturday: 10:00 - 16:00' || E'\\n' ||
              'Sunday: Closed' || E'\\n' ||
              'Closed on public holidays'
            WHEN name = 'Caritas Luxembourg' THEN 
              'Monday - Friday: 08:30 - 17:30' || E'\\n' ||
              'Saturday - Sunday: Closed' || E'\\n' ||
              'Appointment recommended'
            WHEN name = 'Croix-Rouge Luxembourg' THEN 
              'Emergencies: 24/7' || E'\\n' ||
              'Admin services: Monday - Friday 09:00 - 17:00'
            ELSE 'Hours to be confirmed'
          END,
          horaires_lu = CASE 
            WHEN name = 'Banque Alimentaire Luxembourg' THEN 
              'Méindeg - Freideg: 09:00 - 12:00 & 14:00 - 17:00' || E'\\n' ||
              'Samschdeg: 10:00 - 16:00' || E'\\n' ||
              'Sonndeg: Zou' || E'\\n' ||
              'Zou op Feierdeeg'
            WHEN name = 'Caritas Luxembourg' THEN 
              'Méindeg - Freideg: 08:30 - 17:30' || E'\\n' ||
              'Samschdeg - Sonndeg: Zou' || E'\\n' ||
              'Rendez-vous recommandéiert'
            WHEN name = 'Croix-Rouge Luxembourg' THEN 
              'Noutfäll: 24/7' || E'\\n' ||
              'Verwaltung: Méindeg - Freideg 09:00 - 17:00'
            ELSE 'Stonnen ze confirméieren'
          END,
          horaires_pt = CASE 
            WHEN name = 'Banque Alimentaire Luxembourg' THEN 
              'Segunda - Sexta: 09:00 - 12:00 & 14:00 - 17:00' || E'\\n' ||
              'Sábado: 10:00 - 16:00' || E'\\n' ||
              'Domingo: Fechado' || E'\\n' ||
              'Fechado nos feriados'
            WHEN name = 'Caritas Luxembourg' THEN 
              'Segunda - Sexta: 08:30 - 17:30' || E'\\n' ||
              'Sábado - Domingo: Fechado' || E'\\n' ||
              'Agendamento recomendado'
            WHEN name = 'Croix-Rouge Luxembourg' THEN 
              'Emergências: 24h/7dias' || E'\\n' ||
              'Serviços admin: Segunda - Sexta 09:00 - 17:00'
            ELSE 'Horários a confirmar'
          END;

        -- Mettre à jour la colonne hours existante avec la version française
        UPDATE fr_map_locations 
        SET hours = horaires_fr;
      `;

      // Exécuter la migration via RPC (si disponible) ou directement
      const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
      
      if (error) {
        console.error('Erreur migration:', error);
        setMigrationResult(`❌ Erreur: ${error.message}`);
      } else {
        setMigrationResult('✅ Migration des horaires multilingues réussie !');
        // Recharger les données
        await loadLocations();
      }
      
    } catch (error: any) {
      console.error('Erreur:', error);
      setMigrationResult(`❌ Erreur: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLocations = async () => {
    try {
      const data = await getLocations();
      setLocations(data);
    } catch (error) {
      console.error('Erreur chargement locations:', error);
    }
  };

  const testDirectQuery = async () => {
    try {
      const { data, error } = await supabase
        .from('fr_map_locations')
        .select('name, hours, horaires_fr, horaires_de, horaires_en, horaires_lu, horaires_pt');
      
      if (error) throw error;
      setLocations(data || []);
      setMigrationResult('✅ Données chargées directement depuis la base');
    } catch (error: any) {
      setMigrationResult(`❌ Erreur requête: ${error.message}`);
    }
  };

  const getHoursForLanguage = (location: any, lang: string) => {
    const hoursMap: Record<string, string> = {
      'fr': location.horaires_fr || location.hours,
      'de': location.horaires_de,
      'en': location.horaires_en,
      'lu': location.horaires_lu,
      'pt': location.horaires_pt
    };
    return hoursMap[lang] || location.hours || 'Horaires non disponibles';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="text-purple-600" />
            Test des Horaires Multilingues
          </h1>
          
          <div className="flex gap-4 mb-6">
            <button
              onClick={runMigration}
              disabled={isLoading}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Database size={16} />
              {isLoading ? 'Migration en cours...' : 'Appliquer Migration'}
            </button>
            
            <button
              onClick={testDirectQuery}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <CheckCircle size={16} />
              Test Requête Directe
            </button>
            
            <button
              onClick={loadLocations}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Recharger Données
            </button>
          </div>

          {migrationResult && (
            <div className={`p-4 rounded-lg mb-4 ${
              migrationResult.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {migrationResult}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Langue d'affichage des horaires :
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="en">English</option>
              <option value="lu">Lëtzebuergesch</option>
              <option value="pt">Português</option>
            </select>
          </div>
        </div>

        {locations.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Services avec Horaires ({locations.length})
            </h2>
            
            <div className="space-y-4">
              {locations.map((location, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-lg text-gray-800 mb-2">
                    {location.name}
                  </h3>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Clock size={16} />
                      Horaires ({selectedLanguage.toUpperCase()}) :
                    </h4>
                    <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                      {getHoursForLanguage(location, selectedLanguage)}
                    </pre>
                  </div>

                  {/* Debug: Afficher toutes les colonnes d'horaires */}
                  <details className="mt-2">
                    <summary className="text-sm text-gray-500 cursor-pointer">
                      Voir toutes les langues (debug)
                    </summary>
                    <div className="mt-2 text-xs space-y-1">
                      <div><strong>FR:</strong> {location.horaires_fr || 'N/A'}</div>
                      <div><strong>DE:</strong> {location.horaires_de || 'N/A'}</div>
                      <div><strong>EN:</strong> {location.horaires_en || 'N/A'}</div>
                      <div><strong>LU:</strong> {location.horaires_lu || 'N/A'}</div>
                      <div><strong>PT:</strong> {location.horaires_pt || 'N/A'}</div>
                      <div><strong>Hours (original):</strong> {location.hours || 'N/A'}</div>
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 