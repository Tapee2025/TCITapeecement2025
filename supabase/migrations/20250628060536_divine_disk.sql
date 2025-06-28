/*
  # Remove builders and fix admin dashboard bag counting

  1. Database Changes
    - Update user role constraint to remove 'builder'
    - Update rewards visible_to arrays to remove 'builder'
    - Update existing users with role 'builder' to 'contractor'
  
  2. Admin Dashboard Fix
    - Only count bags sold by dealers (not contractors)
    - Bags sold = dealer transactions only
*/

-- Update user role constraint to remove 'builder'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role = ANY (ARRAY['dealer'::text, 'contractor'::text, 'admin'::text]));

-- Update existing builders to contractors
UPDATE users 
SET role = 'contractor', updated_at = now() 
WHERE role = 'builder';

-- Update rewards to remove 'builder' from visible_to arrays
UPDATE rewards 
SET visible_to = array_remove(visible_to, 'builder'), 
    updated_at = now()
WHERE 'builder' = ANY(visible_to);

-- Ensure all rewards have at least 'contractor' in visible_to if they had 'builder'
UPDATE rewards 
SET visible_to = array_append(visible_to, 'contractor'),
    updated_at = now()
WHERE visible_to = '{}' OR visible_to IS NULL;

-- Remove any empty visible_to arrays and set default to contractor
UPDATE rewards 
SET visible_to = ARRAY['contractor'::text],
    updated_at = now()
WHERE visible_to = '{}' OR visible_to IS NULL;