/*
  # Add Candidate Submission Fields

  1. Changes
    - Add submitted_at timestamp to candidates table
    - Add draft status to status check constraint
    - Update existing candidates to have draft status if not submitted
*/

-- Add submitted_at column
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS submitted_at timestamptz;

-- Update status check constraint to include draft status
ALTER TABLE candidates
DROP CONSTRAINT IF EXISTS candidates_status_check;

ALTER TABLE candidates
ADD CONSTRAINT candidates_status_check 
CHECK (status IN ('draft', 'pending', 'approved_sales', 'approved_tech', 'rejected', 'hired'));

-- Update existing candidates to have draft status if not submitted
UPDATE candidates
SET status = 'draft'
WHERE status = 'pending' AND submitted_at IS NULL;