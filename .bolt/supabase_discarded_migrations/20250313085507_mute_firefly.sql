/*
  # Add Validation Status Update Trigger

  1. Changes
    - Create trigger function to call update_candidate_status
    - Create trigger that fires after INSERT or UPDATE on candidate_validations
    - Use proper table aliases to avoid ambiguous column references

  2. Security
    - Maintain data integrity during validation updates
    - Ensure proper status transitions
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