/*
  # Add new fields to candidates table

  1. New Fields
    - Personal information:
      - first_name (text)
      - last_name (text)
      - linkedin_url (text)
    - Current situation:
      - current_company (text)
      - current_position (text)
      - years_experience (integer)
      - current_salary (integer)
      - notice_period (boolean)
      - notice_months (integer)
    - Contract:
      - contract_type (text)
      - daily_rate (integer)

  2. Changes
    - Add new columns if they don't exist
    - Add constraints if they don't exist
    - Update existing records to split name into first_name and last_name
*/

-- Add new fields
DO $$ 
BEGIN
  -- Add columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'first_name') THEN
    ALTER TABLE candidates ADD COLUMN first_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'last_name') THEN
    ALTER TABLE candidates ADD COLUMN last_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'linkedin_url') THEN
    ALTER TABLE candidates ADD COLUMN linkedin_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'current_company') THEN
    ALTER TABLE candidates ADD COLUMN current_company text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'current_position') THEN
    ALTER TABLE candidates ADD COLUMN current_position text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'years_experience') THEN
    ALTER TABLE candidates ADD COLUMN years_experience integer;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'current_salary') THEN
    ALTER TABLE candidates ADD COLUMN current_salary integer;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'notice_period') THEN
    ALTER TABLE candidates ADD COLUMN notice_period boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'notice_months') THEN
    ALTER TABLE candidates ADD COLUMN notice_months integer;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'contract_type') THEN
    ALTER TABLE candidates ADD COLUMN contract_type text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'daily_rate') THEN
    ALTER TABLE candidates ADD COLUMN daily_rate integer;
  END IF;

  -- Add constraints if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.constraint_column_usage WHERE constraint_name = 'candidates_years_experience_check') THEN
    ALTER TABLE candidates ADD CONSTRAINT candidates_years_experience_check 
      CHECK (years_experience IS NULL OR years_experience >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.constraint_column_usage WHERE constraint_name = 'candidates_current_salary_check') THEN
    ALTER TABLE candidates ADD CONSTRAINT candidates_current_salary_check 
      CHECK (current_salary IS NULL OR current_salary >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.constraint_column_usage WHERE constraint_name = 'candidates_notice_months_check') THEN
    ALTER TABLE candidates ADD CONSTRAINT candidates_notice_months_check 
      CHECK (notice_months IS NULL OR notice_months >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.constraint_column_usage WHERE constraint_name = 'candidates_daily_rate_check') THEN
    ALTER TABLE candidates ADD CONSTRAINT candidates_daily_rate_check 
      CHECK (daily_rate IS NULL OR daily_rate >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.constraint_column_usage WHERE constraint_name = 'candidates_contract_type_check') THEN
    ALTER TABLE candidates ADD CONSTRAINT candidates_contract_type_check 
      CHECK (contract_type IS NULL OR contract_type = ANY (ARRAY['CDI', 'CDD', 'Stage', 'Alternance', 'Freelance']));
  END IF;
END $$;

-- Update existing records to split name into first_name and last_name
UPDATE candidates
SET 
  first_name = split_part(name, ' ', 1),
  last_name = CASE 
    WHEN position(' ' in name) > 0 
    THEN substring(name from position(' ' in name) + 1)
    ELSE NULL 
  END
WHERE first_name IS NULL AND last_name IS NULL;