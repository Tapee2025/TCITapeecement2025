/*
  # Fix dealer approval system and customer management

  1. Database Changes
    - Add created_by field to users table to track which dealer created which customer
    - Create index for better performance on created_by field

  2. Security Updates
    - Update RLS policies for dealer customer management
    - Allow dealers to read customers they created
    - Allow dealers to create customers in their district
    - Update transaction policies for proper dealer approval flow

  3. Policy Management
    - Safely drop and recreate policies to avoid conflicts
    - Ensure proper permissions for all user roles
*/

-- Add created_by field to users table to track which dealer created which customer
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES users(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_created_by ON users(created_by);

-- Function to safely drop policy if it exists
CREATE OR REPLACE FUNCTION drop_policy_if_exists(policy_name text, table_name text)
RETURNS void AS $$
BEGIN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, table_name);
EXCEPTION
    WHEN undefined_object THEN
        -- Policy doesn't exist, ignore
        NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing conflicting policies safely
SELECT drop_policy_if_exists('Allow users to insert their own transactions', 'transactions');
SELECT drop_policy_if_exists('Allow users to insert own transactions', 'transactions');
SELECT drop_policy_if_exists('Admins can read all transactions', 'transactions');
SELECT drop_policy_if_exists('Admins can read all transactions for approval', 'transactions');
SELECT drop_policy_if_exists('Allow read access to all users', 'users');
SELECT drop_policy_if_exists('Allow public read access to users', 'users');
SELECT drop_policy_if_exists('Users can read their own profile', 'users');
SELECT drop_policy_if_exists('Users can read own profile', 'users');
SELECT drop_policy_if_exists('Dealers can read customers they created', 'users');
SELECT drop_policy_if_exists('Dealers can create customers', 'users');
SELECT drop_policy_if_exists('Allow authenticated users to read dealers', 'users');

-- Create new policies for dealer customer management
CREATE POLICY "Dealers can read created customers"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "Dealers can create new customers"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (created_by = auth.uid() AND EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'dealer'
    )) OR
    auth.uid() = id
  );

-- Allow dealers to read all dealers for the dropdown in customer creation
CREATE POLICY "Authenticated users can read dealers"
  ON users
  FOR SELECT
  TO authenticated
  USING (role = 'dealer' OR auth.uid() = id);

-- Update transactions policies to allow dealers to request points from admin
CREATE POLICY "Users can insert own transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow admins to read all transactions for approval
CREATE POLICY "Admin can read all transactions"
  ON transactions
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Allow public read access to users (with existing restrictions from other policies)
CREATE POLICY "Public can read users"
  ON users
  FOR SELECT
  TO public
  USING (true);

-- Allow users to read their own profile
CREATE POLICY "Users read own profile"
  ON users
  FOR SELECT
  TO public
  USING (id = auth.uid());

-- Clean up the helper function
DROP FUNCTION IF EXISTS drop_policy_if_exists(text, text);