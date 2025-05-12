/*
  # User Profiles Schema Update

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key) - Links to auth.users
      - `full_name` (text) - User's full name
      - `role` (text) - User's role (RH, Sales, Tech, Manager)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on user_profiles table
    - Users can read and update their own profile
    - Managers can read all profiles

  3. Automation
    - Trigger to create user_profile on new user registration
    - Default role set to "RH"
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  full_name text,
  role text DEFAULT 'RH' CHECK (role IN ('RH', 'Sales', 'Tech', 'Manager')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Managers can read all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'Manager'
    )
  );

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    'RH'  -- Default role
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_profile();