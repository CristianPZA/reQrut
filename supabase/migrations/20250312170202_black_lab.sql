/*
  # Create candidates management tables with safe operations

  1. New Tables (if they don't exist)
    - `candidates`
    - `candidate_documents`
    - `candidate_comments`
    - `candidate_validations`

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access
*/

-- Candidates table
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS candidates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text NOT NULL,
    position text NOT NULL,
    skills text[] NOT NULL DEFAULT '{}',
    status text NOT NULL DEFAULT 'pending',
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES user_profiles(id),
    CONSTRAINT candidates_status_check CHECK (status IN ('pending', 'approved_sales', 'approved_tech', 'rejected', 'hired'))
  );
EXCEPTION
  WHEN duplicate_table THEN
    NULL;
END $$;

-- Documents table
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS candidate_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
    name text NOT NULL,
    url text NOT NULL,
    created_at timestamptz DEFAULT now()
  );
EXCEPTION
  WHEN duplicate_table THEN
    NULL;
END $$;

-- Comments table
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS candidate_comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
    user_id uuid REFERENCES user_profiles(id),
    comment text NOT NULL,
    created_at timestamptz DEFAULT now()
  );
EXCEPTION
  WHEN duplicate_table THEN
    NULL;
END $$;

-- Validations table
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS candidate_validations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
    user_id uuid REFERENCES user_profiles(id),
    type text NOT NULL,
    status text NOT NULL,
    justification text,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT candidate_validations_type_check CHECK (type IN ('sales', 'tech')),
    CONSTRAINT candidate_validations_status_check CHECK (status IN ('approved', 'rejected'))
  );
EXCEPTION
  WHEN duplicate_table THEN
    NULL;
END $$;

-- Enable RLS
DO $$ BEGIN
  ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
  ALTER TABLE candidate_documents ENABLE ROW LEVEL SECURITY;
  ALTER TABLE candidate_comments ENABLE ROW LEVEL SECURITY;
  ALTER TABLE candidate_validations ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END $$;

-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "RH can create candidates" ON candidates;
  DROP POLICY IF EXISTS "All authenticated users can view candidates" ON candidates;
  DROP POLICY IF EXISTS "RH and Manager can update candidates" ON candidates;
  DROP POLICY IF EXISTS "All authenticated users can view documents" ON candidate_documents;
  DROP POLICY IF EXISTS "RH can manage documents" ON candidate_documents;
  DROP POLICY IF EXISTS "All authenticated users can view comments" ON candidate_comments;
  DROP POLICY IF EXISTS "All authenticated users can create comments" ON candidate_comments;
  DROP POLICY IF EXISTS "All authenticated users can view validations" ON candidate_validations;
  DROP POLICY IF EXISTS "Sales and Tech can create validations" ON candidate_validations;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END $$;

-- Create policies
DO $$ BEGIN
  -- Policies for candidates table
  CREATE POLICY "RH can create candidates"
    ON candidates
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role = 'RH'
      )
    );

  CREATE POLICY "All authenticated users can view candidates"
    ON candidates
    FOR SELECT
    TO authenticated
    USING (true);

  CREATE POLICY "RH and Manager can update candidates"
    ON candidates
    FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role IN ('RH', 'Manager')
      )
    );

  -- Policies for documents
  CREATE POLICY "All authenticated users can view documents"
    ON candidate_documents
    FOR SELECT
    TO authenticated
    USING (true);

  CREATE POLICY "RH can manage documents"
    ON candidate_documents
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role = 'RH'
      )
    );

  -- Policies for comments
  CREATE POLICY "All authenticated users can view comments"
    ON candidate_comments
    FOR SELECT
    TO authenticated
    USING (true);

  CREATE POLICY "All authenticated users can create comments"
    ON candidate_comments
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

  -- Policies for validations
  CREATE POLICY "All authenticated users can view validations"
    ON candidate_validations
    FOR SELECT
    TO authenticated
    USING (true);

  CREATE POLICY "Sales and Tech can create validations"
    ON candidate_validations
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role IN ('Sales', 'Tech', 'Manager')
      )
    );
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;