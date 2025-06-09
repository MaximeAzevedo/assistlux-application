-- Script de création des tables AssistLux
-- À exécuter dans l'interface Supabase SQL Editor

-- 1. Supprimer les tables existantes dans le bon ordre (contraintes de clés étrangères)
DROP TABLE IF EXISTS statistiques_validation CASCADE;
DROP TABLE IF EXISTS modeles_fichiers CASCADE;
DROP TABLE IF EXISTS adresses_envoi CASCADE;
DROP TABLE IF EXISTS baremes CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS champs_formulaire CASCADE;
DROP TABLE IF EXISTS etapes CASCADE;
DROP TABLE IF EXISTS configuration_technique CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS config_aide CASCADE;

-- 2. Créer la table config_aide (table principale des aides)
CREATE TABLE config_aide (
    id SERIAL PRIMARY KEY,
    nom_aide VARCHAR(255) NOT NULL,
    description_courte TEXT,
    description_longue TEXT,
    actif BOOLEAN DEFAULT true,
    ordre_affichage INTEGER DEFAULT 0,
    icone VARCHAR(100),
    couleur VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Créer la table messages (textes multilingues)
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    cle VARCHAR(255) UNIQUE NOT NULL,
    fr TEXT,
    de TEXT,
    en TEXT,
    lu TEXT,
    pt TEXT,
    contexte VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Créer la table configuration_technique
CREATE TABLE configuration_technique (
    id SERIAL PRIMARY KEY,
    cle VARCHAR(255) UNIQUE NOT NULL,
    valeur TEXT,
    type_valeur VARCHAR(50) DEFAULT 'string',
    description TEXT,
    modifiable BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Créer la table etapes
CREATE TABLE etapes (
    id SERIAL PRIMARY KEY,
    aide_id INTEGER REFERENCES config_aide(id) ON DELETE CASCADE,
    nom_etape VARCHAR(255) NOT NULL,
    description TEXT,
    ordre INTEGER NOT NULL,
    obligatoire BOOLEAN DEFAULT true,
    conditions_affichage JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Créer la table champs_formulaire
CREATE TABLE champs_formulaire (
    id SERIAL PRIMARY KEY,
    etape_id INTEGER REFERENCES etapes(id) ON DELETE CASCADE,
    aide_id INTEGER REFERENCES config_aide(id) ON DELETE CASCADE,
    nom_champ VARCHAR(255) NOT NULL,
    type_champ VARCHAR(50) NOT NULL,
    label_fr VARCHAR(255),
    label_de VARCHAR(255),
    label_en VARCHAR(255),
    label_lu VARCHAR(255),
    label_pt VARCHAR(255),
    placeholder_fr VARCHAR(255),
    placeholder_de VARCHAR(255),
    placeholder_en VARCHAR(255),
    placeholder_lu VARCHAR(255),
    placeholder_pt VARCHAR(255),
    obligatoire BOOLEAN DEFAULT false,
    ordre INTEGER NOT NULL,
    options_select JSONB,
    validation_regex VARCHAR(500),
    message_erreur_fr TEXT,
    message_erreur_de TEXT,
    message_erreur_en TEXT,
    message_erreur_lu TEXT,
    message_erreur_pt TEXT,
    conditions_affichage JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Créer la table documents
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    aide_id INTEGER REFERENCES config_aide(id) ON DELETE CASCADE,
    nom_document VARCHAR(255) NOT NULL,
    description_fr TEXT,
    description_de TEXT,
    description_en TEXT,
    description_lu TEXT,
    description_pt TEXT,
    obligatoire BOOLEAN DEFAULT true,
    formats_acceptes VARCHAR(255) DEFAULT 'pdf,jpg,jpeg,png',
    taille_max_mb INTEGER DEFAULT 10,
    conditions_requises JSONB,
    ordre INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Créer la table baremes
CREATE TABLE baremes (
    id SERIAL PRIMARY KEY,
    aide_id INTEGER REFERENCES config_aide(id) ON DELETE CASCADE,
    nom_bareme VARCHAR(255) NOT NULL,
    type_calcul VARCHAR(50) NOT NULL,
    parametres JSONB NOT NULL,
    conditions JSONB,
    actif BOOLEAN DEFAULT true,
    date_debut DATE,
    date_fin DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Créer la table adresses_envoi
CREATE TABLE adresses_envoi (
    id SERIAL PRIMARY KEY,
    aide_id INTEGER REFERENCES config_aide(id) ON DELETE CASCADE,
    nom_organisme VARCHAR(255) NOT NULL,
    adresse_ligne1 VARCHAR(255),
    adresse_ligne2 VARCHAR(255),
    code_postal VARCHAR(10),
    ville VARCHAR(100),
    pays VARCHAR(100) DEFAULT 'Luxembourg',
    telephone VARCHAR(50),
    email VARCHAR(255),
    horaires_ouverture TEXT,
    type_envoi VARCHAR(50) DEFAULT 'postal',
    url_envoi_ligne VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Créer la table modeles_fichiers
CREATE TABLE modeles_fichiers (
    id SERIAL PRIMARY KEY,
    aide_id INTEGER REFERENCES config_aide(id) ON DELETE CASCADE,
    nom_modele VARCHAR(255) NOT NULL,
    type_fichier VARCHAR(50),
    template_content TEXT,
    variables_disponibles JSONB,
    langue VARCHAR(5) DEFAULT 'fr',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Créer la table statistiques_validation
CREATE TABLE statistiques_validation (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(255) NOT NULL,
    exists BOOLEAN NOT NULL,
    error TEXT,
    count VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Créer des index pour améliorer les performances
CREATE INDEX idx_config_aide_actif ON config_aide(actif);
CREATE INDEX idx_config_aide_ordre ON config_aide(ordre_affichage);
CREATE INDEX idx_messages_cle ON messages(cle);
CREATE INDEX idx_configuration_technique_cle ON configuration_technique(cle);
CREATE INDEX idx_etapes_aide_id ON etapes(aide_id);
CREATE INDEX idx_etapes_ordre ON etapes(ordre);
CREATE INDEX idx_champs_formulaire_etape_id ON champs_formulaire(etape_id);
CREATE INDEX idx_champs_formulaire_aide_id ON champs_formulaire(aide_id);
CREATE INDEX idx_champs_formulaire_ordre ON champs_formulaire(ordre);
CREATE INDEX idx_documents_aide_id ON documents(aide_id);
CREATE INDEX idx_baremes_aide_id ON baremes(aide_id);
CREATE INDEX idx_baremes_actif ON baremes(actif);
CREATE INDEX idx_adresses_envoi_aide_id ON adresses_envoi(aide_id);
CREATE INDEX idx_modeles_fichiers_aide_id ON modeles_fichiers(aide_id);

-- 13. Insérer des données de test
INSERT INTO messages (cle, fr, de, en, lu, pt, contexte) VALUES
('BIENVENUE', 'Bienvenue dans AssistLux', 'Willkommen bei AssistLux', 'Welcome to AssistLux', 'Wëllkomm bei AssistLux', 'Bem-vindo ao AssistLux', 'general'),
('AIDE_SOCIALE', 'Aide sociale', 'Sozialhilfe', 'Social assistance', 'Sozial Hëllef', 'Assistência social', 'general'),
('COMMENCER', 'Commencer', 'Beginnen', 'Start', 'Ufänken', 'Começar', 'bouton');

INSERT INTO configuration_technique (cle, valeur, type_valeur, description, modifiable) VALUES
('APP_VERSION', '1.0.0', 'string', 'Version de l''application', false),
('MAX_FILE_SIZE_MB', '10', 'number', 'Taille maximale des fichiers en MB', true),
('LANGUES_SUPPORTEES', '["fr","de","en","lu","pt"]', 'json', 'Langues supportées par l''application', true),
('MAINTENANCE_MODE', 'false', 'boolean', 'Mode maintenance activé', true);

INSERT INTO config_aide (nom_aide, description_courte, description_longue, actif, ordre_affichage, icone, couleur) VALUES
('Aide au logement', 'Assistance financière pour le logement', 'Cette aide permet d''obtenir une assistance financière pour les frais de logement selon vos revenus et votre situation familiale.', true, 1, 'home', '#3B82F6'),
('Aide alimentaire', 'Assistance pour l''alimentation', 'Aide financière ou en nature pour l''alimentation des familles en difficulté.', true, 2, 'utensils', '#10B981'),
('Aide aux transports', 'Assistance pour les déplacements', 'Aide financière pour les frais de transport public ou privé.', true, 3, 'car', '#F59E0B');

-- Message de confirmation
SELECT 'Tables AssistLux créées avec succès!' as message; 