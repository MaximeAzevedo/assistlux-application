-- Migration pour les fonctionnalités avancées AssistLux
-- Vidéos multilingues, Scanner IA, Sessions utilisateur

-- 1. Table pour la gestion des vidéos explicatives multilingues
CREATE TABLE IF NOT EXISTS videos_explicatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aide_id UUID REFERENCES config_aide(id) ON DELETE CASCADE,
    etape_id UUID REFERENCES etapes(id) ON DELETE CASCADE NULL,
    type_video VARCHAR(50) NOT NULL, -- 'introduction', 'explication_etape', 'aide_remplissage', 'validation_document'
    
    -- URLs par langue (hébergement externe CDN)
    url_fr TEXT,
    url_de TEXT,
    url_en TEXT,
    url_lu TEXT,
    url_pt TEXT,
    
    -- Métadonnées vidéo
    duree_secondes INTEGER,
    thumbnail_url TEXT,
    qualite VARCHAR(10) DEFAULT 'HD', -- 'SD', 'HD', '4K'
    taille_mb DECIMAL(8,2),
    
    -- Transcriptions pour accessibilité
    transcription_fr TEXT,
    transcription_de TEXT,
    transcription_en TEXT,
    transcription_lu TEXT,
    transcription_pt TEXT,
    
    -- Configuration d'affichage
    position_affichage VARCHAR(20) DEFAULT 'debut_etape', -- 'debut_etape', 'aide_contextuelle', 'fin_etape'
    obligatoire BOOLEAN DEFAULT false,
    auto_play BOOLEAN DEFAULT false,
    
    -- Métadonnées de génération
    genere_automatiquement BOOLEAN DEFAULT false,
    modele_generation VARCHAR(50), -- 'synthesia', 'd-id', 'runway', 'manual'
    cout_generation DECIMAL(10,2),
    
    -- Statut et dates
    statut VARCHAR(20) DEFAULT 'actif', -- 'actif', 'inactif', 'en_cours_generation'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Table pour la configuration des validations IA de documents
CREATE TABLE IF NOT EXISTS documents_ia_validation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aide_id UUID REFERENCES config_aide(id) ON DELETE CASCADE,
    type_document VARCHAR(100) NOT NULL, -- 'fiche_paie', 'justificatif_domicile', 'carte_identite', 'acte_naissance'
    
    -- Configuration IA
    modele_ia VARCHAR(50) DEFAULT 'gpt-4-vision', -- 'gpt-4-vision', 'claude-vision', 'custom'
    prompt_validation_fr TEXT NOT NULL,
    prompt_validation_de TEXT,
    prompt_validation_en TEXT,
    prompt_validation_lu TEXT,
    prompt_validation_pt TEXT,
    
    -- Critères de validation
    champs_obligatoires JSON NOT NULL, -- ['nom', 'prenom', 'salaire_net', 'periode']
    formats_acceptes JSON DEFAULT '["pdf", "jpg", "jpeg", "png"]',
    taille_max_mb INTEGER DEFAULT 10,
    resolution_min_dpi INTEGER DEFAULT 150,
    
    -- Seuils de validation
    confiance_minimum DECIMAL(3,2) DEFAULT 0.80, -- Score minimum pour validation automatique
    confiance_manuelle DECIMAL(3,2) DEFAULT 0.60, -- En dessous = rejet automatique
    
    -- Messages de retour multilingues
    message_succes_fr TEXT NOT NULL,
    message_succes_de TEXT,
    message_succes_en TEXT,
    message_succes_lu TEXT,
    message_succes_pt TEXT,
    
    message_erreur_fr TEXT NOT NULL,
    message_erreur_de TEXT,
    message_erreur_en TEXT,
    message_erreur_lu TEXT,
    message_erreur_pt TEXT,
    
    message_verification_manuelle_fr TEXT,
    message_verification_manuelle_de TEXT,
    message_verification_manuelle_en TEXT,
    message_verification_manuelle_lu TEXT,
    message_verification_manuelle_pt TEXT,
    
    -- Suggestions d'amélioration
    suggestions_correction JSON, -- Conseils pour améliorer la qualité du document
    
    -- Configuration avancée
    ocr_preprocess BOOLEAN DEFAULT true, -- Prétraitement OCR avant IA
    validation_croisee BOOLEAN DEFAULT false, -- Validation avec plusieurs modèles
    apprentissage_actif BOOLEAN DEFAULT true, -- Utiliser pour améliorer le modèle
    
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Table pour la gestion des sessions utilisateur (RGPD compliant)
CREATE TABLE IF NOT EXISTS sessions_utilisateur (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    
    -- Données utilisateur (chiffrées côté client)
    donnees_personnelles JSONB, -- Chiffré avec clé de session
    documents_uploades JSON DEFAULT '[]',
    progression_etapes JSON DEFAULT '{}',
    resultats_eligibilite JSON DEFAULT '{}',
    preferences_utilisateur JSON DEFAULT '{}',
    
    -- Métadonnées session
    langue_preferee VARCHAR(2) DEFAULT 'fr',
    derniere_activite TIMESTAMP DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    device_info JSON,
    
    -- Données de navigation
    pages_visitees JSON DEFAULT '[]',
    temps_passe_total INTEGER DEFAULT 0, -- en secondes
    actions_utilisateur JSON DEFAULT '[]',
    
    -- RGPD et consentements
    consentement_donnees BOOLEAN DEFAULT false,
    consentement_cookies BOOLEAN DEFAULT false,
    consentement_analytics BOOLEAN DEFAULT false,
    consentement_marketing BOOLEAN DEFAULT false,
    date_consentement TIMESTAMP,
    
    -- Gestion automatique des données
    date_expiration TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    suppression_programmee BOOLEAN DEFAULT true,
    
    -- Sécurité
    tentatives_connexion INTEGER DEFAULT 0,
    derniere_tentative TIMESTAMP,
    bloque_jusqu TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Table pour l'historique des validations IA (traçabilité et amélioration)
CREATE TABLE IF NOT EXISTS historique_validations_ia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions_utilisateur(id) ON DELETE CASCADE,
    document_validation_id UUID REFERENCES documents_ia_validation(id),
    
    -- Données de validation
    nom_fichier_original VARCHAR(255),
    fichier_url TEXT, -- URL temporaire sécurisée (expire après 24h)
    hash_fichier VARCHAR(64), -- SHA-256 pour déduplication
    taille_fichier_kb INTEGER,
    
    -- Résultats de validation
    resultat_validation BOOLEAN,
    confiance_score DECIMAL(3,2), -- 0.00 à 1.00
    champs_detectes JSON,
    erreurs_detectees JSON,
    suggestions_amelioration JSON,
    
    -- Données techniques IA
    modele_utilise VARCHAR(50),
    version_modele VARCHAR(20),
    prompt_utilise TEXT,
    reponse_brute_ia TEXT,
    temps_traitement_ms INTEGER,
    cout_api DECIMAL(10,4),
    
    -- Feedback utilisateur (pour amélioration)
    feedback_utilisateur JSON, -- {'correct': true/false, 'commentaire': '...'}
    validation_manuelle_admin BOOLEAN,
    commentaire_admin TEXT,
    
    -- Métadonnées
    ip_utilisateur INET,
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Table pour les statistiques et analytics vidéos
CREATE TABLE IF NOT EXISTS analytics_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID REFERENCES videos_explicatives(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions_utilisateur(id) ON DELETE CASCADE,
    
    -- Données de visionnage
    debut_visionnage TIMESTAMP DEFAULT NOW(),
    fin_visionnage TIMESTAMP,
    duree_visionnee_secondes INTEGER,
    pourcentage_visionne DECIMAL(5,2),
    
    -- Interactions
    pauses INTEGER DEFAULT 0,
    retours_arriere INTEGER DEFAULT 0,
    changements_vitesse INTEGER DEFAULT 0,
    activation_sous_titres BOOLEAN DEFAULT false,
    
    -- Qualité et performance
    qualite_selectionnee VARCHAR(10),
    temps_chargement_ms INTEGER,
    interruptions_reseau INTEGER DEFAULT 0,
    
    -- Contexte
    device_type VARCHAR(20), -- 'desktop', 'mobile', 'tablet'
    navigateur VARCHAR(50),
    resolution_ecran VARCHAR(20),
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Table pour la configuration des modèles IA (évolutivité)
CREATE TABLE IF NOT EXISTS modeles_ia_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_modele VARCHAR(100) UNIQUE NOT NULL,
    type_modele VARCHAR(50) NOT NULL, -- 'vision', 'text', 'multimodal'
    
    -- Configuration API
    provider VARCHAR(50) NOT NULL, -- 'openai', 'anthropic', 'google', 'custom'
    endpoint_url TEXT,
    api_key_ref VARCHAR(100), -- Référence sécurisée à la clé API
    modele_version VARCHAR(50),
    
    -- Paramètres par défaut
    temperature DECIMAL(3,2) DEFAULT 0.1,
    max_tokens INTEGER DEFAULT 1000,
    timeout_secondes INTEGER DEFAULT 30,
    
    -- Coûts et limites
    cout_par_token DECIMAL(10,6),
    limite_requetes_minute INTEGER DEFAULT 60,
    limite_tokens_jour INTEGER,
    
    -- Performance et qualité
    precision_moyenne DECIMAL(3,2),
    temps_reponse_moyen_ms INTEGER,
    taux_erreur DECIMAL(5,4),
    
    -- Statut
    actif BOOLEAN DEFAULT true,
    date_derniere_utilisation TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 7. Table pour les templates de génération automatique
CREATE TABLE IF NOT EXISTS templates_generation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type_template VARCHAR(50) NOT NULL, -- 'video_script', 'ia_prompt', 'workflow_etape'
    nom_template VARCHAR(100) NOT NULL,
    
    -- Contenu du template
    template_fr TEXT NOT NULL,
    template_de TEXT,
    template_en TEXT,
    template_lu TEXT,
    template_pt TEXT,
    
    -- Variables disponibles
    variables_disponibles JSON, -- ['nom_aide', 'type_document', 'etape_courante']
    variables_obligatoires JSON,
    
    -- Configuration
    categorie VARCHAR(50), -- 'aide_sociale', 'logement', 'famille', 'energie'
    priorite INTEGER DEFAULT 1,
    
    -- Métadonnées
    description TEXT,
    exemple_utilisation TEXT,
    auteur VARCHAR(100),
    
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_videos_aide_etape ON videos_explicatives(aide_id, etape_id);
CREATE INDEX IF NOT EXISTS idx_videos_type_position ON videos_explicatives(type_video, position_affichage);
CREATE INDEX IF NOT EXISTS idx_documents_ia_aide_type ON documents_ia_validation(aide_id, type_document);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions_utilisateur(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expiration ON sessions_utilisateur(date_expiration) WHERE suppression_programmee = true;
CREATE INDEX IF NOT EXISTS idx_historique_session_date ON historique_validations_ia(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_video_session ON analytics_videos(video_id, session_id);
CREATE INDEX IF NOT EXISTS idx_modeles_actifs ON modeles_ia_config(actif, type_modele);
CREATE INDEX IF NOT EXISTS idx_templates_type_categorie ON templates_generation(type_template, categorie);

-- Triggers pour la mise à jour automatique des timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos_explicatives
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_ia_updated_at BEFORE UPDATE ON documents_ia_validation
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modeles_ia_updated_at BEFORE UPDATE ON modeles_ia_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates_generation
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour la suppression automatique des sessions expirées (RGPD)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    -- Supprimer les sessions expirées
    DELETE FROM sessions_utilisateur 
    WHERE date_expiration < NOW() AND suppression_programmee = true;
    
    -- Supprimer les fichiers temporaires de validation IA (plus de 24h)
    UPDATE historique_validations_ia 
    SET fichier_url = NULL 
    WHERE created_at < NOW() - INTERVAL '24 hours' AND fichier_url IS NOT NULL;
    
    -- Log de nettoyage
    INSERT INTO configuration_technique (cle, type_valeur, valeur_texte)
    VALUES ('derniere_suppression_sessions', 'timestamp', NOW()::text)
    ON CONFLICT (cle) DO UPDATE SET 
        valeur_texte = NOW()::text,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Données de test pour les nouvelles fonctionnalités
INSERT INTO modeles_ia_config (nom_modele, type_modele, provider, modele_version, cout_par_token, actif) VALUES
('gpt-4-vision-preview', 'vision', 'openai', 'gpt-4-vision-preview', 0.00001, true),
('claude-3-vision', 'vision', 'anthropic', 'claude-3-sonnet-20240229', 0.000008, true),
('gpt-4-turbo', 'text', 'openai', 'gpt-4-turbo-preview', 0.00001, true);

INSERT INTO templates_generation (type_template, nom_template, template_fr, variables_disponibles, categorie) VALUES
('video_script', 'Introduction Aide Sociale', 
'Bonjour et bienvenue dans votre démarche pour obtenir {nom_aide}. Cette aide est destinée à {description_courte}. Dans cette vidéo, nous allons vous expliquer étape par étape comment procéder.',
'["nom_aide", "description_courte", "conditions_principales"]', 'aide_sociale'),

('ia_prompt', 'Validation Fiche de Paie',
'Analysez cette fiche de paie et vérifiez la présence des éléments suivants : nom et prénom de l''employé, période de paie, salaire brut et net, nom de l''employeur, signature ou tampon. Retournez un JSON avec les champs détectés et un score de confiance.',
'["langue", "periode_requise"]', 'documents'),

('workflow_etape', 'Vérification Éligibilité Standard',
'Nous allons maintenant vérifier si vous remplissez les conditions pour bénéficier de {nom_aide}. Cette vérification prend environ {duree_estimee} minutes.',
'["nom_aide", "duree_estimee", "conditions_principales"]', 'eligibilite');

-- Commentaires pour la documentation
COMMENT ON TABLE videos_explicatives IS 'Gestion des vidéos explicatives multilingues avec métadonnées complètes';
COMMENT ON TABLE documents_ia_validation IS 'Configuration des validations IA pour chaque type de document';
COMMENT ON TABLE sessions_utilisateur IS 'Sessions utilisateur avec gestion RGPD et chiffrement côté client';
COMMENT ON TABLE historique_validations_ia IS 'Historique complet des validations IA pour traçabilité et amélioration';
COMMENT ON TABLE analytics_videos IS 'Analytics détaillées du visionnage des vidéos explicatives';
COMMENT ON TABLE modeles_ia_config IS 'Configuration centralisée des modèles IA avec gestion des coûts';
COMMENT ON TABLE templates_generation IS 'Templates pour la génération automatique de contenu multilingue';

-- Affichage du résumé de la migration
DO $$
BEGIN
    RAISE NOTICE 'Migration des fonctionnalités avancées AssistLux terminée avec succès !';
    RAISE NOTICE '✅ 7 nouvelles tables créées';
    RAISE NOTICE '✅ Index d''optimisation ajoutés';
    RAISE NOTICE '✅ Triggers de mise à jour automatique configurés';
    RAISE NOTICE '✅ Fonction de nettoyage RGPD créée';
    RAISE NOTICE '✅ Données de test insérées';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables créées :';
    RAISE NOTICE '- videos_explicatives (gestion vidéos multilingues)';
    RAISE NOTICE '- documents_ia_validation (scanner IA documents)';
    RAISE NOTICE '- sessions_utilisateur (sessions RGPD)';
    RAISE NOTICE '- historique_validations_ia (traçabilité IA)';
    RAISE NOTICE '- analytics_videos (métriques vidéos)';
    RAISE NOTICE '- modeles_ia_config (configuration IA)';
    RAISE NOTICE '- templates_generation (génération automatique)';
END $$; 