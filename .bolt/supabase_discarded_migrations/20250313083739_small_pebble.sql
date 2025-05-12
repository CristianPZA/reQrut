/*
  # Fix candidate deletion and storage cleanup

  1. Changes
    - Create storage cleanup function
    - Add trigger for automatic storage cleanup
    - Drop existing policy if it exists before creating new one

  2. Security
    - Only Manager role can delete candidates
    - Automatic cleanup of all related data
*/

-- Drop existing policy if it exists
DO $$ BEGIN
  DROP POLICY IF EXISTS "Managers can delete candidates" ON candidates;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Create function to clean up storage files
CREATE OR REPLACE FUNCTION cleanup_candidate_storage()
RETURNS trigger AS $$
BEGIN
  -- Delete all files in the candidate's folder
  DELETE FROM storage.objects 
  WHERE bucket_id = 'documents' 
  AND path LIKE OLD.id || '/%';
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for storage cleanup
DROP TRIGGER IF EXISTS trigger_cleanup_candidate_storage ON candidates;
CREATE TRIGGER trigger_cleanup_candidate_storage
  BEFORE DELETE ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_candidate_storage();

-- Add RLS policy for Manager role
CREATE POLICY "Managers can delete candidates"
  ON candidates
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'Manager'
    )
  );