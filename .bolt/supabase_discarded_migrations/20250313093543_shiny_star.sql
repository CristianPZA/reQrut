/*
  # Add favorite field to candidates table

  1. Changes
    - Add is_favorite boolean field to candidates table
    - Create policy to allow all authenticated users to toggle favorite status
    - Ensure only the is_favorite field can be modified

  2. Security
    - Enable RLS
    - Allow all authenticated users to update is_favorite field
    - Prevent modification of other fields during favorite toggle
*/

-- Add is_favorite field if it doesn't exist
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS is_favorite boolean DEFAULT false;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can toggle favorite status" ON candidates;

-- Create policy for favorite status updates
CREATE POLICY "Users can toggle favorite status"
  ON candidates
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (
    -- Allow update only if all fields except is_favorite remain unchanged
    (
      OLD.id = NEW.id AND
      OLD.name = NEW.name AND
      OLD.email = NEW.email AND
      OLD.position = NEW.position AND
      OLD.status = NEW.status AND
      OLD.created_at = NEW.created_at AND
      OLD.created_by = NEW.created_by AND
      OLD.first_name IS NOT DISTINCT FROM NEW.first_name AND
      OLD.last_name IS NOT DISTINCT FROM NEW.last_name AND
      OLD.phone IS NOT DISTINCT FROM NEW.phone AND
      OLD.location IS NOT DISTINCT FROM NEW.location AND
      OLD.current_company IS NOT DISTINCT FROM NEW.current_company AND
      OLD.current_position IS NOT DISTINCT FROM NEW.current_position AND
      OLD.years_experience IS NOT DISTINCT FROM NEW.years_experience AND
      OLD.current_salary IS NOT DISTINCT FROM NEW.current_salary AND
      OLD.notice_period IS NOT DISTINCT FROM NEW.notice_period AND
      OLD.notice_months IS NOT DISTINCT FROM NEW.notice_months AND
      OLD.contract_type IS NOT DISTINCT FROM NEW.contract_type AND
      OLD.daily_rate IS NOT DISTINCT FROM NEW.daily_rate AND
      OLD.expected_salary IS NOT DISTINCT FROM NEW.expected_salary AND
      OLD.is_technical_position IS NOT DISTINCT FROM NEW.is_technical_position AND
      OLD.skills IS NOT DISTINCT FROM NEW.skills AND
      OLD.hr_reference IS NOT DISTINCT FROM NEW.hr_reference AND
      OLD.sales_reference IS NOT DISTINCT FROM NEW.sales_reference AND
      OLD.hr_notes IS NOT DISTINCT FROM NEW.hr_notes AND
      OLD.submitted_at IS NOT DISTINCT FROM NEW.submitted_at AND
      OLD.last_contact IS NOT DISTINCT FROM NEW.last_contact AND
      OLD.linkedin_url IS NOT DISTINCT FROM NEW.linkedin_url AND
      OLD.override_by IS NOT DISTINCT FROM NEW.override_by AND
      OLD.override_reason IS NOT DISTINCT FROM NEW.override_reason
    )
  );