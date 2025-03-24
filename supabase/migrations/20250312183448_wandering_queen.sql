/*
  # Add cascade delete constraints

  1. Changes
    - Add ON DELETE CASCADE to all foreign key constraints referencing candidates
    - This ensures that when a candidate is deleted, all related records are automatically deleted

  2. Tables Affected
    - candidate_documents
    - candidate_comments
    - candidate_validations
    - candidate_tasks
    - action_logs (for candidate-related logs)
*/

-- Update foreign key constraints for candidate_documents
ALTER TABLE candidate_documents
DROP CONSTRAINT IF EXISTS candidate_documents_candidate_id_fkey,
ADD CONSTRAINT candidate_documents_candidate_id_fkey
  FOREIGN KEY (candidate_id)
  REFERENCES candidates(id)
  ON DELETE CASCADE;

-- Update foreign key constraints for candidate_comments
ALTER TABLE candidate_comments
DROP CONSTRAINT IF EXISTS candidate_comments_candidate_id_fkey,
ADD CONSTRAINT candidate_comments_candidate_id_fkey
  FOREIGN KEY (candidate_id)
  REFERENCES candidates(id)
  ON DELETE CASCADE;

-- Update foreign key constraints for candidate_validations
ALTER TABLE candidate_validations
DROP CONSTRAINT IF EXISTS candidate_validations_candidate_id_fkey,
ADD CONSTRAINT candidate_validations_candidate_id_fkey
  FOREIGN KEY (candidate_id)
  REFERENCES candidates(id)
  ON DELETE CASCADE;

-- Update foreign key constraints for candidate_tasks
ALTER TABLE candidate_tasks
DROP CONSTRAINT IF EXISTS candidate_tasks_candidate_id_fkey,
ADD CONSTRAINT candidate_tasks_candidate_id_fkey
  FOREIGN KEY (candidate_id)
  REFERENCES candidates(id)
  ON DELETE CASCADE;

-- For action_logs, we'll create a trigger to handle candidate-related deletions
CREATE OR REPLACE FUNCTION delete_candidate_logs()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM action_logs 
  WHERE entity_type = 'candidate' 
  AND entity_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_delete_candidate_logs ON candidates;
CREATE TRIGGER trigger_delete_candidate_logs
  BEFORE DELETE ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION delete_candidate_logs();