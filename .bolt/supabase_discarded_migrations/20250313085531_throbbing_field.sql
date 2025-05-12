/*
  # Verify Technical Position Column and Fix Joins

  1. Changes
    - Verify is_technical_position column exists
    - Add it if missing
    - Update validation queries to use explicit table aliases

  2. Security
    - Maintain existing RLS policies
    - Ensure data integrity during column addition
*/

-- First verify if is_technical_position column exists, add if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'candidates' 
    AND column_name = 'is_technical_position'
  ) THEN
    ALTER TABLE candidates 
    ADD COLUMN is_technical_position boolean DEFAULT false;
  END IF;
END $$;

-- Update the update_candidate_status function to use explicit aliases
CREATE OR REPLACE FUNCTION update_candidate_status(p_candidate_id UUID)
RETURNS void AS $$
DECLARE
  v_candidate RECORD;
  v_tech_validation RECORD;
  v_sales_validation RECORD;
  v_new_status text;
BEGIN
  -- Get candidate info with explicit alias
  SELECT c.* INTO v_candidate
  FROM candidates c
  WHERE c.id = p_candidate_id;

  -- Get latest tech validation with explicit alias
  SELECT cv.* INTO v_tech_validation
  FROM candidate_validations cv
  WHERE cv.candidate_id = p_candidate_id
    AND cv.type = 'tech'
  ORDER BY cv.created_at DESC
  LIMIT 1;

  -- Get latest sales validation with explicit alias
  SELECT cv.* INTO v_sales_validation
  FROM candidate_validations cv
  WHERE cv.candidate_id = p_candidate_id
    AND cv.type = 'sales'
  ORDER BY cv.created_at DESC
  LIMIT 1;

  -- Determine status based on position type and validations
  IF NOT v_candidate.is_technical_position THEN
    -- Non-technical position: only sales validation matters
    IF v_sales_validation.status = 'approved' THEN
      v_new_status := 'validated';
    ELSIF v_sales_validation.status = 'rejected' THEN
      v_new_status := 'rejected';
    ELSE
      v_new_status := 'pending_sales';
    END IF;
  ELSE
    -- Technical position: both validations matter
    IF v_tech_validation IS NULL AND v_sales_validation IS NULL THEN
      v_new_status := 'pending';
    ELSIF v_tech_validation IS NULL AND v_sales_validation.status = 'approved' THEN
      v_new_status := 'pending_tech';
    ELSIF v_tech_validation.status = 'rejected' THEN
      v_new_status := 'rejected';
    ELSIF v_tech_validation.status = 'approved' THEN
      IF v_sales_validation IS NULL THEN
        v_new_status := 'pending_sales';
      ELSIF v_sales_validation.status = 'approved' OR v_sales_validation.status = 'rejected' THEN
        -- Tech approval takes precedence
        v_new_status := 'validated';
      END IF;
    ELSIF v_sales_validation IS NOT NULL AND v_tech_validation IS NULL THEN
      v_new_status := 'pending_tech';
    END IF;
  END IF;

  -- Update candidate status with explicit alias
  UPDATE candidates c
  SET status = v_new_status
  WHERE c.id = p_candidate_id;
END;
$$ LANGUAGE plpgsql;

-- Update trigger function to use explicit alias
CREATE OR REPLACE FUNCTION trigger_update_candidate_status()
RETURNS trigger AS $$
BEGIN
  -- Call the update function with the candidate_id from NEW record
  PERFORM update_candidate_status(NEW.candidate_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger with explicit alias reference
DROP TRIGGER IF EXISTS on_validation_change ON candidate_validations;
CREATE TRIGGER on_validation_change
  AFTER INSERT OR UPDATE ON candidate_validations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_candidate_status();