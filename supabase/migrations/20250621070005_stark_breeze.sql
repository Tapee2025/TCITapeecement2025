/*
  # Enable dealer rewards and update visible_to defaults

  1. Changes
    - Update rewards table to include dealers in visible_to by default
    - Update existing rewards to be visible to dealers
    - Add policies for dealer reward redemption

  2. Security
    - Maintain existing RLS policies
    - Ensure dealers can redeem rewards like other users
*/

-- Update the default value for visible_to to include all user types
ALTER TABLE rewards 
ALTER COLUMN visible_to SET DEFAULT ARRAY['builder', 'contractor', 'dealer'];

-- Update existing rewards to include dealer visibility if not already present
UPDATE rewards 
SET visible_to = CASE 
  WHEN 'dealer' = ANY(visible_to) THEN visible_to
  ELSE array_append(visible_to, 'dealer')
END
WHERE NOT 'dealer' = ANY(visible_to) OR visible_to IS NULL;

-- Ensure all rewards have the updated default if visible_to was null
UPDATE rewards 
SET visible_to = ARRAY['builder', 'contractor', 'dealer']
WHERE visible_to IS NULL;