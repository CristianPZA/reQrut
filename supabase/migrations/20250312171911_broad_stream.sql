/*
  # Add Logging System

  1. New Tables
    - `action_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `action_type` (text) - Type of action performed
      - `entity_type` (text) - Type of entity affected
      - `entity_id` (uuid) - ID of the affected entity
      - `details` (jsonb) - Additional details about the action
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - All authenticated users can create logs
    - Users can read their own logs
    - Managers can read all logs
*/

-- Create action_logs table
CREATE TABLE IF NOT EXISTS action_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id),
  action_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT action_logs_action_type_check CHECK (
    action_type IN (
      'create_candidate',
      'update_candidate',
      'validate_candidate',
      'reject_candidate',
      'override_candidate',
      'upload_document',
      'add_comment'
    )
  ),
  CONSTRAINT action_logs_entity_type_check CHECK (
    entity_type IN (
      'candidate',
      'document',
      'comment'
    )
  )
);

-- Enable RLS
ALTER TABLE action_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create logs"
  ON action_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own logs"
  ON action_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Managers can read all logs"
  ON action_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'Manager'
    )
  );