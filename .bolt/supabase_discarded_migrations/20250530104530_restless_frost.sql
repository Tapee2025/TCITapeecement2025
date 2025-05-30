-- First, ensure only one admin account exists
DO $$
BEGIN
  -- Delete any admin accounts except the super admin
  DELETE FROM public.users 
  WHERE role = 'admin' 
  AND email != 'admin.tapee@gmail.com';
  
  -- Update the super admin account to ensure correct settings
  UPDATE public.users
  SET 
    first_name = 'Super',
    last_name = 'Admin',
    city = 'Ahmedabad',
    address = 'Corporate Headquarters',
    district = 'Ahmedabad',
    mobile_number = '9876543210',
    user_code = 'SADMIN'
  WHERE email = 'admin.tapee@gmail.com';
END $$;

-- Add trigger to prevent creating multiple admin accounts
CREATE OR REPLACE FUNCTION prevent_multiple_admins()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'admin' AND NEW.email != 'admin.tapee@gmail.com' THEN
    RAISE EXCEPTION 'Only one admin account is allowed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_single_admin
BEFORE INSERT OR UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION prevent_multiple_admins();

-- Update admin policies
DROP POLICY IF EXISTS "Admins can view all users" ON users;
CREATE POLICY "Admins can view all users"
ON users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.email = 'admin.tapee@gmail.com'
  )
);

DROP POLICY IF EXISTS "Admins can manage rewards" ON rewards;
CREATE POLICY "Admins can manage rewards"
ON rewards
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.email = 'admin.tapee@gmail.com'
  )
);

DROP POLICY IF EXISTS "Admins can manage marketing slides" ON marketing_slides;
CREATE POLICY "Admins can manage marketing slides"
ON marketing_slides
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.email = 'admin.tapee@gmail.com'
  )
);

-- Update transaction policies for admin
DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
CREATE POLICY "Admins can view and manage all transactions"
ON transactions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.email = 'admin.tapee@gmail.com'
  )
);