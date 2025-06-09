-- Migration pour ajouter les horaires d'ouverture structurés et multilingues
-- Supprime les anciennes colonnes d'horaires si elles existent
ALTER TABLE map_locations 
DROP COLUMN IF EXISTS horaires_fr,
DROP COLUMN IF EXISTS horaires_de,
DROP COLUMN IF EXISTS horaires_en,
DROP COLUMN IF EXISTS horaires_lu,
DROP COLUMN IF EXISTS horaires_pt,
DROP COLUMN IF EXISTS horaires_es,
DROP COLUMN IF EXISTS horaires_ar,
DROP COLUMN IF EXISTS horaires_uk;

-- Ajoute la nouvelle structure d'horaires JSON
ALTER TABLE map_locations 
ADD COLUMN horaires_structure JSONB DEFAULT '{}';

-- Ajoute des colonnes pour les horaires formatés par langue
ALTER TABLE map_locations 
ADD COLUMN horaires_fr TEXT,
ADD COLUMN horaires_de TEXT,
ADD COLUMN horaires_en TEXT,
ADD COLUMN horaires_lu TEXT,
ADD COLUMN horaires_pt TEXT,
ADD COLUMN horaires_es TEXT,
ADD COLUMN horaires_ar TEXT,
ADD COLUMN horaires_uk TEXT;

-- Commentaires pour expliquer la structure
COMMENT ON COLUMN map_locations.horaires_structure IS 'Structure JSON des horaires: {"lundi": {"ouvert": true, "heures": [{"debut": "09:00", "fin": "12:00"}, {"debut": "14:00", "fin": "17:00"}]}, "ferme": ["dimanche"], "notes": {"fr": "Fermé les jours fériés"}}';

-- Index pour optimiser les requêtes sur les horaires
CREATE INDEX IF NOT EXISTS idx_map_locations_horaires_structure ON map_locations USING GIN (horaires_structure);

-- Fonction pour générer les horaires formatés automatiquement
CREATE OR REPLACE FUNCTION format_horaires_multilingue(horaires_json JSONB, langue TEXT)
RETURNS TEXT AS $$
DECLARE
    result TEXT := '';
    jour_key TEXT;
    jour_data JSONB;
    heures_array JSONB;
    heure_item JSONB;
    jours_ouverts TEXT[] := ARRAY[]::TEXT[];
    jours_fermes TEXT[] := ARRAY[]::TEXT[];
    
    -- Traductions des jours
    jours_fr TEXT[] := ARRAY['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    jours_de TEXT[] := ARRAY['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
    jours_en TEXT[] := ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    jours_lu TEXT[] := ARRAY['Méindeg', 'Dënschdeg', 'Mëttwoch', 'Donneschdeg', 'Freideg', 'Samschdeg', 'Sonndeg'];
    jours_pt TEXT[] := ARRAY['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    
    jour_traduit TEXT;
    i INTEGER;
BEGIN
    -- Si pas de données, retourner message par défaut
    IF horaires_json IS NULL OR horaires_json = '{}' THEN
        CASE langue
            WHEN 'fr' THEN RETURN 'Horaires à confirmer';
            WHEN 'de' THEN RETURN 'Öffnungszeiten zu bestätigen';
            WHEN 'en' THEN RETURN 'Hours to be confirmed';
            WHEN 'lu' THEN RETURN 'Stonnen ze confirméieren';
            WHEN 'pt' THEN RETURN 'Horários a confirmar';
            ELSE RETURN 'Horaires à confirmer';
        END CASE;
    END IF;

    -- Parcourir les jours de la semaine
    FOR i IN 1..7 LOOP
        jour_key := jours_fr[i];
        jour_data := horaires_json -> jour_key;
        
        -- Traduire le nom du jour
        CASE langue
            WHEN 'de' THEN jour_traduit := jours_de[i];
            WHEN 'en' THEN jour_traduit := jours_en[i];
            WHEN 'lu' THEN jour_traduit := jours_lu[i];
            WHEN 'pt' THEN jour_traduit := jours_pt[i];
            ELSE jour_traduit := jours_fr[i];
        END CASE;
        
        IF jour_data IS NOT NULL AND (jour_data ->> 'ouvert')::boolean = true THEN
            heures_array := jour_data -> 'heures';
            IF heures_array IS NOT NULL AND jsonb_array_length(heures_array) > 0 THEN
                result := result || jour_traduit || ': ';
                
                -- Ajouter les créneaux horaires
                FOR heure_item IN SELECT * FROM jsonb_array_elements(heures_array) LOOP
                    IF result NOT LIKE '%: ' THEN
                        result := result || ' & ';
                    END IF;
                    result := result || (heure_item ->> 'debut') || ' - ' || (heure_item ->> 'fin');
                END LOOP;
                
                result := result || E'\n';
            END IF;
        ELSIF jour_data IS NOT NULL AND (jour_data ->> 'ouvert')::boolean = false THEN
            -- Jour explicitement fermé
            jours_fermes := array_append(jours_fermes, jour_traduit);
        END IF;
    END LOOP;

    -- Ajouter les jours fermés à la fin
    IF array_length(jours_fermes, 1) > 0 THEN
        CASE langue
            WHEN 'fr' THEN result := result || 'Fermé: ' || array_to_string(jours_fermes, ', ');
            WHEN 'de' THEN result := result || 'Geschlossen: ' || array_to_string(jours_fermes, ', ');
            WHEN 'en' THEN result := result || 'Closed: ' || array_to_string(jours_fermes, ', ');
            WHEN 'lu' THEN result := result || 'Zou: ' || array_to_string(jours_fermes, ', ');
            WHEN 'pt' THEN result := result || 'Fechado: ' || array_to_string(jours_fermes, ', ');
            ELSE result := result || 'Fermé: ' || array_to_string(jours_fermes, ', ');
        END CASE;
    END IF;

    -- Ajouter les notes si disponibles
    IF horaires_json -> 'notes' -> langue IS NOT NULL THEN
        result := result || E'\n' || (horaires_json -> 'notes' ->> langue);
    END IF;

    RETURN TRIM(result);
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement les horaires formatés
CREATE OR REPLACE FUNCTION update_horaires_formated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.horaires_fr := format_horaires_multilingue(NEW.horaires_structure, 'fr');
    NEW.horaires_de := format_horaires_multilingue(NEW.horaires_structure, 'de');
    NEW.horaires_en := format_horaires_multilingue(NEW.horaires_structure, 'en');
    NEW.horaires_lu := format_horaires_multilingue(NEW.horaires_structure, 'lu');
    NEW.horaires_pt := format_horaires_multilingue(NEW.horaires_structure, 'pt');
    NEW.horaires_es := format_horaires_multilingue(NEW.horaires_structure, 'es');
    NEW.horaires_ar := format_horaires_multilingue(NEW.horaires_structure, 'ar');
    NEW.horaires_uk := format_horaires_multilingue(NEW.horaires_structure, 'uk');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_update_horaires_formated ON map_locations;
CREATE TRIGGER trigger_update_horaires_formated
    BEFORE INSERT OR UPDATE OF horaires_structure ON map_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_horaires_formated();

-- Données de test avec horaires structurés
UPDATE map_locations 
SET horaires_structure = '{
    "lundi": {"ouvert": true, "heures": [{"debut": "09:00", "fin": "12:00"}, {"debut": "14:00", "fin": "17:00"}]},
    "mardi": {"ouvert": true, "heures": [{"debut": "09:00", "fin": "12:00"}, {"debut": "14:00", "fin": "17:00"}]},
    "mercredi": {"ouvert": true, "heures": [{"debut": "09:00", "fin": "12:00"}, {"debut": "14:00", "fin": "17:00"}]},
    "jeudi": {"ouvert": true, "heures": [{"debut": "09:00", "fin": "12:00"}, {"debut": "14:00", "fin": "17:00"}]},
    "vendredi": {"ouvert": true, "heures": [{"debut": "09:00", "fin": "12:00"}, {"debut": "14:00", "fin": "17:00"}]},
    "samedi": {"ouvert": true, "heures": [{"debut": "10:00", "fin": "16:00"}]},
    "dimanche": {"ouvert": false},
    "notes": {
        "fr": "Fermé les jours fériés",
        "de": "An Feiertagen geschlossen",
        "en": "Closed on public holidays",
        "lu": "Zou op Feierdeeg",
        "pt": "Fechado nos feriados"
    }
}'
WHERE nom_fr = 'Banque Alimentaire Luxembourg';

UPDATE map_locations 
SET horaires_structure = '{
    "lundi": {"ouvert": true, "heures": [{"debut": "08:30", "fin": "17:30"}]},
    "mardi": {"ouvert": true, "heures": [{"debut": "08:30", "fin": "17:30"}]},
    "mercredi": {"ouvert": true, "heures": [{"debut": "08:30", "fin": "17:30"}]},
    "jeudi": {"ouvert": true, "heures": [{"debut": "08:30", "fin": "17:30"}]},
    "vendredi": {"ouvert": true, "heures": [{"debut": "08:30", "fin": "17:30"}]},
    "samedi": {"ouvert": false},
    "dimanche": {"ouvert": false},
    "notes": {
        "fr": "Rendez-vous recommandé",
        "de": "Termin empfohlen",
        "en": "Appointment recommended",
        "lu": "Rendez-vous recommandéiert",
        "pt": "Agendamento recomendado"
    }
}'
WHERE nom_fr = 'Caritas Luxembourg';

UPDATE map_locations 
SET horaires_structure = '{
    "lundi": {"ouvert": true, "heures": [{"debut": "00:00", "fin": "23:59"}]},
    "mardi": {"ouvert": true, "heures": [{"debut": "00:00", "fin": "23:59"}]},
    "mercredi": {"ouvert": true, "heures": [{"debut": "00:00", "fin": "23:59"}]},
    "jeudi": {"ouvert": true, "heures": [{"debut": "00:00", "fin": "23:59"}]},
    "vendredi": {"ouvert": true, "heures": [{"debut": "00:00", "fin": "23:59"}]},
    "samedi": {"ouvert": true, "heures": [{"debut": "00:00", "fin": "23:59"}]},
    "dimanche": {"ouvert": true, "heures": [{"debut": "00:00", "fin": "23:59"}]},
    "notes": {
        "fr": "Urgences 24h/24, services administratifs 9h-17h",
        "de": "Notfälle 24/7, Verwaltung 9-17 Uhr",
        "en": "Emergencies 24/7, admin services 9am-5pm",
        "lu": "Noutfäll 24/7, Verwaltung 9-17 Auer",
        "pt": "Emergências 24h, serviços admin 9h-17h"
    }
}'
WHERE nom_fr = 'Croix-Rouge Luxembourg'; 