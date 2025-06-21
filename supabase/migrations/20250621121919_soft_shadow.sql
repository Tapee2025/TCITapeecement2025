/*
  # Fix RLS Policy Infinite Recursion

  1. Problem
    - Multiple RLS policies on users table contain subqueries that reference the users table itself
    - This creates infinite recursion when Supabase tries to evaluate the policies
    - Affects login and profile fetching functionality

  2. Solution
    - Drop problematic policies that cause recursion
    - Create simplified policies that don't reference the users table in subqueries
    - Use direct comparisons with auth.uid() instead of EXISTS subqueries on users table

  3. Changes
    - Remove recursive policies on users table
    - Simplify admin access patterns
    - Create clean, non-recursive policies for user access
*/

-- Drop all existing policies on users table to start fresh
DROP POLICY IF EXISTS "Allow all inserts" ON users;
DROP POLICY IF EXISTS "Allow insert if id = auth.uid()" ON users;
DROP POLICY IF EXISTS "Allow inserts for authenticated" ON users;
DROP POLICY IF EXISTS "Allow service role full access" ON users;
DROP POLICY IF EXISTS "Authenticated can read all users" ON users;
DROP POLICY IF EXISTS "Authenticated users can read dealers" ON users;
DROP POLICY IF EXISTS "Dealers can create new customers" ON users;
DROP POLICY IF EXISTS "Dealers can read created customers" ON users;
DROP POLICY IF EXISTS "Public can read dealers" ON users;
DROP POLICY IF EXISTS "Public can read users" ON users;
DROP POLICY IF EXISTS "Users can insert own profile during registration" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users read own profile" ON users;

-- Create simplified, non-recursive policies for users table
CREATE POLICY "Service role full access" ON users
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can read own profile" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Public can read dealers" ON users
  FOR SELECT TO public
  USING (role = 'dealer');

CREATE POLICY "Authenticated can read all users" ON users
  FOR SELECT TO authenticated
  USING (true);

-- Fix other tables that have recursive policies referencing users table

-- Fix marketing_slides policies
DROP POLICY IF EXISTS "Admins can manage marketing slides" ON marketing_slides;
DROP POLICY IF EXISTS "Anyone can view active marketing slides" ON marketing_slides;

CREATE POLICY "Service role can manage marketing slides" ON marketing_slides
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can view active marketing slides" ON marketing_slides
  FOR SELECT TO authenticated
  USING (active = true);

-- Fix rewards policies  
DROP POLICY IF EXISTS "Allow admin full access to rewards" ON rewards;
DROP POLICY IF EXISTS "Allow reading available rewards" ON rewards;
DROP POLICY IF EXISTS "Allow service role full access to rewards" ON rewards;

CREATE POLICY "Service role full access to rewards" ON rewards
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can read available rewards" ON rewards
  FOR SELECT TO authenticated
  USING (available = true);

-- Fix dealer_approvals policies
DROP POLICY IF EXISTS "Admins can manage all approvals" ON dealer_approvals;
DROP POLICY IF EXISTS "Dealers can view and manage their approvals" ON dealer_approvals;
DROP POLICY IF EXISTS "Users can view their own approvals" ON dealer_approvals;

CREATE POLICY "Service role can manage all approvals" ON dealer_approvals
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Dealers can manage their approvals" ON dealer_approvals
  FOR ALL TO authenticated
  USING (dealer_id = auth.uid())
  WITH CHECK (dealer_id = auth.uid());

CREATE POLICY "Users can view their approvals" ON dealer_approvals
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Fix transactions policies
DROP POLICY IF EXISTS "Admin can read all transactions" ON transactions;
DROP POLICY IF EXISTS "Admin transaction read access" ON transactions;
DROP POLICY IF EXISTS "Dealers can view and manage transactions they're involved with" ON transactions;
DROP POLICY IF EXISTS "Transaction creation by user" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can read their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;

CREATE POLICY "Service role full access to transactions" ON transactions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can manage their own transactions" ON transactions
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Dealers can view transactions they're involved with" ON transactions
  FOR SELECT TO authenticated
  USING (dealer_id = auth.uid());

-- Fix monthly_performance policies
DROP POLICY IF EXISTS "Admins can view all performance data" ON monthly_performance;
DROP POLICY IF EXISTS "Dealers can view their own performance data" ON monthly_performance;

CREATE POLICY "Service role can manage performance data" ON monthly_performance
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Dealers can view their performance data" ON monthly_performance
  FOR SELECT TO authenticated
  USING (dealer_id = auth.uid());