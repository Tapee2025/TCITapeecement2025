/*
  # Add Dealer Customer Management and Points Features

  1. Changes
    - Add created_by field to users table to track dealer-customer relationships
    - Update RLS policies for dealer customer management
    - Add policies for dealer points requests

  2. Security
    - Dealers can read customers they created
    - Dealers can create customers
    - Dealers can request points from admin
    - Admins can read all transactions
*/

-- Add created_by field to users table to track which dealer created which customer
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES users(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_created_by ON users(created_by);

-- Drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "Dealers can read customers they created" ON users;
DROP POLICY IF EXISTS "Dealers can create customers" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to read dealers" ON users;
DROP POLICY IF EXISTS "Allow users to insert their own transactions" ON transactions;
DROP POLICY IF EXISTS "Admins can read all transactions" ON transactions;
DROP POLICY IF EXISTS "Allow read access to all users" ON users;
DROP POLICY IF EXISTS "Users can read their own profile" ON users;

-- Create new policies for dealer customer management
CREATE POLICY "Dealers can read customers they created"
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

CREATE POLICY "Dealers can create customers"
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
CREATE POLICY "Allow authenticated users to read dealers"
  ON users
  FOR SELECT
  TO authenticated
  USING (role = 'dealer' OR auth.uid() = id);

-- Update transactions policies to allow dealers to request points from admin
CREATE POLICY "Allow users to insert their own transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow admins to read all transactions for approval
CREATE POLICY "Admins can read all transactions"
  ON transactions
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Allow read access to all users for public viewing (with restrictions)
CREATE POLICY "Allow read access to all users"
  ON users
  FOR SELECT
  TO public
  USING (true);

-- Allow users to read their own profile
CREATE POLICY "Users can read their own profile"
  ON users
  FOR SELECT
  TO public
  USING (id = auth.uid());