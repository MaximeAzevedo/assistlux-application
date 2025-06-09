-- Migration simple : Ajouter les horaires multilingues à fr_map_locations
-- Cette approche pragmatique modifie la table existante au lieu de tout refaire

-- 1. Ajouter les colonnes d'horaires multilingues
ALTER TABLE fr_map_locations 
ADD COLUMN IF NOT EXISTS horaires_fr TEXT,
ADD COLUMN IF NOT EXISTS horaires_de TEXT,
ADD COLUMN IF NOT EXISTS horaires_en TEXT,
ADD COLUMN IF NOT EXISTS horaires_lu TEXT,
ADD COLUMN IF NOT EXISTS horaires_pt TEXT;

-- 2. Mettre à jour les données existantes avec des horaires bien formatés
UPDATE fr_map_locations 
SET 
  horaires_fr = CASE 
    WHEN name = 'Banque Alimentaire Luxembourg' THEN 
      'Lundi - Vendredi: 09h00 - 12h00 & 14h00 - 17h00' || E'\n' ||
      'Samedi: 10h00 - 16h00' || E'\n' ||
      'Dimanche: Fermé' || E'\n' ||
      'Fermé les jours fériés'
    WHEN name = 'Caritas Luxembourg' THEN 
      'Lundi - Vendredi: 08h30 - 17h30' || E'\n' ||
      'Samedi - Dimanche: Fermé' || E'\n' ||
      'Rendez-vous recommandé'
    WHEN name = 'Croix-Rouge Luxembourg' THEN 
      'Urgences: 24h/24, 7j/7' || E'\n' ||
      'Services administratifs: Lundi - Vendredi 09h00 - 17h00'
    ELSE 'Horaires à confirmer'
  END,
  horaires_de = CASE 
    WHEN name = 'Banque Alimentaire Luxembourg' THEN 
      'Montag - Freitag: 09:00 - 12:00 & 14:00 - 17:00' || E'\n' ||
      'Samstag: 10:00 - 16:00' || E'\n' ||
      'Sonntag: Geschlossen' || E'\n' ||
      'An Feiertagen geschlossen'
    WHEN name = 'Caritas Luxembourg' THEN 
      'Montag - Freitag: 08:30 - 17:30' || E'\n' ||
      'Samstag - Sonntag: Geschlossen' || E'\n' ||
      'Termin empfohlen'
    WHEN name = 'Croix-Rouge Luxembourg' THEN 
      'Notfälle: 24/7' || E'\n' ||
      'Verwaltung: Montag - Freitag 09:00 - 17:00'
    ELSE 'Öffnungszeiten zu bestätigen'
  END,
  horaires_en = CASE 
    WHEN name = 'Banque Alimentaire Luxembourg' THEN 
      'Monday - Friday: 09:00 - 12:00 & 14:00 - 17:00' || E'\n' ||
      'Saturday: 10:00 - 16:00' || E'\n' ||
      'Sunday: Closed' || E'\n' ||
      'Closed on public holidays'
    WHEN name = 'Caritas Luxembourg' THEN 
      'Monday - Friday: 08:30 - 17:30' || E'\n' ||
      'Saturday - Sunday: Closed' || E'\n' ||
      'Appointment recommended'
    WHEN name = 'Croix-Rouge Luxembourg' THEN 
      'Emergencies: 24/7' || E'\n' ||
      'Admin services: Monday - Friday 09:00 - 17:00'
    ELSE 'Hours to be confirmed'
  END,
  horaires_lu = CASE 
    WHEN name = 'Banque Alimentaire Luxembourg' THEN 
      'Méindeg - Freideg: 09:00 - 12:00 & 14:00 - 17:00' || E'\n' ||
      'Samschdeg: 10:00 - 16:00' || E'\n' ||
      'Sonndeg: Zou' || E'\n' ||
      'Zou op Feierdeeg'
    WHEN name = 'Caritas Luxembourg' THEN 
      'Méindeg - Freideg: 08:30 - 17:30' || E'\n' ||
      'Samschdeg - Sonndeg: Zou' || E'\n' ||
      'Rendez-vous recommandéiert'
    WHEN name = 'Croix-Rouge Luxembourg' THEN 
      'Noutfäll: 24/7' || E'\n' ||
      'Verwaltung: Méindeg - Freideg 09:00 - 17:00'
    ELSE 'Stonnen ze confirméieren'
  END,
  horaires_pt = CASE 
    WHEN name = 'Banque Alimentaire Luxembourg' THEN 
      'Segunda - Sexta: 09:00 - 12:00 & 14:00 - 17:00' || E'\n' ||
      'Sábado: 10:00 - 16:00' || E'\n' ||
      'Domingo: Fechado' || E'\n' ||
      'Fechado nos feriados'
    WHEN name = 'Caritas Luxembourg' THEN 
      'Segunda - Sexta: 08:30 - 17:30' || E'\n' ||
      'Sábado - Domingo: Fechado' || E'\n' ||
      'Agendamento recomendado'
    WHEN name = 'Croix-Rouge Luxembourg' THEN 
      'Emergências: 24h/7dias' || E'\n' ||
      'Serviços admin: Segunda - Sexta 09:00 - 17:00'
    ELSE 'Horários a confirmar'
  END;

-- 3. Mettre à jour la colonne hours existante avec la version française
UPDATE fr_map_locations 
SET hours = horaires_fr;

-- 4. Ajouter un commentaire pour documenter
COMMENT ON COLUMN fr_map_locations.horaires_fr IS 'Horaires d''ouverture en français, format lisible';
COMMENT ON COLUMN fr_map_locations.horaires_de IS 'Horaires d''ouverture en allemand';
COMMENT ON COLUMN fr_map_locations.horaires_en IS 'Horaires d''ouverture en anglais';
COMMENT ON COLUMN fr_map_locations.horaires_lu IS 'Horaires d''ouverture en luxembourgeois';
COMMENT ON COLUMN fr_map_locations.horaires_pt IS 'Horaires d''ouverture en portugais';

-- 5. Afficher le résumé
DO $$
BEGIN
    RAISE NOTICE '✅ Migration des horaires multilingues terminée !';
    RAISE NOTICE '📋 Table modifiée : fr_map_locations';
    RAISE NOTICE '🌍 Langues supportées : FR, DE, EN, LU, PT';
    RAISE NOTICE '⏰ Horaires formatés et lisibles ajoutés';
    RAISE NOTICE '';
    RAISE NOTICE 'Exemple de format :';
    RAISE NOTICE 'Lundi - Vendredi: 09h00 - 12h00 & 14h00 - 17h00';
    RAISE NOTICE 'Samedi: 10h00 - 16h00';
    RAISE NOTICE 'Dimanche: Fermé';
END $$; 