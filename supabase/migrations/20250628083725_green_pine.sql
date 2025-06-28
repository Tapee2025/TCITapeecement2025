/*
  # Fix notifications RLS policy for transaction triggers

  1. Security Changes
    - Update RLS policies to allow service role to insert notifications for any user
    - Ensure triggers can create notifications without RLS violations
    - Maintain security for authenticated users to only manage their own notifications

  2. Changes
    - Add policy for service role to insert notifications for any user
    - Keep existing policies for authenticated users
*/

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Service role has full access to notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;

-- Recreate policies with proper permissions
CREATE POLICY "Service role has full access to notifications"
  ON notifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to insert notifications only for themselves
CREATE POLICY "Users can insert notifications for themselves"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);