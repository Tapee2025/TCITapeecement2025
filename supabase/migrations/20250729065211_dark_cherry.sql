/*
  # Update users role constraint to include sub_dealer

  1. Changes
    - Drop existing users_role_check constraint
    - Add new constraint that includes 'sub_dealer' role
    - Ensure all existing roles (dealer, contractor, admin) are preserved

  2. Security
    - Maintains existing RLS policies
    - No changes to user permissions
*/

-- Drop the existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add the updated constraint with sub_dealer included
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role = ANY (ARRAY['dealer'::text, 'contractor'::text, 'admin'::text, 'sub_dealer'::text]));