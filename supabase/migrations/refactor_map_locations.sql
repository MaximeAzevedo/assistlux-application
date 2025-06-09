-- Refactorisation complète de la carte interactive
-- Support multilingue (8 langues) + horaires structurés + notes enrichies

-- 1. Supprimer l'ancienne table
DROP TABLE IF EXISTS map_locations CASCADE;

-- 2. Créer la nouvelle table avec structure multilingue
CREATE TABLE map_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Informations de base multilingues
    nom_fr VARCHAR(255) NOT NULL,
    nom_de VARCHAR(255),
    nom_en VARCHAR(255),
    nom_lu VARCHAR(255),
    nom_pt VARCHAR(255),
    nom_es VARCHAR(255),
    nom_ar VARCHAR(255),
    nom_uk VARCHAR(255),
    
    -- Descriptions multilingues
    description_fr TEXT,
    description_de TEXT,
    description_en TEXT,
    description_lu TEXT,
    description_pt TEXT,
    description_es TEXT,
    description_ar TEXT,
    description_uk TEXT,
    
    -- Adresses multilingues
    adresse_fr VARCHAR(500),
    adresse_de VARCHAR(500),
    adresse_en VARCHAR(500),
    adresse_lu VARCHAR(500),
    adresse_pt VARCHAR(500),
    adresse_es VARCHAR(500),
    adresse_ar VARCHAR(500),
    adresse_uk VARCHAR(500),
    
    -- Notes enrichies multilingues (Pour qui, Quoi, Comment)
    notes_fr TEXT,
    notes_de TEXT,
    notes_en TEXT,
    notes_lu TEXT,
    notes_pt TEXT,
    notes_es TEXT,
    notes_ar TEXT,
    notes_uk TEXT,
    
    -- Coordonnées géographiques
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    
    -- Informations de contact
    telephone VARCHAR(50),
    email VARCHAR(255),
    site_web VARCHAR(500),
    
    -- Catégorie et type de service
    categorie VARCHAR(100) NOT NULL, -- 'aide_alimentaire', 'logement', 'sante', 'juridique', etc.
    type_service_fr VARCHAR(200),
    type_service_de VARCHAR(200),
    type_service_en VARCHAR(200),
    type_service_lu VARCHAR(200),
    type_service_pt VARCHAR(200),
    type_service_es VARCHAR(200),
    type_service_ar VARCHAR(200),
    type_service_uk VARCHAR(200),
    
    -- Métadonnées
    actif BOOLEAN DEFAULT true,
    verifie BOOLEAN DEFAULT false,
    derniere_verification TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Table séparée pour les horaires d'ouverture (structure propre)
CREATE TABLE horaires_ouverture (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES map_locations(id) ON DELETE CASCADE,
    
    -- Jour de la semaine (1=Lundi, 7=Dimanche)
    jour_semaine INTEGER NOT NULL CHECK (jour_semaine >= 1 AND jour_semaine <= 7),
    
    -- Horaires (NULL = fermé ce jour-là)
    heure_ouverture_matin TIME,
    heure_fermeture_matin TIME,
    heure_ouverture_apres_midi TIME,
    heure_fermeture_apres_midi TIME,
    
    -- Cas spéciaux
    ferme BOOLEAN DEFAULT false, -- Fermé toute la journée
    ouvert_24h BOOLEAN DEFAULT false, -- Ouvert 24h/24
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Index pour optimiser les performances
CREATE INDEX idx_map_locations_categorie ON map_locations(categorie);
CREATE INDEX idx_map_locations_actif ON map_locations(actif);
CREATE INDEX idx_map_locations_coords ON map_locations(latitude, longitude);
CREATE INDEX idx_horaires_location_jour ON horaires_ouverture(location_id, jour_semaine);

-- 5. Trigger pour mise à jour automatique
CREATE OR REPLACE FUNCTION update_map_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_map_locations_updated_at 
    BEFORE UPDATE ON map_locations
    FOR EACH ROW EXECUTE FUNCTION update_map_locations_updated_at();

-- 6. Fonction utilitaire pour obtenir les noms des jours
CREATE OR REPLACE FUNCTION get_jour_nom(jour_num INTEGER, langue VARCHAR(2) DEFAULT 'fr')
RETURNS VARCHAR(20) AS $$
BEGIN
    CASE langue
        WHEN 'fr' THEN
            CASE jour_num
                WHEN 1 THEN RETURN 'Lundi';
                WHEN 2 THEN RETURN 'Mardi';
                WHEN 3 THEN RETURN 'Mercredi';
                WHEN 4 THEN RETURN 'Jeudi';
                WHEN 5 THEN RETURN 'Vendredi';
                WHEN 6 THEN RETURN 'Samedi';
                WHEN 7 THEN RETURN 'Dimanche';
            END CASE;
        WHEN 'de' THEN
            CASE jour_num
                WHEN 1 THEN RETURN 'Montag';
                WHEN 2 THEN RETURN 'Dienstag';
                WHEN 3 THEN RETURN 'Mittwoch';
                WHEN 4 THEN RETURN 'Donnerstag';
                WHEN 5 THEN RETURN 'Freitag';
                WHEN 6 THEN RETURN 'Samstag';
                WHEN 7 THEN RETURN 'Sonntag';
            END CASE;
        WHEN 'en' THEN
            CASE jour_num
                WHEN 1 THEN RETURN 'Monday';
                WHEN 2 THEN RETURN 'Tuesday';
                WHEN 3 THEN RETURN 'Wednesday';
                WHEN 4 THEN RETURN 'Thursday';
                WHEN 5 THEN RETURN 'Friday';
                WHEN 6 THEN RETURN 'Saturday';
                WHEN 7 THEN RETURN 'Sunday';
            END CASE;
        WHEN 'lu' THEN
            CASE jour_num
                WHEN 1 THEN RETURN 'Méindeg';
                WHEN 2 THEN RETURN 'Dënschdeg';
                WHEN 3 THEN RETURN 'Mëttwoch';
                WHEN 4 THEN RETURN 'Donneschdeg';
                WHEN 5 THEN RETURN 'Freideg';
                WHEN 6 THEN RETURN 'Samschdeg';
                WHEN 7 THEN RETURN 'Sonndeg';
            END CASE;
        WHEN 'pt' THEN
            CASE jour_num
                WHEN 1 THEN RETURN 'Segunda-feira';
                WHEN 2 THEN RETURN 'Terça-feira';
                WHEN 3 THEN RETURN 'Quarta-feira';
                WHEN 4 THEN RETURN 'Quinta-feira';
                WHEN 5 THEN RETURN 'Sexta-feira';
                WHEN 6 THEN RETURN 'Sábado';
                WHEN 7 THEN RETURN 'Domingo';
            END CASE;
        WHEN 'es' THEN
            CASE jour_num
                WHEN 1 THEN RETURN 'Lunes';
                WHEN 2 THEN RETURN 'Martes';
                WHEN 3 THEN RETURN 'Miércoles';
                WHEN 4 THEN RETURN 'Jueves';
                WHEN 5 THEN RETURN 'Viernes';
                WHEN 6 THEN RETURN 'Sábado';
                WHEN 7 THEN RETURN 'Domingo';
            END CASE;
        WHEN 'ar' THEN
            CASE jour_num
                WHEN 1 THEN RETURN 'الاثنين';
                WHEN 2 THEN RETURN 'الثلاثاء';
                WHEN 3 THEN RETURN 'الأربعاء';
                WHEN 4 THEN RETURN 'الخميس';
                WHEN 5 THEN RETURN 'الجمعة';
                WHEN 6 THEN RETURN 'السبت';
                WHEN 7 THEN RETURN 'الأحد';
            END CASE;
        WHEN 'uk' THEN
            CASE jour_num
                WHEN 1 THEN RETURN 'Понеділок';
                WHEN 2 THEN RETURN 'Вівторок';
                WHEN 3 THEN RETURN 'Середа';
                WHEN 4 THEN RETURN 'Четвер';
                WHEN 5 THEN RETURN 'П''ятниця';
                WHEN 6 THEN RETURN 'Субота';
                WHEN 7 THEN RETURN 'Неділя';
            END CASE;
        ELSE
            CASE jour_num
                WHEN 1 THEN RETURN 'Lundi';
                WHEN 2 THEN RETURN 'Mardi';
                WHEN 3 THEN RETURN 'Mercredi';
                WHEN 4 THEN RETURN 'Jeudi';
                WHEN 5 THEN RETURN 'Vendredi';
                WHEN 6 THEN RETURN 'Samedi';
                WHEN 7 THEN RETURN 'Dimanche';
            END CASE;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- 7. Données de test avec la nouvelle structure
INSERT INTO map_locations (
    nom_fr, nom_de, nom_en, nom_lu, nom_pt, nom_es,
    description_fr, description_de, description_en,
    adresse_fr, adresse_de, adresse_en,
    notes_fr, notes_de, notes_en,
    latitude, longitude,
    telephone, email, site_web,
    categorie, type_service_fr, type_service_de, type_service_en
) VALUES 
(
    'Banque Alimentaire Luxembourg', 
    'Lebensmittelbank Luxemburg', 
    'Food Bank Luxembourg',
    'Lëtzebuerger Liewensmëttelbank',
    'Banco Alimentar Luxemburgo',
    'Banco de Alimentos Luxemburgo',
    'Distribution gratuite de denrées alimentaires aux personnes dans le besoin',
    'Kostenlose Verteilung von Lebensmitteln an Bedürftige',
    'Free distribution of food to people in need',
    '33 Rue de Strasbourg, 2560 Luxembourg',
    '33 Rue de Strasbourg, 2560 Luxemburg',
    '33 Rue de Strasbourg, 2560 Luxembourg',
    'Pour qui: Familles en difficulté financière, personnes isolées. Quoi: Colis alimentaires gratuits, produits frais et secs. Comment: Sur présentation de justificatifs de revenus, inscription préalable recommandée.',
    'Für wen: Familien in finanziellen Schwierigkeiten, alleinstehende Personen. Was: Kostenlose Lebensmittelpakete, frische und haltbare Produkte. Wie: Vorlage von Einkommensnachweisen, vorherige Anmeldung empfohlen.',
    'For whom: Families in financial difficulty, isolated individuals. What: Free food packages, fresh and dry products. How: Present income proof, prior registration recommended.',
    49.6116, 6.1319,
    '+352 26 39 04 1', 'info@banquealimentaire.lu', 'https://www.banquealimentaire.lu',
    'aide_alimentaire', 
    'Distribution alimentaire', 
    'Lebensmittelverteilung', 
    'Food distribution'
),
(
    'Caritas Luxembourg',
    'Caritas Luxemburg',
    'Caritas Luxembourg',
    'Caritas Lëtzebuerg',
    'Caritas Luxemburgo',
    'Caritas Luxemburgo',
    'Aide sociale et accompagnement des personnes en difficulté',
    'Soziale Hilfe und Begleitung von Menschen in Not',
    'Social assistance and support for people in difficulty',
    '29 Rue Michel Welter, 2730 Luxembourg',
    '29 Rue Michel Welter, 2730 Luxemburg',
    '29 Rue Michel Welter, 2730 Luxembourg',
    'Pour qui: Toute personne en situation de précarité. Quoi: Accompagnement social, aide administrative, soutien psychologique. Comment: Prise de rendez-vous par téléphone, accueil sans condition.',
    'Für wen: Jede Person in prekärer Situation. Was: Soziale Begleitung, Verwaltungshilfe, psychologische Unterstützung. Wie: Terminvereinbarung per Telefon, bedingungslose Aufnahme.',
    'For whom: Anyone in precarious situation. What: Social support, administrative help, psychological assistance. How: Appointment by phone, unconditional welcome.',
    49.6097, 6.1296,
    '+352 40 21 31 1', 'info@caritas.lu', 'https://www.caritas.lu',
    'aide_sociale',
    'Accompagnement social',
    'Soziale Begleitung',
    'Social support'
),
(
    'Croix-Rouge Luxembourg',
    'Rotes Kreuz Luxemburg',
    'Red Cross Luxembourg',
    'Rout Kräiz Lëtzebuerg',
    'Cruz Vermelha Luxemburgo',
    'Cruz Roja Luxemburgo',
    'Services d''urgence sociale et aide humanitaire',
    'Soziale Notdienste und humanitäre Hilfe',
    'Social emergency services and humanitarian aid',
    '44 Boulevard Joseph II, 1840 Luxembourg',
    '44 Boulevard Joseph II, 1840 Luxemburg',
    '44 Boulevard Joseph II, 1840 Luxembourg',
    'Pour qui: Personnes en situation d''urgence sociale, migrants, sans-abri. Quoi: Hébergement d''urgence, aide alimentaire, vêtements. Comment: Accueil 24h/24 pour urgences, services sociaux sur rendez-vous.',
    'Für wen: Personen in sozialen Notlagen, Migranten, Obdachlose. Was: Notunterkunft, Lebensmittelhilfe, Kleidung. Wie: 24h-Aufnahme für Notfälle, Sozialdienste nach Vereinbarung.',
    'For whom: People in social emergency, migrants, homeless. What: Emergency shelter, food aid, clothing. How: 24/7 reception for emergencies, social services by appointment.',
    49.6116, 6.1300,
    '+352 27 55 4000', 'info@croix-rouge.lu', 'https://www.croix-rouge.lu',
    'urgence_sociale',
    'Services d''urgence',
    'Notdienste',
    'Emergency services'
);

-- 8. Horaires d'ouverture pour tous les services
-- Banque Alimentaire (Lun-Ven 9h-12h, 14h-17h)
INSERT INTO horaires_ouverture (location_id, jour_semaine, heure_ouverture_matin, heure_fermeture_matin, heure_ouverture_apres_midi, heure_fermeture_apres_midi, ferme) 
SELECT id, 1, '09:00', '12:00', '14:00', '17:00', false FROM map_locations WHERE nom_fr = 'Banque Alimentaire Luxembourg'
UNION ALL
SELECT id, 2, '09:00', '12:00', '14:00', '17:00', false FROM map_locations WHERE nom_fr = 'Banque Alimentaire Luxembourg'
UNION ALL
SELECT id, 3, '09:00', '12:00', '14:00', '17:00', false FROM map_locations WHERE nom_fr = 'Banque Alimentaire Luxembourg'
UNION ALL
SELECT id, 4, '09:00', '12:00', '14:00', '17:00', false FROM map_locations WHERE nom_fr = 'Banque Alimentaire Luxembourg'
UNION ALL
SELECT id, 5, '09:00', '12:00', '14:00', '17:00', false FROM map_locations WHERE nom_fr = 'Banque Alimentaire Luxembourg'
UNION ALL
SELECT id, 6, NULL, NULL, NULL, NULL, true FROM map_locations WHERE nom_fr = 'Banque Alimentaire Luxembourg'
UNION ALL
SELECT id, 7, NULL, NULL, NULL, NULL, true FROM map_locations WHERE nom_fr = 'Banque Alimentaire Luxembourg';

-- Caritas (Lun-Ven 8h30-12h, 13h30-17h30)
INSERT INTO horaires_ouverture (location_id, jour_semaine, heure_ouverture_matin, heure_fermeture_matin, heure_ouverture_apres_midi, heure_fermeture_apres_midi, ferme) 
SELECT id, 1, '08:30', '12:00', '13:30', '17:30', false FROM map_locations WHERE nom_fr = 'Caritas Luxembourg'
UNION ALL
SELECT id, 2, '08:30', '12:00', '13:30', '17:30', false FROM map_locations WHERE nom_fr = 'Caritas Luxembourg'
UNION ALL
SELECT id, 3, '08:30', '12:00', '13:30', '17:30', false FROM map_locations WHERE nom_fr = 'Caritas Luxembourg'
UNION ALL
SELECT id, 4, '08:30', '12:00', '13:30', '17:30', false FROM map_locations WHERE nom_fr = 'Caritas Luxembourg'
UNION ALL
SELECT id, 5, '08:30', '12:00', '13:30', '17:30', false FROM map_locations WHERE nom_fr = 'Caritas Luxembourg'
UNION ALL
SELECT id, 6, NULL, NULL, NULL, NULL, true FROM map_locations WHERE nom_fr = 'Caritas Luxembourg'
UNION ALL
SELECT id, 7, NULL, NULL, NULL, NULL, true FROM map_locations WHERE nom_fr = 'Caritas Luxembourg';

-- Croix-Rouge (24h/24 pour urgences)
INSERT INTO horaires_ouverture (location_id, jour_semaine, ouvert_24h, ferme) 
SELECT id, 1, true, false FROM map_locations WHERE nom_fr = 'Croix-Rouge Luxembourg'
UNION ALL
SELECT id, 2, true, false FROM map_locations WHERE nom_fr = 'Croix-Rouge Luxembourg'
UNION ALL
SELECT id, 3, true, false FROM map_locations WHERE nom_fr = 'Croix-Rouge Luxembourg'
UNION ALL
SELECT id, 4, true, false FROM map_locations WHERE nom_fr = 'Croix-Rouge Luxembourg'
UNION ALL
SELECT id, 5, true, false FROM map_locations WHERE nom_fr = 'Croix-Rouge Luxembourg'
UNION ALL
SELECT id, 6, true, false FROM map_locations WHERE nom_fr = 'Croix-Rouge Luxembourg'
UNION ALL
SELECT id, 7, true, false FROM map_locations WHERE nom_fr = 'Croix-Rouge Luxembourg';

-- Commentaires pour documentation
COMMENT ON TABLE map_locations IS 'Localisation des services d''aide sociale avec support multilingue complet (8 langues)';
COMMENT ON TABLE horaires_ouverture IS 'Horaires d''ouverture structurés par jour de la semaine avec gestion matin/après-midi';

-- Affichage du résumé
DO $$
BEGIN
    RAISE NOTICE 'Refactorisation de la carte interactive terminée !';
    RAISE NOTICE '✅ Structure multilingue (8 langues : FR, DE, EN, LU, PT, ES, AR, UK)';
    RAISE NOTICE '✅ Horaires structurés par jour (matin/après-midi)';
    RAISE NOTICE '✅ Notes enrichies "Pour qui, Quoi, Comment"';
    RAISE NOTICE '✅ 3 services de test insérés avec horaires complets';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables créées : map_locations, horaires_ouverture';
    RAISE NOTICE 'Fonction utilitaire : get_jour_nom() pour traduction des jours';
END $$; 