/*
  # Add Favorites Column to Candidates

  1. Changes
    - Add is_favorite column to candidates table
    - Default value is false
    - Add index for better query performance
*/

-- Add is_favorite column
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS is_favorite boolean DEFAULT false;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_candidates_is_favorite
ON candidates(is_favorite);