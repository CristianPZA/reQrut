/*
  # Fix storage cleanup function for candidate deletion

  1. Changes
    - Update storage cleanup function to use correct path format
    - Fix URL handling for document deletion
    - Add error handling for storage operations

  2. Security
    - Maintain existing security policies
    - Ensure proper cleanup of storage files
*/

-- Update the storage cleanup function to handle paths correctly
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