/*
  # Add job positions and skills management with safe operations

  1. New Tables (if they don't exist)
    - `job_positions`
      - `id` (uuid, primary key)
      - `title` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `skills`
      - `id` (uuid, primary key)
      - `name` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Only Manager can manage job positions and skills
    - All authenticated users can read job positions and skills
*/

-- Create tables using safe operations
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS job_positions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL UNIQUE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );
EXCEPTION
  WHEN duplicate_table THEN
    NULL;
END $$;

DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS skills (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );
EXCEPTION
  WHEN duplicate_table THEN
    NULL;
END $$;

-- Enable RLS safely
DO $$ BEGIN
  ALTER TABLE job_positions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END $$;

-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "All users can read job positions" ON job_positions;
  DROP POLICY IF EXISTS "Only Manager can manage job positions" ON job_positions;
  DROP POLICY IF EXISTS "All users can read skills" ON skills;
  DROP POLICY IF EXISTS "Only Manager can manage skills" ON skills;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Create policies
DO $$ BEGIN
  -- Policies for job_positions
  CREATE POLICY "All users can read job positions"
    ON job_positions
    FOR SELECT
    TO authenticated
    USING (true);

  CREATE POLICY "Only Manager can manage job positions"
    ON job_positions
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role = 'Manager'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role = 'Manager'
      )
    );

  -- Policies for skills
  CREATE POLICY "All users can read skills"
    ON skills
    FOR SELECT
    TO authenticated
    USING (true);

  CREATE POLICY "Only Manager can manage skills"
    ON skills
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role = 'Manager'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role = 'Manager'
      )
    );
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- Add validation rules to candidates table safely
DO $$ BEGIN
  ALTER TABLE candidates
    ADD COLUMN IF NOT EXISTS override_by uuid REFERENCES user_profiles(id),
    ADD COLUMN IF NOT EXISTS override_reason text;
EXCEPTION
  WHEN duplicate_column THEN
    NULL;
END $$;