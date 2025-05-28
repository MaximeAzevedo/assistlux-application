/*
  # Create new eligibility tables

  1. New Tables
    - `questions`
      - `id` (uuid, primary key)
      - `ordre` (integer, required)
      - `question` (text, required)
      - `key_reponse` (text, required)
      - `type_reponse` (text, required)
      - `options_json` (jsonb)
      - `branchements_json` (jsonb)
      - `condition_affichage` (text)
      - `created_at` (timestamptz)

    - `conclusions`
      - `id` (uuid, primary key)
      - `titre_aide` (text, required)
      - `logic_condition` (text, required)
      - `texte_conclusion` (text, required)
      - `categorie` (text, required)
      - `action` (text)
      - `url_formulaire` (text)
      - `url_source` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for public read access
*/

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ordre integer NOT NULL,
  question text NOT NULL,
  key_reponse text NOT NULL,
  type_reponse text NOT NULL CHECK (type_reponse IN ('Yes_No', 'Multiple_Choice', 'Number')),
  options_json jsonb,
  branchements_json jsonb,
  condition_affichage text,
  created_at timestamptz DEFAULT now()
);

-- Create conclusions table
CREATE TABLE IF NOT EXISTS conclusions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre_aide text NOT NULL,
  logic_condition text NOT NULL,
  texte_conclusion text NOT NULL,
  categorie text NOT NULL CHECK (categorie IN ('Eligible', 'Ineligible', 'Maybe')),
  action text,
  url_formulaire text,
  url_source text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conclusions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to questions"
  ON questions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access to conclusions"
  ON conclusions
  FOR SELECT
  TO public
  USING (true);