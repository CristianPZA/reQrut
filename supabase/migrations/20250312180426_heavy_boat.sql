/*
  # Update candidate schema with additional fields

  1. Changes
    - Add new personal information fields
    - Add current situation fields
    - Add recruitment process fields
    - Add reference fields for HR and Sales
    - Add contract type field with validation

  2. New Columns
    - Personal: first_name, last_name, linkedin_url
    - Current situation: current_company, current_position, years_experience, current_salary, notice_period, notice_months
    - Recruitment: contract_type, daily_rate
    - Process: hr_reference, sales_reference, is_technical_position
*/

-- Add new personal information fields
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS linkedin_url text;

-- Add current situation fields
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS current_company text,
ADD COLUMN IF NOT EXISTS current_position text,
ADD COLUMN IF NOT EXISTS years_experience integer,
ADD COLUMN IF NOT EXISTS current_salary integer,
ADD COLUMN IF NOT EXISTS notice_period boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS notice_months integer;

-- Add recruitment process fields
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS contract_type text,
ADD COLUMN IF NOT EXISTS daily_rate integer,
ADD COLUMN IF NOT EXISTS is_technical_position boolean DEFAULT false;

-- Add reference fields
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS hr_reference uuid REFERENCES user_profiles(id),
ADD COLUMN IF NOT EXISTS sales_reference uuid REFERENCES user_profiles(id);

-- Add constraints
ALTER TABLE candidates
ADD CONSTRAINT candidates_years_experience_check CHECK (years_experience >= 0),
ADD CONSTRAINT candidates_current_salary_check CHECK (current_salary >= 0),
ADD CONSTRAINT candidates_notice_months_check CHECK (notice_months >= 0),
ADD CONSTRAINT candidates_daily_rate_check CHECK (daily_rate >= 0),
ADD CONSTRAINT candidates_contract_type_check CHECK (
  contract_type = ANY (ARRAY['CDI', 'CDD', 'Stage', 'Alternance', 'Freelance'])
);