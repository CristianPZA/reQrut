/*
  # Add Reminders System

  1. New Tables
    - reminders: Stores reminder information
      - id (uuid, primary key)
      - title (text)
      - message (text)
      - target_role (text)
      - priority (text)
      - due_date (timestamptz)
      - completed (boolean)
      - created_by (uuid)
      - created_at (timestamptz)
      - updated_at (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for role-based access
    - Ensure proper data access restrictions
*/

-- Create reminders table
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS reminders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    message text NOT NULL,
    target_role text NOT NULL,
    priority text NOT NULL DEFAULT 'medium',
    due_date timestamptz NOT NULL,
    completed boolean NOT NULL DEFAULT false,
    created_by uuid REFERENCES user_profiles(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT reminders_priority_check CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    CONSTRAINT reminders_target_role_check CHECK (target_role IN ('RH', 'Sales', 'Tech', 'Manager', 'all'))
  );
EXCEPTION
  WHEN duplicate_table THEN
    NULL;
END $$;

-- Enable RLS
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view reminders for their role" ON reminders;
  DROP POLICY IF EXISTS "RH and Manager can create reminders" ON reminders;
  DROP POLICY IF EXISTS "Users can update their own reminders" ON reminders;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Create policies
CREATE POLICY "Users can view reminders for their role"
  ON reminders
  FOR SELECT
  TO authenticated
  USING (
    target_role = (
      SELECT role FROM user_profiles WHERE id = auth.uid()
    )
    OR target_role = 'all'
  );

CREATE POLICY "RH and Manager can create reminders"
  ON reminders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('RH', 'Manager')
    )
  );

CREATE POLICY "Users can update their own reminders"
  ON reminders
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());