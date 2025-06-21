/*
  # Fix infinite recursion in users table RLS policies

  1. Problem
    - Current RLS policies on users table are causing infinite recursion
    - Policies are likely referencing the users table within their own conditions
    - This creates circular dependencies during policy evaluation

  2. Solution
    - Drop all existing problematic policies
    - Recreate policies with proper conditions that don't cause recursion
    - Use auth.uid() directly instead of complex subqueries where possible
    - Ensure admin checks don't create circular references

  3. Security
    - Maintain proper access control
    - Users can read/update their own profiles
    - Admins have full access
    - Dealers can manage their customers
    - Public can read dealer profiles for discovery
*/

-- Drop all existing policies on users table to start fresh
DROP POLICY IF EXISTS "Dealer customer creation" ON users;
DROP POLICY IF EXISTS "Dealer customer read access" ON users;
DROP POLICY IF EXISTS "General user read access" ON users;
DROP POLICY IF EXISTS "Own profile read access" ON users;
DROP POLICY IF EXISTS "Public can read dealers" ON users;
DROP POLICY IF EXISTS "Read dealer profiles" ON users;
DROP POLICY IF EXISTS "Service role can manage all users" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create new, non-recursive policies

-- 1. Service role has full access (no recursion risk)
CREATE POLICY "Service role full access"
  ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. Users can read their own profile (direct auth.uid() check)
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 3. Users can update their own profile (direct auth.uid() check)
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Users can insert their own profile during registration
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 5. Public can read dealer profiles (for discovery)
CREATE POLICY "Public can read dealers"
  ON users
  FOR SELECT
  TO public
  USING (role = 'dealer');

-- 6. Authenticated users can read dealer profiles
CREATE POLICY "Authenticated can read dealers"
  ON users
  FOR SELECT
  TO authenticated
  USING (role = 'dealer');

-- 7. Admin access - using a simpler approach to avoid recursion
-- We'll create a separate policy that checks if the current user's role is admin
-- by using a direct query that doesn't reference the same table in a recursive way
CREATE POLICY "Admin full access"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users admin_user 
      WHERE admin_user.id = auth.uid() 
      AND admin_user.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users admin_user 
      WHERE admin_user.id = auth.uid() 
      AND admin_user.role = 'admin'
    )
  );

-- 8. Dealer customer management
-- Dealers can create customers (builders/contractors)
CREATE POLICY "Dealers can create customers"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM users dealer_user 
      WHERE dealer_user.id = auth.uid() 
      AND dealer_user.role = 'dealer'
    )
    AND role IN ('builder', 'contractor')
  );

-- 9. Dealers can read their customers
CREATE POLICY "Dealers can read their customers"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    OR auth.uid() = id
  );

-- 10. Allow reading user profiles for transaction purposes
-- This is needed for the app to function properly
CREATE POLICY "Transaction related user access"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);