/*
  # CRM Database Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key) - Links to auth.users
      - `full_name` (text) - User's full name
      - `role` (text) - User's role (admin or user)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `customers`
      - `id` (uuid, primary key)
      - `company_name` (text)
      - `contact_name` (text)
      - `email` (text)
      - `phone` (text)
      - `status` (text)
      - `created_by` (uuid) - References profiles.id
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Profiles:
      - Users can read their own profile
      - Admins can read all profiles
      - Users can update their own profile
      - Admins can update any profile
    - Customers:
      - Users can read all customers
      - Users can create customers
      - Users can update customers they created
      - Admins have full access
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  full_name text,
  role text DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_name text,
  email text,
  phone text,
  status text DEFAULT 'lead' CHECK (status IN ('lead', 'prospect', 'customer', 'inactive')),
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Customers policies
CREATE POLICY "Users can read all customers"
  ON customers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create customers"
  ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their customers"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins have full access to customers"
  ON customers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create function to handle profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();