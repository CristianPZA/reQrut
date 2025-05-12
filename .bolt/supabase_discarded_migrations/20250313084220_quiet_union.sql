/*
  # Update candidate status based on validations

  1. Changes
    - Update candidates status check constraint to include new statuses
    - Create function to update candidate status on validation changes
    - Create trigger to automatically update status when validations change

  2. Status Values
    - pending: Initial status
    - pending_tech: Waiting for technical validation
    - pending_sales: Waiting for sales validation
    - validated: Fully approved
    - rejected: Rejected by any validator
*/

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
CREATE OR REPLACE FUNCTION update_candidate_status()
RETURNS trigger AS $$
DECLARE
  latest_tech_validation RECORD;
  latest_sales_validation RECORD;
  is_technical boolean;
  new_status text;
BEGIN
  -- Get candidate technical status
  SELECT is_technical_position INTO is_technical
  FROM candidates
  WHERE id = NEW.candidate_id;

  -- Get latest validations
  SELECT * INTO latest_tech_validation
  FROM candidate_validations
  WHERE candidate_id = NEW.candidate_id
    AND type = 'tech'
  ORDER BY created_at DESC
  LIMIT 1;

  SELECT * INTO latest_sales_validation
  FROM candidate_validations
  WHERE candidate_id = NEW.candidate_id
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
      ELSE
        new_status := 'validated'; -- Tech approval takes precedence
      END IF;
    ELSIF latest_tech_validation IS NULL THEN
      new_status := 'pending_tech';
    ELSE
      new_status := 'pending';
    END IF;
  ELSE
    -- Non-technical position logic
    IF latest_sales_validation.status = 'rejected' THEN
      new_status := 'rejected';
    ELSIF latest_sales_validation.status = 'approved' THEN
      new_status := 'validated';
    ELSE
      new_status := 'pending_sales';
    END IF;
  END IF;

  -- Update candidate status
  UPDATE candidates
  SET status = new_status
  WHERE id = NEW.candidate_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for status updates
DROP TRIGGER IF EXISTS trigger_update_candidate_status ON candidate_validations;
CREATE TRIGGER trigger_update_candidate_status
  AFTER INSERT OR UPDATE ON candidate_validations
  FOR EACH ROW
  EXECUTE FUNCTION update_candidate_status();