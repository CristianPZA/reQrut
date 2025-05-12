/*
  # Update Validation Function with Proper Cascade

  1. Changes
    - Drop existing triggers and functions in correct order
    - Recreate functions and triggers with proper table aliases
    - Update status check constraint for candidates table
    - Implement validation rules for technical and non-technical positions

  2. Security
    - Use proper table aliases to avoid ambiguous column references
    - Maintain data integrity during function updates
*/

-- First, drop triggers that depend on the functions
DROP TRIGGER IF EXISTS on_validation_change ON candidate_validations;
DROP TRIGGER IF EXISTS trigger_update_candidate_status ON candidate_validations;

-- Then drop the functions
DROP FUNCTION IF EXISTS trigger_update_candidate_status();
DROP FUNCTION IF EXISTS update_candidate_status(UUID);

-- Update status check constraint
ALTER TABLE candidates
DROP CONSTRAINT IF EXISTS candidates_status_check;

ALTER TABLE candidates
ADD CONSTRAINT candidates_status_check 
CHECK (status IN (
  'draft',
  'pending',
  'pending_tech',
  'pending_sales',
  'validated',
  'rejected',
  'hired'
));

-- Create function to update candidate status
CREATE OR REPLACE FUNCTION update_candidate_status(p_candidate_id UUID)
RETURNS void AS $$
DECLARE
  v_candidate RECORD;
  v_tech_validation RECORD;
  v_sales_validation RECORD;
  v_new_status text;
BEGIN
  -- Get candidate info with table alias
  SELECT c.* INTO v_candidate
  FROM candidates c
  WHERE c.id = p_candidate_id;

  -- Get latest tech validation with table alias
  SELECT cv.* INTO v_tech_validation
  FROM candidate_validations cv
  WHERE cv.candidate_id = p_candidate_id
    AND cv.type = 'tech'
  ORDER BY cv.created_at DESC
  LIMIT 1;

  -- Get latest sales validation with table alias
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

  -- Update candidate status with table alias
  UPDATE candidates c
  SET status = v_new_status
  WHERE c.id = p_candidate_id;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function
CREATE OR REPLACE FUNCTION trigger_update_candidate_status()
RETURNS trigger AS $$
BEGIN
  -- Call the update function with the candidate_id
  PERFORM update_candidate_status(NEW.candidate_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER on_validation_change
  AFTER INSERT OR UPDATE ON candidate_validations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_candidate_status();