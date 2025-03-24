/*
  # Fix Candidate Validation Logic

  1. Changes
    - Simplify validation logic
    - Non-technical profiles only need Sales validation
    - Technical profiles need both validations
    - Update status check constraint to use 'validated' instead of 'approved'

  2. Status Flow
    - Non-technical profiles:
      - pending_sales → validated/rejected (based on Sales decision)
    - Technical profiles:
      - pending_tech → pending_sales (if Tech approves)
      - pending_tech → rejected (if Tech rejects)
      - pending_sales → validated/rejected (based on Sales decision)
*/

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS on_validation_change ON candidate_validations;
DROP FUNCTION IF EXISTS trigger_update_candidate_status();
DROP FUNCTION IF EXISTS update_candidate_status(UUID);

-- Create simplified validation function
CREATE OR REPLACE FUNCTION update_candidate_status(p_candidate_id UUID)
RETURNS void AS $$
DECLARE
  v_candidate RECORD;
  v_tech_validation RECORD;
  v_sales_validation RECORD;
  v_new_status text;
BEGIN
  -- Get candidate info
  SELECT c.* INTO v_candidate
  FROM candidates c
  WHERE c.id = p_candidate_id;

  -- Get latest validations
  SELECT cv.* INTO v_tech_validation
  FROM candidate_validations cv
  WHERE cv.candidate_id = p_candidate_id
    AND cv.type = 'tech'
  ORDER BY cv.created_at DESC
  LIMIT 1;

  SELECT cv.* INTO v_sales_validation
  FROM candidate_validations cv
  WHERE cv.candidate_id = p_candidate_id
    AND cv.type = 'sales'
  ORDER BY cv.created_at DESC
  LIMIT 1;

  -- Non-technical position: only needs sales validation
  IF NOT v_candidate.is_technical_position THEN
    IF v_sales_validation IS NULL THEN
      v_new_status := 'pending_sales';
    ELSE
      v_new_status := CASE
        WHEN v_sales_validation.status = 'approved' THEN 'validated'
        WHEN v_sales_validation.status = 'rejected' THEN 'rejected'
      END;
    END IF;
  -- Technical position: needs both validations
  ELSE
    IF v_tech_validation IS NULL THEN
      v_new_status := 'pending_tech';
    ELSIF v_tech_validation.status = 'rejected' THEN
      v_new_status := 'rejected';
    ELSIF v_tech_validation.status = 'approved' THEN
      IF v_sales_validation IS NULL THEN
        v_new_status := 'pending_sales';
      ELSE
        v_new_status := CASE
          WHEN v_sales_validation.status = 'approved' THEN 'validated'
          WHEN v_sales_validation.status = 'rejected' THEN 'rejected'
        END;
      END IF;
    END IF;
  END IF;

  -- Update candidate status if needed
  IF v_new_status IS NOT NULL THEN
    UPDATE candidates c
    SET status = v_new_status
    WHERE c.id = p_candidate_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function
CREATE OR REPLACE FUNCTION trigger_update_candidate_status()
RETURNS trigger AS $$
BEGIN
  PERFORM update_candidate_status(NEW.candidate_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER on_validation_change
  AFTER INSERT OR UPDATE ON candidate_validations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_candidate_status();