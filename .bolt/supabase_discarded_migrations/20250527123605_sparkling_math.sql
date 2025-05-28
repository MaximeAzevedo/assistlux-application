/*
  # Create eligibility checker tables

  1. New Tables
    - `eligibility_aids` - Available social aids
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `description` (text)
      - `url` (text)
      - `created_at` (timestamptz)
      
    - `eligibility_questions` - Questions for eligibility check
      - `id` (uuid, primary key)
      - `question` (text, required)
      - `type` (text, required)
      - `options` (text[])
      - `order` (integer)
      - `created_at` (timestamptz)
      
    - `eligibility_rules` - Rules for determining eligibility
      - `id` (uuid, primary key)
      - `aid_id` (uuid, foreign key)
      - `question_id` (uuid, foreign key)
      - `operator` (text)
      - `value` (text)
      - `weight` (integer)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access
*/

-- Create aids table
CREATE TABLE IF NOT EXISTS eligibility_aids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  url text,
  created_at timestamptz DEFAULT now()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS eligibility_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  type text NOT NULL CHECK (type IN ('numeric', 'boolean', 'single_select')),
  options text[],
  "order" integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create rules table
CREATE TABLE IF NOT EXISTS eligibility_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aid_id uuid REFERENCES eligibility_aids(id) ON DELETE CASCADE,
  question_id uuid REFERENCES eligibility_questions(id) ON DELETE CASCADE,
  operator text NOT NULL CHECK (operator IN ('=', '<', '<=', '>', '>=')),
  value text NOT NULL,
  weight integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE eligibility_aids ENABLE ROW LEVEL SECURITY;
ALTER TABLE eligibility_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE eligibility_rules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access on aids"
  ON eligibility_aids
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access on questions"
  ON eligibility_questions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access on rules"
  ON eligibility_rules
  FOR SELECT
  TO public
  USING (true);