/*
  # Create trigger for candidate status updates

  1. Purpose
    - Create a trigger that calls update_candidate_status function
    - Trigger runs after INSERT or UPDATE on candidate_validations
    - Ensures candidate status is always up to date with latest validations

  2. Changes
    - Create trigger function that calls update_candidate_status
    - Create trigger that runs after INSERT or UPDATE
*/

-- Create trigger function
CREATE OR REPLACE FUNCTION trigger_update_candidate_status()
RETURNS trigger AS $$
BEGIN
  -- Call the update_candidate_status function with the candidate_id
  PERFORM update_candidate_status(NEW.candidate_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_validation_change ON candidate_validations;

-- Create trigger
CREATE TRIGGER on_validation_change
  AFTER INSERT OR UPDATE ON candidate_validations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_candidate_status();