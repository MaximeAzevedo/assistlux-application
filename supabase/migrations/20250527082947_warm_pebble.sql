/*
  # Create French map locations table

  1. New Tables
    - `fr_map_locations`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `category` (text, required)
      - `service_type` (text array)
      - `address` (text, required)
      - `phone` (text)
      - `email` (text)
      - `website` (text)
      - `latitude` (double precision, required)
      - `longitude` (double precision, required)
      - `youtube_link` (text)
      - `hours` (text)
      - `public_info` (text)
      - `created_at` (timestamp with time zone)

  2. Security
    - Enable RLS on `fr_map_locations` table
    - Add policy for public read access
*/

CREATE TABLE IF NOT EXISTS fr_map_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  service_type text[] DEFAULT '{}',
  address text NOT NULL,
  phone text,
  email text,
  website text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  youtube_link text,
  hours text,
  public_info text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE fr_map_locations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access"
  ON fr_map_locations
  FOR SELECT
  TO public
  USING (true);