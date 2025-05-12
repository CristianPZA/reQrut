/*
  # Create update_candidate_status function

  1. Function Purpose
    - Updates a candidate's status based on their validations
    - Takes candidate_id as parameter
    - Handles both technical and non-technical positions
    - Applies business rules for status determination

  2. Status Rules
    - Technical positions require both tech and sales validation
    - Non-technical positions only require sales validation
    - Tech validation takes precedence over sales for technical positions
*/

-- Create function to update candidate status
CREATE OR REPLACE FUNCTION update_candidate_status(candidate_id UUID)
RETURNS void AS $$
DECLARE
  latest_tech_validation RECORD;
  latest_sales_validation RECORD;
  is_technical boolean;
  new_status text;
BEGIN
  -- Get candidate technical status
  SELECT is_technical_position INTO is_technical
  FROM candidates
  WHERE id = candidate_id;

  -- Get latest validations
  SELECT * INTO latest_tech_validation
  FROM candidate_validations
  WHERE candidate_id = candidate_id
    AND type = 'tech'
  ORDER BY created_at DESC
  LIMIT 1;

  SELECT * INTO latest_sales_validation
  FROM candidate_validations
  WHERE candidate_id = candidate_id
    AND type = 'sales'
  ORDER BY created_at DESC
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

  -- Update candidate status
  UPDATE candidates
  SET status = new_status
  WHERE id = candidate_id;
END;
$$ LANGUAGE plpgsql;