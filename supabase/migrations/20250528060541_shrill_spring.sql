/*
  # Create admin user
  
  1. Changes
    - Create admin user in auth.users table
    - Create corresponding user record in public.users table
    - Set password to '123456789'
    
  2. Security
    - Uses secure password hashing with bcrypt
    - Maintains referential integrity between auth and public tables
*/

-- Create admin user in auth.users if not exists
DO $$
DECLARE
  admin_uid uuid;
BEGIN
  -- Check if admin user already exists
  SELECT id INTO admin_uid FROM auth.users WHERE email = 'admin@tapeecement.com';
  
  -- If admin doesn't exist, create new user
  IF admin_uid IS NULL THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@tapeecement.com',
      crypt('123456789', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(),
      now()
    ) RETURNING id INTO admin_uid;
  ELSE
    -- If admin exists, update password
    UPDATE auth.users
    SET 
      encrypted_password = crypt('123456789', gen_salt('bf')),
      updated_at = now()
    WHERE id = admin_uid;
  END IF;

  -- Create or update corresponding public user
  INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    role,
    city,
    address,
    district,
    mobile_number,
    user_code,
    points,
    created_at,
    updated_at
  ) VALUES (
    admin_uid,
    'admin@tapeecement.com',
    'Admin',
    'User',
    'admin',
    'Ahmedabad',
    'Corporate Office',
    'Ahmedabad',
    '9876543210',
    'ADMIN1',
    0,
    now(),
    now()
  ) ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    city = EXCLUDED.city,
    address = EXCLUDED.address,
    district = EXCLUDED.district,
    mobile_number = EXCLUDED.mobile_number,
    user_code = EXCLUDED.user_code,
    updated_at = now();
END $$;