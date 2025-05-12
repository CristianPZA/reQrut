/*
  # HR Management System Schema

  1. New Tables
    - `objectives`
      - Annual objectives and projects tracking
      - Linked to users with role-based access
    - `evaluations`
      - Performance evaluations
      - Multi-step validation workflow
    - `workflow_steps`
      - Tracks validation steps for objectives and evaluations
    - `activity_logs`
      - Complete audit trail of all actions

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access
    - Ensure data isolation between departments
*/

-- Create enum for workflow status
CREATE TYPE workflow_status AS ENUM ('draft', 'pending', 'approved', 'rejected', 'completed');

-- Create objectives table
CREATE TABLE IF NOT EXISTS objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  year int NOT NULL,
  status workflow_status DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create evaluations table
CREATE TABLE IF NOT EXISTS evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id uuid REFERENCES objectives(id) ON DELETE CASCADE,
  evaluator_id uuid REFERENCES auth.users(id),
  rating int CHECK (rating >= 1 AND rating <= 5),
  comments text,
  status workflow_status DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create workflow steps table
CREATE TABLE IF NOT EXISTS workflow_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('objective', 'evaluation')),
  entity_id uuid NOT NULL,
  approver_role user_role NOT NULL,
  status workflow_status DEFAULT 'pending',
  comments text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Objectives policies
CREATE POLICY "Users can read their own objectives"
  ON objectives
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own objectives"
  ON objectives
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own draft objectives"
  ON objectives
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'draft')
  WITH CHECK (user_id = auth.uid() AND status = 'draft');

-- Evaluations policies
CREATE POLICY "Users can read evaluations of their objectives"
  ON evaluations
  FOR SELECT
  TO authenticated
  USING (
    objective_id IN (
      SELECT id FROM objectives WHERE user_id = auth.uid()
    )
    OR evaluator_id = auth.uid()
  );

CREATE POLICY "Evaluators can create evaluations"
  ON evaluations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('referent_projet', 'coach_rh', 'direction')
    )
  );

-- Workflow steps policies
CREATE POLICY "Users can view workflow steps for their items"
  ON workflow_steps
  FOR SELECT
  TO authenticated
  USING (
    entity_id IN (
      SELECT id FROM objectives WHERE user_id = auth.uid()
      UNION
      SELECT id FROM evaluations WHERE objective_id IN (
        SELECT id FROM objectives WHERE user_id = auth.uid()
      )
    )
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = approver_role
    )
  );

-- Activity logs policies
CREATE POLICY "Users can view logs related to their items"
  ON activity_logs
  FOR SELECT
  TO authenticated
  USING (
    entity_id IN (
      SELECT id FROM objectives WHERE user_id = auth.uid()
      UNION
      SELECT id FROM evaluations WHERE objective_id IN (
        SELECT id FROM objectives WHERE user_id = auth.uid()
      )
    )
    OR user_id = auth.uid()
  );

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_objectives_updated_at
  BEFORE UPDATE ON objectives
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_evaluations_updated_at
  BEFORE UPDATE ON evaluations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_workflow_steps_updated_at
  BEFORE UPDATE ON workflow_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();