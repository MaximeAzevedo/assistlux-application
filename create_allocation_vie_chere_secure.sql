-- Script de création pour l'Allocation de Vie Chère 2025
-- RGPD COMPLIANT - Sécurité maximale avec IA

-- ===============================================
-- 1. ALLOCATION VIE CHERE - Configuration principale
-- ===============================================

-- Ajouter l'allocation de vie chère dans les aides existantes
INSERT INTO config_aide (
    nom_aide, 
    description_courte, 
    description_longue, 
    actif, 
    ordre_affichage, 
    icone, 
    couleur
) VALUES (
    'Allocation de vie chère 2025',
    'Aide du Fonds national de solidarité pour faire face au coût de la vie',
    'Allocation destinée aux résidents luxembourgeois pour compenser l''augmentation du coût de la vie. Montant calculé selon la composition du ménage et les revenus.',
    true,
    1,
    'Euro',
    'purple'
) ON CONFLICT DO NOTHING;

-- Récupérer l'ID de l'aide créée
-- (Sera utilisé dans les insertions suivantes)

-- ===============================================
-- 2. ÉTAPES DU FORMULAIRE (5 étapes)
-- ===============================================

-- Étape 1: Demandeur principal
INSERT INTO etapes (aide_id, nom_etape, description, ordre, obligatoire) VALUES 
((SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025'), 
 'Demandeur principal', 
 'Informations sur le demandeur principal de l''allocation', 
 1, true);

-- Étape 2: Composition du ménage  
INSERT INTO etapes (aide_id, nom_etape, description, ordre, obligatoire) VALUES 
((SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025'), 
 'Composition du ménage', 
 'Informations sur les membres du ménage (conjoint, enfants, autres)', 
 2, true);

-- Étape 3: Logement
INSERT INTO etapes (aide_id, nom_etape, description, ordre, obligatoire) VALUES 
((SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025'), 
 'Logement', 
 'Informations sur le logement actuel', 
 3, true);

-- Étape 4: Revenus et ressources
INSERT INTO etapes (aide_id, nom_etape, description, ordre, obligatoire) VALUES 
((SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025'), 
 'Revenus et ressources', 
 'Déclaration des revenus de tous les membres du ménage', 
 4, true);

-- Étape 5: Documents et finalisation
INSERT INTO etapes (aide_id, nom_etape, description, ordre, obligatoire) VALUES 
((SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025'), 
 'Documents et finalisation', 
 'Upload des justificatifs et finalisation de la demande', 
 5, true);

-- ===============================================
-- 3. CHAMPS FORMULAIRE MULTILINGUES
-- ===============================================

-- ÉTAPE 1: Demandeur principal
INSERT INTO champs_formulaire (etape_id, nom_champ, type_champ, label_fr, label_de, label_lu, obligatoire, ordre, validation_regex) VALUES

-- Informations personnelles
((SELECT id FROM etapes WHERE nom_etape = 'Demandeur principal' AND aide_id = (SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025')),
'civilite', 'select', 'Civilité', 'Anrede', 'Zivilstand', true, 1, NULL),

((SELECT id FROM etapes WHERE nom_etape = 'Demandeur principal' AND aide_id = (SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025')),
'nom', 'text', 'Nom de famille', 'Nachname', 'Familljennumm', true, 2, '^[A-Za-zÀ-ÿ\s-]{2,50}$'),

((SELECT id FROM etapes WHERE nom_etape = 'Demandeur principal' AND aide_id = (SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025')),
'prenom', 'text', 'Prénom', 'Vorname', 'Virnumm', true, 3, '^[A-Za-zÀ-ÿ\s-]{2,50}$'),

((SELECT id FROM etapes WHERE nom_etape = 'Demandeur principal' AND aide_id = (SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025')),
'date_naissance', 'date', 'Date de naissance', 'Geburtsdatum', 'Gebuertsdag', true, 4, NULL),

((SELECT id FROM etapes WHERE nom_etape = 'Demandeur principal' AND aide_id = (SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025')),
'matricule', 'text', 'Numéro de matricule luxembourgeois', 'Luxemburgische Matrikelnummer', 'Lëtzebuerger Matrikelnummer', true, 5, '^[0-9]{13}$'),

((SELECT id FROM etapes WHERE nom_etape = 'Demandeur principal' AND aide_id = (SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025')),
'nationalite', 'select', 'Nationalité', 'Staatsangehörigkeit', 'Nationalitéit', true, 6, NULL),

-- Adresse
((SELECT id FROM etapes WHERE nom_etape = 'Demandeur principal' AND aide_id = (SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025')),
'adresse_rue', 'text', 'Rue et numéro', 'Straße und Hausnummer', 'Strooss an Hausnummer', true, 7, NULL),

((SELECT id FROM etapes WHERE nom_etape = 'Demandeur principal' AND aide_id = (SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025')),
'adresse_code_postal', 'text', 'Code postal', 'Postleitzahl', 'Postcode', true, 8, '^L-[0-9]{4}$'),

((SELECT id FROM etapes WHERE nom_etape = 'Demandeur principal' AND aide_id = (SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025')),
'adresse_commune', 'text', 'Commune', 'Gemeinde', 'Gemeng', true, 9, NULL),

-- Contact
((SELECT id FROM etapes WHERE nom_etape = 'Demandeur principal' AND aide_id = (SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025')),
'telephone', 'tel', 'Numéro de téléphone', 'Telefonnummer', 'Telefonnummer', false, 10, '^(\+352)?[0-9\s-]{8,15}$'),

((SELECT id FROM etapes WHERE nom_etape = 'Demandeur principal' AND aide_id = (SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025')),
'email', 'email', 'Adresse e-mail', 'E-Mail-Adresse', 'E-Mail-Adress', false, 11, NULL);

-- ÉTAPE 2: Composition du ménage
INSERT INTO champs_formulaire (etape_id, nom_champ, type_champ, label_fr, label_de, label_lu, obligatoire, ordre, options_select) VALUES

((SELECT id FROM etapes WHERE nom_etape = 'Composition du ménage' AND aide_id = (SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025')),
'situation_familiale', 'select', 'Situation familiale', 'Familienstand', 'Familljestand', true, 1, '["Célibataire", "Marié(e)", "Partenariat", "Divorcé(e)", "Séparé(e)", "Veuf/Veuve"]'),

((SELECT id FROM etapes WHERE nom_etape = 'Composition du ménage' AND aide_id = (SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025')),
'conjoint_present', 'checkbox', 'Conjoint/partenaire dans le ménage', 'Ehepartner/Partner im Haushalt', 'Partner am Haus', false, 2, NULL),

((SELECT id FROM etapes WHERE nom_etape = 'Composition du ménage' AND aide_id = (SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025')),
'nombre_enfants_0_17', 'number', 'Nombre d''enfants de 0 à 17 ans', 'Anzahl Kinder 0-17 Jahre', 'Zuel Kanner 0-17 Joer', true, 3, NULL),

((SELECT id FROM etapes WHERE nom_etape = 'Composition du ménage' AND aide_id = (SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025')),
'nombre_enfants_18_24', 'number', 'Nombre d''enfants de 18 à 24 ans (étudiants)', 'Anzahl Kinder 18-24 Jahre (Studenten)', 'Zuel Kanner 18-24 Joer (Studenten)', false, 4, NULL),

((SELECT id FROM etapes WHERE nom_etape = 'Composition du ménage' AND aide_id = (SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025')),
'autres_personnes', 'number', 'Autres personnes dans le ménage', 'Andere Personen im Haushalt', 'Aner Leit am Haus', false, 5, NULL),

((SELECT id FROM etapes WHERE nom_etape = 'Composition du ménage' AND aide_id = (SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025')),
'total_personnes_menage', 'number', 'Total personnes dans le ménage', 'Gesamtzahl Personen im Haushalt', 'Total Leit am Haus', true, 6, NULL);

-- ÉTAPE 3: Logement  
INSERT INTO champs_formulaire (etape_id, nom_champ, type_champ, label_fr, label_de, label_lu, obligatoire, ordre, options_select) VALUES

((SELECT id FROM etapes WHERE nom_etape = 'Logement' AND aide_id = (SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025')),
'statut_logement', 'select', 'Statut du logement', 'Wohnstatus', 'Wunnstatus', true, 1, '["Propriétaire", "Locataire", "Hébergé gratuitement", "Autre"]'),

((SELECT id FROM etapes WHERE nom_etape = 'Logement' AND aide_id = (SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025')),
'loyer_mensuel', 'number', 'Loyer mensuel (si locataire)', 'Monatliche Miete (falls Mieter)', 'Monatlech Loyere (wann Locataire)', false, 2, NULL),

((SELECT id FROM etapes WHERE nom_etape = 'Logement' AND aide_id = (SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025')),
'charges_mensuelles', 'number', 'Charges mensuelles', 'Monatliche Nebenkosten', 'Monatlech Nebenkosten', false, 3, NULL),

((SELECT id FROM etapes WHERE nom_etape = 'Logement' AND aide_id = (SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025')),
'superficie_logement', 'number', 'Superficie du logement (m²)', 'Wohnfläche (m²)', 'Wunnfläch (m²)', false, 4, NULL),

((SELECT id FROM etapes WHERE nom_etape = 'Logement' AND aide_id = (SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025')),
'nombre_pieces', 'number', 'Nombre de pièces', 'Anzahl Zimmer', 'Zuel Raim', false, 5, NULL);

-- ÉTAPE 4: Revenus et ressources
INSERT INTO champs_formulaire (etape_id, nom_champ, type_champ, label_fr, label_de, label_lu, obligatoire, ordre) VALUES

-- Revenus du demandeur
((SELECT id FROM etapes WHERE nom_etape = 'Revenus et ressources' AND aide_id = (SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025')),
'revenus_salaire_demandeur', 'number', 'Salaire net mensuel du demandeur', 'Monatliches Nettoeinkommen Antragsteller', 'Monatlecht Netto-Erakommen Demandeur', false, 1),

((SELECT id FROM etapes WHERE nom_etape = 'Revenus et ressources' AND aide_id = (SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025')),
'revenus_pension_demandeur', 'number', 'Pension/retraite du demandeur', 'Rente/Pension Antragsteller', 'Pensioun Demandeur', false, 2),

((SELECT id FROM etapes WHERE nom_etape = 'Revenus et ressources' AND aide_id = (SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025')),
'revenus_chomage_demandeur', 'number', 'Allocation chômage du demandeur', 'Arbeitslosengeld Antragsteller', 'Chommage-Allokatioun Demandeur', false, 3),

-- Revenus du conjoint
((SELECT id FROM etapes WHERE nom_etape = 'Revenus et ressources' AND aide_id = (SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025')),
'revenus_salaire_conjoint', 'number', 'Salaire net mensuel du conjoint', 'Monatliches Nettoeinkommen Partner', 'Monatlecht Netto-Erakommen Partner', false, 4),

((SELECT id FROM etapes WHERE nom_etape = 'Revenus et ressources' AND aide_id = (SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025')),
'revenus_pension_conjoint', 'number', 'Pension/retraite du conjoint', 'Rente/Pension Partner', 'Pensioun Partner', false, 5),

-- Autres revenus
((SELECT id FROM etapes WHERE nom_etape = 'Revenus et ressources' AND aide_id = (SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025')),
'allocations_familiales', 'number', 'Allocations familiales totales', 'Gesamtes Kindergeld', 'Total Kannergeld', false, 6),

((SELECT id FROM etapes WHERE nom_etape = 'Revenus et ressources' AND aide_id = (SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025')),
'autres_revenus', 'number', 'Autres revenus (préciser)', 'Sonstige Einkünfte', 'Aner Akomm', false, 7),

((SELECT id FROM etapes WHERE nom_etape = 'Revenus et ressources' AND aide_id = (SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025')),
'total_revenus_menage', 'number', 'Total revenus mensuels du ménage', 'Gesamteinkommen Haushalt monatlich', 'Total Monatlecht Akomm vum Haus', true, 8);

-- ÉTAPE 5: Documents
INSERT INTO champs_formulaire (etape_id, nom_champ, type_champ, label_fr, label_de, label_lu, obligatoire, ordre) VALUES

((SELECT id FROM etapes WHERE nom_etape = 'Documents et finalisation' AND aide_id = (SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025')),
'rib_uploaded', 'checkbox', 'RIB bancaire téléchargé', 'Bankverbindung hochgeladen', 'RIB eropgelueden', true, 1),

((SELECT id FROM etapes WHERE nom_etape = 'Documents et finalisation' AND aide_id = (SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025')),
'justificatifs_revenus_uploaded', 'checkbox', 'Justificatifs de revenus téléchargés', 'Einkommensnachweise hochgeladen', 'Beweiser vum Akomm eropgelueden', true, 2),

((SELECT id FROM etapes WHERE nom_etape = 'Documents et finalisation' AND aide_id = (SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025')),
'pieces_identite_uploaded', 'checkbox', 'Pièces d''identité téléchargées', 'Ausweisdokumente hochgeladen', 'Identitéitspapieren eropgelueden', true, 3),

((SELECT id FROM etapes WHERE nom_etape = 'Documents et finalisation' AND aide_id = (SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025')),
'declaration_honneur', 'checkbox', 'Déclaration sur l''honneur signée', 'Ehrenerklärung unterzeichnet', 'Éierenerkläerung ënnerschriwwen', true, 4),

((SELECT id FROM etapes WHERE nom_etape = 'Documents et finalisation' AND aide_id = (SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025')),
'consentement_traitement', 'checkbox', 'Consentement au traitement des données', 'Zustimmung zur Datenverarbeitung', 'Averstannes mat der Datenverarbechtung', true, 5);

-- ===============================================
-- 4. DOCUMENTS REQUIS
-- ===============================================

INSERT INTO documents (aide_id, nom_document, description_fr, description_de, description_lu, obligatoire, formats_acceptes, ordre) VALUES

((SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025'),
'RIB bancaire',
'Relevé d''identité bancaire (RIB) ou coordonnées bancaires complètes au nom du demandeur',
'Bankverbindung oder vollständige Bankdaten im Namen des Antragstellers',
'Bankverbindung oder komplett Bankdaten op den Numm vum Demandeur',
true, 'pdf,jpg,jpeg,png', 1),

((SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025'),
'Justificatifs revenus demandeur',
'Dernières fiches de paie, attestation employeur, ou justificatifs de pension/allocations du demandeur',
'Letzte Gehaltsabrechnungen, Arbeitgeberbescheinigung oder Nachweis Rente/Beihilfen Antragsteller',
'Lescht Pai-Fichen, Bescheinigung Patron oder Beweis Pensioun/Hëllefen Demandeur',
true, 'pdf,jpg,jpeg,png', 2),

((SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025'),
'Justificatifs revenus conjoint',
'Dernières fiches de paie, attestation employeur, ou justificatifs de pension/allocations du conjoint (si applicable)',
'Letzte Gehaltsabrechnungen, Arbeitgeberbescheinigung oder Nachweis Rente/Beihilfen Partner (falls zutreffend)',
'Lescht Pai-Fichen, Bescheinigung Patron oder Beweis Pensioun/Hëllefen Partner (wann zoutreffend)',
false, 'pdf,jpg,jpeg,png', 3),

((SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025'),
'Pièce identité demandeur',
'Carte d''identité ou passeport du demandeur principal',
'Personalausweis oder Reisepass des Antragstellers',
'Identitéitskaart oder Pass vum Demandeur',
true, 'pdf,jpg,jpeg,png', 4),

((SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025'),
'Pièce identité conjoint',
'Carte d''identité ou passeport du conjoint (si applicable)',
'Personalausweis oder Reisepass des Partners (falls zutreffend)',
'Identitéitskaart oder Pass vum Partner (wann zoutreffend)',
false, 'pdf,jpg,jpeg,png', 5),

((SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025'),
'Justificatif domicile',
'Facture récente (électricité, gaz, eau) ou attestation de domicile',
'Aktuelle Rechnung (Strom, Gas, Wasser) oder Wohnsitzbescheinigung',
'Aktuell Rechnung (Strom, Gas, Waasser) oder Wunnsëtz-Bescheinigung',
true, 'pdf,jpg,jpeg,png', 6);

-- ===============================================
-- 5. BARÈMES ET CALCULS D'ÉLIGIBILITÉ
-- ===============================================

INSERT INTO baremes (aide_id, nom_bareme, type_calcul, parametres, conditions, actif, date_debut, date_fin) VALUES

((SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025'),
'Seuils revenus 2025',
'seuil_revenu',
'{"seuil_1_personne": 2500, "seuil_2_personnes": 3750, "seuil_par_personne_supplementaire": 750, "majoration_enfant": 500}',
'{"residence_luxembourg": true, "demande_avant": "2025-12-31"}',
true, '2025-01-01', '2025-12-31'),

((SELECT id FROM config_aide WHERE nom_aide = 'Allocation de vie chère 2025'),
'Montants allocation 2025',
'montant_allocation',
'{"montant_base_1_personne": 200, "montant_base_2_personnes": 300, "montant_par_enfant": 100, "plafond_maximum": 800}',
'{"eligible": true}',
true, '2025-01-01', '2025-12-31');

-- ===============================================
-- 6. MESSAGES MULTILINGUES SPÉCIFIQUES
-- ===============================================

INSERT INTO messages (cle, fr, de, lu, contexte) VALUES

('allocation.vie.chere.titre', 'Allocation de vie chère 2025', 'Teuerungszulage 2025', 'Deierungsallokatioun 2025', 'titre'),
('allocation.vie.chere.description', 'Demande d''allocation pour faire face au coût de la vie', 'Antrag auf Zulage zur Bewältigung der Lebenshaltungskosten', 'Ufro fir Allokatioun fir mat de Liewenshaaltungskosten ëmzegoen', 'description'),
('allocation.progres.etape1', 'Vos informations personnelles', 'Ihre persönlichen Daten', 'Är perséinlech Informatiounen', 'progression'),
('allocation.progres.etape2', 'Composition de votre ménage', 'Zusammensetzung Ihres Haushalts', 'Zesummesetzung vun Ärem Haushalt', 'progression'),
('allocation.progres.etape3', 'Informations sur votre logement', 'Informationen zu Ihrer Wohnung', 'Informatiounen iwwer Är Wunnung', 'progression'),
('allocation.progres.etape4', 'Vos revenus et ressources', 'Ihre Einkünfte und Ressourcen', 'Är Akomm a Ressourcen', 'progression'),
('allocation.progres.etape5', 'Documents et finalisation', 'Dokumente und Abschluss', 'Dokumenter a Finaliséierung', 'progression'),

('allocation.aide.matricule', 'Le matricule luxembourgeois est composé de 13 chiffres', 'Die luxemburgische Matrikelnummer besteht aus 13 Ziffern', 'Déi lëtzebuerger Matrikelnummer besteet aus 13 Zifferen', 'aide'),
('allocation.aide.revenus', 'Indiquez tous les revenus nets mensuels de votre ménage', 'Geben Sie alle monatlichen Nettoeinkünfte Ihres Haushalts an', 'Gitt all déi monatlech Netto-Akomm vun Ärem Haushalt un', 'aide'),
('allocation.aide.documents', 'Tous les documents doivent être lisibles et récents (moins de 3 mois)', 'Alle Dokumente müssen lesbar und aktuell sein (weniger als 3 Monate)', 'All Dokumenter mussen lieserbar a aktuell sinn (manner wéi 3 Méint)', 'aide'),

('allocation.validation.matricule.invalide', 'Le numéro de matricule doit contenir exactement 13 chiffres', 'Die Matrikelnummer muss genau 13 Ziffern enthalten', 'Déi Matrikelnummer muss genee 13 Zifferen enthalen', 'validation'),
('allocation.validation.revenus.obligatoire', 'Veuillez renseigner au moins un type de revenus', 'Bitte geben Sie mindestens eine Art von Einkommen an', 'Wannechgelift gitt op d''mannst eng Aart vum Akomm un', 'validation'),
('allocation.validation.documents.obligatoires', 'Les documents obligatoires doivent être téléchargés', 'Die obligatorischen Dokumente müssen hochgeladen werden', 'Déi obligatoresch Dokumenter mussen eropgelueden ginn', 'validation'),

('allocation.scanner.rib.prompt', 'Détectez et extrayez l''IBAN de ce document bancaire', 'Erkennen und extrahieren Sie die IBAN aus diesem Bankdokument', 'Erkennt an extrahéiert d''IBAN aus dësem Bankdokument', 'scanner'),
('allocation.scanner.fiche.paie.prompt', 'Extrayez le salaire net mensuel et la période de ce bulletin de paie', 'Extrahieren Sie das monatliche Nettoeinkommen und den Zeitraum aus dieser Gehaltsabrechnung', 'Extrahéiert de monatlech Netto-Loun an d''Periode aus dëser Pai-Fiche', 'scanner'),
('allocation.scanner.piece.identite.prompt', 'Extrayez le nom, prénom et numéro de matricule de cette pièce d''identité', 'Extrahieren Sie Name, Vorname und Matrikelnummer aus diesem Ausweis', 'Extrahéiert den Numm, Virnumm a Matrikelnummer aus dëser Identitéitskaart', 'scanner');

-- ===============================================
-- 7. CONFIGURATION TECHNIQUE SPÉCIFIQUE
-- ===============================================

INSERT INTO configuration_technique (cle, valeur, type_valeur, description, modifiable) VALUES

('allocation_vie_chere_active', 'true', 'boolean', 'Activation de l''allocation de vie chère pour 2025', true),
('allocation_session_duree', '3600', 'number', 'Durée de session en secondes (1 heure)', true),
('allocation_documents_max_size', '10', 'number', 'Taille maximale des documents en MB', true),
('allocation_auto_save_interval', '30', 'number', 'Intervalle de sauvegarde automatique en secondes', true),
('allocation_rgpd_retention_days', '30', 'number', 'Durée de rétention des données en jours (RGPD)', false),
('allocation_audit_level', 'full', 'string', 'Niveau d''audit : basic, full, detailed', true),
('allocation_ia_anonymization', 'true', 'boolean', 'Activation de l''anonymisation avant envoi IA', false),
('allocation_encryption_key_rotation', '24', 'number', 'Rotation des clés de chiffrement en heures', false);

-- ===============================================
-- 8. TABLES SÉCURITÉ RGPD
-- ===============================================

-- Table pour la gestion des sessions anonymes sécurisées
CREATE TABLE IF NOT EXISTS allocation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    
    -- Données chiffrées côté client (jamais en clair)
    donnees_formulaire JSONB, -- Chiffré avec clé de session
    progression_etapes JSONB DEFAULT '{}',
    documents_hashes JSONB DEFAULT '[]', -- Hash des documents, pas les documents
    
    -- Métadonnées session
    langue_preferee VARCHAR(2) DEFAULT 'fr',
    derniere_activite TIMESTAMP DEFAULT NOW(),
    ip_hash VARCHAR(64), -- Hash de l'IP, pas l'IP
    user_agent_hash VARCHAR(64), -- Hash du user agent
    
    -- Consentements RGPD granulaires
    consentement_traitement BOOLEAN DEFAULT false,
    consentement_cookies BOOLEAN DEFAULT false,
    consentement_ia_externe BOOLEAN DEFAULT false,
    consentement_analytics BOOLEAN DEFAULT false,
    date_consentements TIMESTAMP,
    
    -- Gestion automatique RGPD
    date_expiration TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '1 hour'),
    suppression_programmee BOOLEAN DEFAULT true,
    
    -- Audit trail
    nombre_tentatives INTEGER DEFAULT 0,
    derniere_tentative TIMESTAMP,
    actions_utilisateur JSONB DEFAULT '[]', -- Log anonymisé des actions
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table pour l'audit complet des traitements IA
CREATE TABLE IF NOT EXISTS allocation_ai_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES allocation_sessions(id) ON DELETE CASCADE,
    
    -- Traçabilité du traitement IA
    operation_type VARCHAR(50) NOT NULL, -- 'document_scan', 'validation', 'extraction'
    document_type VARCHAR(50), -- 'rib', 'fiche_paie', 'piece_identite'
    
    -- Données envoyées (anonymisées)
    data_hash VARCHAR(64) NOT NULL, -- SHA-256 des données traitées
    data_size_bytes INTEGER,
    anonymized BOOLEAN DEFAULT true,
    
    -- Métadonnées IA
    ai_provider VARCHAR(50) DEFAULT 'openai',
    ai_model VARCHAR(50) DEFAULT 'gpt-4o-mini',
    prompt_type VARCHAR(50),
    
    -- Résultats
    processing_time_ms INTEGER,
    tokens_used INTEGER,
    cost_euros DECIMAL(10,4),
    confidence_score DECIMAL(3,2),
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    
    -- Données de sortie (anonymisées)
    extracted_fields JSONB, -- Champs extraits (anonymisés)
    validation_result JSONB, -- Résultat de validation
    
    -- Conformité RGPD
    rgpd_compliant BOOLEAN DEFAULT true,
    data_retention_hours INTEGER DEFAULT 1,
    suppression_programmee TIMESTAMP DEFAULT (NOW() + INTERVAL '1 hour'),
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table pour le tracking des consentements RGPD
CREATE TABLE IF NOT EXISTS allocation_consentements_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES allocation_sessions(id) ON DELETE CASCADE,
    
    -- Type de consentement
    type_consentement VARCHAR(50) NOT NULL, -- 'traitement', 'cookies', 'ia_externe', 'analytics'
    consentement_donne BOOLEAN NOT NULL,
    
    -- Contexte du consentement
    version_politique_confidentialite VARCHAR(20) DEFAULT '2025.1',
    texte_consentement TEXT, -- Texte exact présenté à l'utilisateur
    langue_consentement VARCHAR(2) DEFAULT 'fr',
    
    -- Révocation
    revoque BOOLEAN DEFAULT false,
    date_revocation TIMESTAMP,
    raison_revocation TEXT,
    
    -- Audit
    ip_hash VARCHAR(64),
    user_agent_hash VARCHAR(64),
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table pour la suppression automatique RGPD
CREATE TABLE IF NOT EXISTS allocation_suppressions_programmees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Référence à supprimer
    reference_type VARCHAR(50) NOT NULL, -- 'session', 'audit', 'document'
    reference_id UUID NOT NULL,
    
    -- Programmation
    date_suppression_prevue TIMESTAMP NOT NULL,
    suppression_effectuee BOOLEAN DEFAULT false,
    date_suppression_reelle TIMESTAMP,
    
    -- Raison légale
    motif_suppression VARCHAR(100) DEFAULT 'expiration_rgpd',
    base_legale VARCHAR(100) DEFAULT 'article_17_rgpd', -- Droit à l'oubli
    
    -- Résultat
    suppression_reussie BOOLEAN,
    erreur_suppression TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===============================================
-- 9. INDEX POUR PERFORMANCES ET SÉCURITÉ
-- ===============================================

-- Index pour les sessions
CREATE INDEX IF NOT EXISTS idx_allocation_sessions_token ON allocation_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_allocation_sessions_expiration ON allocation_sessions(date_expiration) WHERE suppression_programmee = true;
CREATE INDEX IF NOT EXISTS idx_allocation_sessions_active ON allocation_sessions(derniere_activite) WHERE date_expiration > NOW();

-- Index pour l'audit IA
CREATE INDEX IF NOT EXISTS idx_allocation_ai_audit_session ON allocation_ai_audit(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_allocation_ai_audit_operation ON allocation_ai_audit(operation_type, document_type);
CREATE INDEX IF NOT EXISTS idx_allocation_ai_audit_suppression ON allocation_ai_audit(suppression_programmee) WHERE suppression_programmee IS NOT NULL;

-- Index pour les consentements
CREATE INDEX IF NOT EXISTS idx_allocation_consentements_session ON allocation_consentements_audit(session_id, type_consentement);
CREATE INDEX IF NOT EXISTS idx_allocation_consentements_actifs ON allocation_consentements_audit(type_consentement, consentement_donne) WHERE revoque = false;

-- Index pour les suppressions
CREATE INDEX IF NOT EXISTS idx_allocation_suppressions_prevues ON allocation_suppressions_programmees(date_suppression_prevue) WHERE suppression_effectuee = false;

-- ===============================================
-- 10. FONCTIONS AUTOMATIQUES RGPD
-- ===============================================

-- Fonction de nettoyage automatique RGPD
CREATE OR REPLACE FUNCTION nettoyer_donnees_allocation_rgpd()
RETURNS void AS $$
BEGIN
    -- 1. Supprimer les sessions expirées
    DELETE FROM allocation_sessions 
    WHERE date_expiration < NOW() AND suppression_programmee = true;
    
    -- 2. Supprimer les audits IA expirés
    DELETE FROM allocation_ai_audit 
    WHERE suppression_programmee < NOW();
    
    -- 3. Marquer les suppressions programmées comme effectuées
    UPDATE allocation_suppressions_programmees 
    SET suppression_effectuee = true,
        date_suppression_reelle = NOW(),
        suppression_reussie = true
    WHERE date_suppression_prevue <= NOW() 
    AND suppression_effectuee = false;
    
    -- 4. Nettoyer les anciens logs de consentements (après 2 ans)
    DELETE FROM allocation_consentements_audit 
    WHERE created_at < NOW() - INTERVAL '2 years';
    
    -- 5. Log de l'opération de nettoyage
    INSERT INTO configuration_technique (cle, valeur, type_valeur, description)
    VALUES ('derniere_suppression_allocation_rgpd', NOW()::text, 'timestamp', 'Dernière suppression automatique RGPD allocation')
    ON CONFLICT (cle) DO UPDATE SET 
        valeur = NOW()::text,
        updated_at = NOW();
        
    -- 6. Log statistiques (anonymes)
    INSERT INTO configuration_technique (cle, valeur, type_valeur, description)
    VALUES ('stats_sessions_supprimees', '0', 'number', 'Nombre de sessions supprimées lors du dernier nettoyage')
    ON CONFLICT (cle) DO UPDATE SET 
        valeur = (
            SELECT COUNT(*)::text 
            FROM allocation_sessions 
            WHERE date_expiration < NOW() AND suppression_programmee = true
        ),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Fonction de création de session sécurisée
CREATE OR REPLACE FUNCTION creer_session_allocation_securisee(
    p_langue VARCHAR(2) DEFAULT 'fr',
    p_ip_hash VARCHAR(64) DEFAULT NULL,
    p_user_agent_hash VARCHAR(64) DEFAULT NULL
)
RETURNS TABLE(session_token VARCHAR, session_id UUID) AS $$
DECLARE
    v_token VARCHAR(255);
    v_session_id UUID;
BEGIN
    -- Générer un token sécurisé
    v_token := encode(gen_random_bytes(32), 'base64');
    
    -- Créer la session
    INSERT INTO allocation_sessions (
        session_token,
        langue_preferee,
        ip_hash,
        user_agent_hash,
        date_expiration
    ) VALUES (
        v_token,
        p_langue,
        p_ip_hash,
        p_user_agent_hash,
        NOW() + INTERVAL '1 hour'
    ) RETURNING id INTO v_session_id;
    
    -- Programmer la suppression automatique
    INSERT INTO allocation_suppressions_programmees (
        reference_type,
        reference_id,
        date_suppression_prevue,
        motif_suppression
    ) VALUES (
        'session',
        v_session_id,
        NOW() + INTERVAL '1 hour',
        'expiration_automatique_rgpd'
    );
    
    RETURN QUERY SELECT v_token, v_session_id;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- 11. TRIGGERS RGPD
-- ===============================================

-- Trigger pour audit automatique des modifications
CREATE OR REPLACE FUNCTION audit_allocation_modification()
RETURNS TRIGGER AS $$
BEGIN
    -- Log toute modification sur les données sensibles
    INSERT INTO allocation_ai_audit (
        operation_type,
        data_hash,
        rgpd_compliant,
        created_at
    ) VALUES (
        'data_modification',
        encode(sha256(NEW::text::bytea), 'hex'),
        true,
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger aux tables sensibles
CREATE TRIGGER audit_allocation_sessions_modification
    AFTER UPDATE ON allocation_sessions
    FOR EACH ROW EXECUTE FUNCTION audit_allocation_modification();

-- ===============================================
-- 12. DONNÉES DE TEST SÉCURISÉES (Anonymisées)
-- ===============================================

-- Session de test avec données anonymisées
INSERT INTO allocation_sessions (
    session_token,
    donnees_formulaire,
    progression_etapes,
    langue_preferee,
    consentement_traitement,
    consentement_ia_externe,
    date_consentements
) VALUES (
    'TEST_SESSION_' || encode(gen_random_bytes(16), 'base64'),
    '{"encrypted": true, "data": "test_data_encrypted"}',
    '{"etape_1": true, "etape_2": false, "etape_3": false, "etape_4": false, "etape_5": false}',
    'fr',
    true,
    true,
    NOW()
);

-- Audit de test
INSERT INTO allocation_ai_audit (
    operation_type,
    document_type,
    data_hash,
    ai_provider,
    ai_model,
    processing_time_ms,
    tokens_used,
    cost_euros,
    confidence_score,
    success,
    extracted_fields,
    rgpd_compliant
) VALUES (
    'document_scan',
    'rib',
    encode(sha256('test_document_anonymized'::bytea), 'hex'),
    'openai',
    'gpt-4o-mini',
    1500,
    150,
    0.0015,
    0.95,
    true,
    '{"iban": "[ANONYMIZED]", "titulaire": "[ANONYMIZED]", "banque": "BCEE"}',
    true
);

-- Message de succès
INSERT INTO configuration_technique (cle, valeur, type_valeur, description) VALUES
('allocation_vie_chere_setup_complete', 'true', 'boolean', 'Configuration allocation vie chère terminée avec sécurité RGPD maximale'); 