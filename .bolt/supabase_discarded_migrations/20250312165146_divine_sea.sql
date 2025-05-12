/*
  # Fix User Profiles RLS Policies

  1. Changes
    - Drop existing policies that may be causing recursion
    - Create new, simplified RLS policies for user_profiles table
  
  2. Security
    - Enable RLS on user_profiles table
    - Add policies for:
      - Users can read their own profile
      - Users can update their own profile
      - Managers can read all profiles
*/

-- First, enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Managers can read all profiles" ON user_profiles;

-- Create new policies
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
  (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'Manager'
);