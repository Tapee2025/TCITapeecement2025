/*
  # Add visible_to column to rewards table

  1. Changes
    - Add `visible_to` column to `rewards` table to store which user types can see each reward
    - Column type is text[] to store an array of roles (builder, contractor, dealer)
    - Default value is set to ['builder', 'contractor'] for backward compatibility
    - Update existing rows to have the default value

  2. Security
    - No changes to RLS policies needed as this is just adding a column
*/

ALTER TABLE rewards 
ADD COLUMN IF NOT EXISTS visible_to text[] DEFAULT ARRAY['builder', 'contractor'];

-- Update any existing rows to have the default value if the column was just added
UPDATE rewards 
SET visible_to = ARRAY['builder', 'contractor']
WHERE visible_to IS NULL;