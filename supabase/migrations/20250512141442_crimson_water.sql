/*
  # Create locations table for interactive map

  1. New Tables
    - `locations`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `category` (text, required)
      - `latitude` (double precision, required)
      - `longitude` (double precision, required)
      - `address` (text, required)
      - `phone` (text, optional)
      - `website` (text, optional)
      - `email` (text, optional)
      - `hours` (text, optional)
      - `description` (text, optional)
      - `created_at` (timestamptz, auto-generated)

  2. Security
    - Enable RLS on `locations` table
    - Add policy for public read access
*/

CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  address text NOT NULL,
  phone text,
  website text,
  email text,
  hours text,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access"
  ON locations
  FOR SELECT
  TO public
  USING (true);