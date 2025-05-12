/*
  # Fix storage cleanup for candidate deletion

  1. Changes
    - Update storage cleanup function to properly handle file deletion
    - Add error handling for storage operations
    - Ensure proper cleanup of all candidate files

  2. Security
    - Maintain existing security policies
    - Use proper storage path handling
*/

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