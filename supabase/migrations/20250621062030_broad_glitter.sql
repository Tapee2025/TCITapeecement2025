/*
  # Fix Rewards Policies for Admin Creation

  1. Changes
    - Drop existing conflicting policies on rewards table
    - Create new simplified policies for rewards management
    - Ensure admins can create, read, update, and delete rewards
    - Allow authenticated users to read available rewards

  2. Security
    - Admins have full access to rewards management
    - Regular users can only read available rewards
    - Proper role-based access control
*/

-- Drop existing policies on rewards table
DROP POLICY IF EXISTS "Anyone can view available rewards" ON rewards;
DROP POLICY IF EXISTS "Admins can manage rewards" ON rewards;

-- Create new policies for rewards table

-- Policy 1: Allow authenticated users to read available rewards
CREATE POLICY "Users can view available rewards"
  ON rewards
  FOR SELECT
  TO authenticated
  USING (available = true);

-- Policy 2: Allow admins to manage all rewards (create, read, update, delete)
CREATE POLICY "Admins can manage all rewards"
  ON rewards
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policy 3: Service role can manage all rewards (for system operations)
CREATE POLICY "Service role can manage rewards"
  ON rewards
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);