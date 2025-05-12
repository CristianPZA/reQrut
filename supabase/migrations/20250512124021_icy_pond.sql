/*
  # Create fiches table with versioning

  1. New Tables
    - `fiches`
      - `id` (uuid, primary key)
      - `type` (enum: annuelle, projet, evaluation)
      - `status` (enum: brouillon, en_validation, validee, refusee)
      - `contenu` (text)
      - `auteur_id` (uuid, references auth.users)
      - `version` (integer)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)
    - `fiches_versions`
      - Stores historical versions of fiches
      - Includes all fields from fiches plus version metadata

  2. Security
    - Enable RLS on both tables
    - Add policies for CRUD operations
    - Authors can manage their draft fiches
    - Users can read fiches they're involved with

  3. Triggers
    - Automatically increment version number
    - Store previous versions in fiches_versions
    - Update updated_at timestamp
*/

-- Create type for fiche types
CREATE TYPE fiche_type AS ENUM ('annuelle', 'projet', 'evaluation');

-- Create type for fiche status
CREATE TYPE fiche_status AS ENUM ('brouillon', 'en_validation', 'validee', 'refusee');

-- Create fiches table
CREATE TABLE IF NOT EXISTS fiches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type fiche_type NOT NULL,
  status fiche_status NOT NULL DEFAULT 'brouillon',
  contenu text,
  auteur_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create versions table to store history
CREATE TABLE IF NOT EXISTS fiches_versions (
  id uuid NOT NULL,
  type fiche_type NOT NULL,
  status fiche_status NOT NULL,
  contenu text,
  auteur_id uuid NOT NULL,
  version integer NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  version_created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, version)
);

-- Enable RLS
ALTER TABLE fiches ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiches_versions ENABLE ROW LEVEL SECURITY;

-- Create policies for fiches
CREATE POLICY "Users can create their own fiches"
  ON fiches
  FOR INSERT
  TO authenticated
  WITH CHECK (auteur_id = auth.uid());

CREATE POLICY "Users can read their own fiches"
  ON fiches
  FOR SELECT
  TO authenticated
  USING (auteur_id = auth.uid());

CREATE POLICY "Users can update their own draft fiches"
  ON fiches
  FOR UPDATE
  TO authenticated
  USING (auteur_id = auth.uid() AND status = 'brouillon')
  WITH CHECK (auteur_id = auth.uid() AND status = 'brouillon');

-- Create policies for versions
CREATE POLICY "Users can read versions of their own fiches"
  ON fiches_versions
  FOR SELECT
  TO authenticated
  USING (auteur_id = auth.uid());

-- Create function to handle versioning
CREATE OR REPLACE FUNCTION handle_fiche_versioning()
RETURNS TRIGGER AS $$
BEGIN
  -- Store the old version in the versions table
  IF (TG_OP = 'UPDATE') THEN
    INSERT INTO fiches_versions (
      id, type, status, contenu, auteur_id, version,
      created_at, updated_at
    ) VALUES (
      OLD.id, OLD.type, OLD.status, OLD.contenu, OLD.auteur_id, OLD.version,
      OLD.created_at, OLD.updated_at
    );
    
    -- Increment version number
    NEW.version = OLD.version + 1;
    NEW.updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for versioning
CREATE TRIGGER fiche_versioning
  BEFORE UPDATE ON fiches
  FOR EACH ROW
  EXECUTE FUNCTION handle_fiche_versioning();

-- Create index for better performance
CREATE INDEX idx_fiches_auteur_id ON fiches(auteur_id);
CREATE INDEX idx_fiches_versions_id ON fiches_versions(id);