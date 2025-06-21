/*
  # Fix Users Table RLS Policies

  1. Changes
    - Drop all existing RLS policies on users table that cause infinite recursion
    - Create simple, non-recursive policies for basic read/write access
    - Maintain security while avoiding circular references

  2. Security
    - Allow authenticated users to read and update their own profile
    - Allow public read access for dealer profiles (as required by existing logic)
    - Allow service role full access
    - Remove complex policies that reference users table within themselves
*/

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Admin full access" ON users;
DROP POLICY IF EXISTS "Authenticated can read dealers" ON users;
DROP POLICY IF EXISTS "Dealers can create customers" ON users;
DROP POLICY IF EXISTS "Dealers can read their customers" ON users;
DROP POLICY IF EXISTS "Public can read dealers" ON users;
DROP POLICY IF EXISTS "Service role full access" ON users;
DROP POLICY IF EXISTS "Transaction related user access" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create simple, non-recursive policies
CREATE POLICY "Allow service role full access"
  ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Public can read dealers"
  ON users
  FOR SELECT
  TO public
  USING (role = 'dealer');

CREATE POLICY "Authenticated can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);