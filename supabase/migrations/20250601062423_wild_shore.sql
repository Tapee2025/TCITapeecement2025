-- Update the default value for visible_to to include dealer
ALTER TABLE rewards 
ALTER COLUMN visible_to SET DEFAULT ARRAY['builder', 'contractor', 'dealer'];

-- Update existing rewards to include dealer visibility
UPDATE rewards 
SET visible_to = array_append(visible_to, 'dealer')
WHERE NOT 'dealer' = ANY(visible_to);