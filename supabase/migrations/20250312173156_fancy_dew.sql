/*
  # Configure Storage for Candidate Documents

  1. Storage Configuration
    - Create "documents" bucket for candidate files
    - Set up RLS policies for secure access
    - Only authenticated users can upload/download
    - No public access allowed

  2. Security
    - Enable RLS on storage bucket
    - Add policies for:
      - Upload: Only RH and Manager roles
      - Download: All authenticated users
*/

-- Insert bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create upload policy for RH and Manager roles
CREATE POLICY upload_documents ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role IN ('RH', 'Manager')
      )
    )
  );

-- Create download policy for authenticated users
CREATE POLICY download_documents ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents'
  );