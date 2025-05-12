/*
  # Remove candidate deletion functionality

  1. Changes
    - Drop existing deletion-related policies
    - Drop storage cleanup trigger and function
    - Remove Manager's ability to delete candidates
*/

-- Drop existing policies
DO $$ BEGIN
  DROP POLICY IF EXISTS "Managers can delete candidates" ON candidates;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Drop storage cleanup trigger
DROP TRIGGER IF EXISTS trigger_cleanup_candidate_storage ON candidates;

-- Drop storage cleanup function
DROP FUNCTION IF EXISTS cleanup_candidate_storage();