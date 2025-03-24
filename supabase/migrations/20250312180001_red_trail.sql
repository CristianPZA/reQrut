/*
  # Add new candidate fields and tasks table

  1. New Fields
    - Add phone, location, expected_salary, hr_notes, and last_contact to candidates table
    - Add validation for phone format and expected_salary
    - Add duplicate detection via triggers

  2. New Tables
    - Create candidate_tasks table for task management
    - Enable RLS on new table
    - Add policies for task management

  3. Functions
    - Create function to validate phone format
    - Create function to check for duplicates
*/

-- Create function to validate phone format
CREATE OR REPLACE FUNCTION validate_phone_format()
RETURNS trigger AS $$
BEGIN
  IF NEW.phone IS NOT NULL AND NEW.phone !~ '^(\+[0-9]{2}|0)[1-9][0-9]{8}$' THEN
    RAISE EXCEPTION 'Invalid phone format';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to check for duplicates
CREATE OR REPLACE FUNCTION check_candidate_duplicates()
RETURNS trigger AS $$
DECLARE
  duplicate_count integer;
BEGIN
  -- Check for duplicates excluding the current record
  SELECT COUNT(*) INTO duplicate_count
  FROM candidates
  WHERE id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')
  AND (
    name = NEW.name OR
    email = NEW.email OR
    (phone IS NOT NULL AND phone = NEW.phone)
  );
  
  IF duplicate_count > 0 THEN
    RAISE EXCEPTION 'Duplicate candidate found';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add new columns to candidates table
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS expected_salary integer,
ADD COLUMN IF NOT EXISTS hr_notes text,
ADD COLUMN IF NOT EXISTS last_contact timestamptz;

-- Add check constraint for expected_salary
ALTER TABLE candidates
ADD CONSTRAINT candidates_expected_salary_check CHECK (expected_salary >= 0);

-- Create triggers for validation
CREATE TRIGGER validate_candidate_phone
  BEFORE INSERT OR UPDATE ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION validate_phone_format();

CREATE TRIGGER check_candidate_duplicates
  BEFORE INSERT OR UPDATE ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION check_candidate_duplicates();

-- Create candidate_tasks table
CREATE TABLE IF NOT EXISTS candidate_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  due_date timestamptz NOT NULL,
  completed boolean DEFAULT false,
  created_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on tasks table
ALTER TABLE candidate_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for tasks
CREATE POLICY "Users can read tasks for visible candidates"
  ON candidate_tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM candidates c
      WHERE c.id = candidate_tasks.candidate_id
      AND (
        -- RH and Manager can see all tasks
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE id = auth.uid()
          AND role IN ('RH', 'Manager')
        )
        OR
        -- Sales and Tech can see tasks for candidates they need to validate
        (
          EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role IN ('Sales', 'Tech')
          )
          AND c.status IN ('pending', 'pending_sales', 'pending_tech')
        )
      )
    )
  );

CREATE POLICY "RH and Manager can manage tasks"
  ON candidate_tasks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('RH', 'Manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('RH', 'Manager')
    )
  );