/*
  # Update RLS policies for candidate deletion

  1. Changes
    - Add RLS policy to allow managers to delete candidates
    - Add cascade delete trigger function
    - Add trigger to clean up storage files on candidate deletion

  2. Security
    - Only managers can delete candidates
    - All related records are deleted automatically via foreign key cascade
    - Storage files are cleaned up via trigger
*/

-- Add RLS policy for managers to delete candidates
DO $$ BEGIN
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
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- Create function to clean up storage files
CREATE OR REPLACE FUNCTION cleanup_candidate_storage()
RETURNS trigger AS $$
DECLARE
  storage_object RECORD;
BEGIN
  -- Get all storage objects for this candidate
  FOR storage_object IN (
    SELECT url 
    FROM storage.objects 
    WHERE bucket_id = 'documents' 
    AND path LIKE OLD.id || '/%'
  )
  LOOP
    -- Delete each storage object
    DELETE FROM storage.objects 
    WHERE bucket_id = 'documents' 
    AND path = storage_object.url;
  END LOOP;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to clean up storage files before candidate deletion
DROP TRIGGER IF EXISTS trigger_cleanup_candidate_storage ON candidates;
CREATE TRIGGER trigger_cleanup_candidate_storage
  BEFORE DELETE ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_candidate_storage();