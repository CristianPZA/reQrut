/*
  # Fix candidate validation function

  1. Changes
    - Update update_candidate_status function to use proper table aliases
    - Fix ambiguous column references
    - Ensure proper status updates based on validation rules
*/

-- Drop existing function
DROP FUNCTION IF EXISTS update_candidate_status(UUID);

-- Create updated function with proper table aliases
CREATE OR REPLACE FUNCTION update_candidate_status(p_candidate_id UUID)
RETURNS void AS $$
DECLARE
  latest_tech_validation RECORD;
  latest_sales_validation RECORD;
  is_technical boolean;
  new_status text;
BEGIN
  -- Get candidate technical status
  SELECT c.is_technical_position INTO is_technical
  FROM candidates c
  WHERE c.id = p_candidate_id;

  -- Get latest validations with proper table aliases
  SELECT cv.* INTO latest_tech_validation
  FROM candidate_validations cv
  WHERE cv.candidate_id = p_candidate_id
    AND cv.type = 'tech'
  ORDER BY cv.created_at DESC
  LIMIT 1;

  SELECT cv.* INTO latest_sales_validation
  FROM candidate_validations cv
  WHERE cv.candidate_id = p_candidate_id
    AND cv.type = 'sales'
  ORDER BY cv.created_at DESC
  LIMIT 1;

  -- Determine new status based on validation rules
  IF is_technical THEN
    -- Technical position logic
    IF latest_tech_validation.status = 'rejected' THEN
      new_status := 'rejected';
    ELSIF latest_tech_validation.status = 'approved' THEN
      IF latest_sales_validation.status = 'approved' THEN
        new_status := 'validated';
      ELSIF latest_sales_validation IS NULL THEN
        new_status := 'pending_sales';
      ELSIF latest_sales_validation.status = 'rejected' THEN
        new_status := 'validated'; -- Tech approval takes precedence
      END IF;
    ELSIF latest_tech_validation IS NULL THEN
      IF latest_sales_validation IS NOT NULL THEN
        new_status := 'pending_tech';
      ELSE
        new_status := 'pending';
      END IF;
    END IF;
  ELSE
    -- Non-technical position logic
    IF latest_sales_validation.status = 'approved' THEN
      new_status := 'validated';
    ELSIF latest_sales_validation.status = 'rejected' THEN
      new_status := 'rejected';
    ELSE
      new_status := 'pending_sales';
    END IF;
  END IF;

  -- Update candidate status with proper table alias
  UPDATE candidates c
  SET status = new_status
  WHERE c.id = p_candidate_id;
END;
$$ LANGUAGE plpgsql;