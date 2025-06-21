/*
  # Fix User Registration RLS Policies

  1. Security Updates
    - Add policy to allow users to insert their own profile during registration
    - Ensure proper RLS policies for user registration flow

  2. Changes
    - Add INSERT policy for authenticated users to create their own profile
    - Update existing policies to ensure they work correctly with registration
*/

-- Drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create a policy that allows users to insert their own profile during registration
CREATE POLICY "Users can insert own profile during registration"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Ensure the existing update policy is correct
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ensure the existing select policy is correct
DROP POLICY IF EXISTS "Users can read own profile" ON users;
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);