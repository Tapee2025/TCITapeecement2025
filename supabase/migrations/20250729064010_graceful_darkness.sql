/*
  # Add Sub Dealer Role Support

  1. Changes
    - Update users table role constraint to include 'sub_dealer'
    - Add created_by field to track which dealer created which customer
    - Update rewards table to support sub_dealer visibility
    - Update existing policies to handle sub_dealer role

  2. Security
    - Maintain existing RLS policies
    - Ensure sub_dealers have appropriate access levels
*/

-- Update users table role constraint to include sub_dealer
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role = ANY (ARRAY['dealer'::text, 'contractor'::text, 'admin'::text, 'sub_dealer'::text]));

-- Add created_by field to users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE users ADD COLUMN created_by uuid REFERENCES users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_users_created_by ON users(created_by);
  END IF;
END $$;

-- Update rewards visible_to to support sub_dealer
ALTER TABLE rewards ALTER COLUMN visible_to SET DEFAULT ARRAY['contractor'::text, 'sub_dealer'::text];

-- Update existing rewards to include sub_dealer in visible_to if they include contractor
UPDATE rewards 
SET visible_to = array_append(visible_to, 'sub_dealer'::text)
WHERE 'contractor' = ANY(visible_to) 
  AND NOT ('sub_dealer' = ANY(visible_to));

-- Add policy for sub_dealers to read dealers (for points requests)
CREATE POLICY IF NOT EXISTS "Sub dealers can read dealers" 
  ON users 
  FOR SELECT 
  TO authenticated 
  USING (role = 'dealer'::text);

-- Update existing policies to include sub_dealer where appropriate
DROP POLICY IF EXISTS "Public can read dealers" ON users;
CREATE POLICY "Public can read dealers and sub dealers" 
  ON users 
  FOR SELECT 
  TO authenticated 
  USING (role IN ('dealer'::text, 'sub_dealer'::text));

-- Update rewards policy to include sub_dealer
DROP POLICY IF EXISTS "Users can read available rewards" ON rewards;
CREATE POLICY "Users can read available rewards" 
  ON rewards 
  FOR SELECT 
  TO authenticated 
  USING (
    available = true AND 
    (
      (auth.uid() IN (SELECT id FROM users WHERE role = 'contractor' AND 'contractor' = ANY(visible_to))) OR
      (auth.uid() IN (SELECT id FROM users WHERE role = 'dealer' AND 'dealer' = ANY(visible_to))) OR
      (auth.uid() IN (SELECT id FROM users WHERE role = 'sub_dealer' AND 'sub_dealer' = ANY(visible_to)))
    )
  );

-- Update announcements target_roles constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'announcements' AND constraint_name = 'announcements_target_roles_check'
  ) THEN
    ALTER TABLE announcements DROP CONSTRAINT announcements_target_roles_check;
  END IF;
END $$;

-- Add updated constraint for announcements if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'announcements') THEN
    -- No specific constraint needed as target_roles is a text array
    -- The application will handle validation
    NULL;
  END IF;
END $$;