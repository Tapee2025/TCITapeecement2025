/*
  # Add insert policy for users table
  
  1. Changes
    - Add policy to allow inserting users for authenticated users
    - Ensure the inserted user ID matches the authenticated user ID
*/

-- Allow insert if the user is authenticated and the ID matches auth.uid()
CREATE POLICY "Allow insert for authenticated users"
ON users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);