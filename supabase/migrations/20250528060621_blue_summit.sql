/*
  # Create admin user
  
  Creates or updates the admin user in both auth.users and public.users tables
  with proper handling of unique constraints.
  
  1. Changes
    - Creates admin user if not exists
    - Updates password if user exists
    - Creates/updates corresponding public user record
    
  2. Security
    - Sets up admin role
    - Ensures email confirmation
*/

DO $$
DECLARE
  admin_uid uuid;
  existing_public_uid uuid;
BEGIN
  -- Check if admin user already exists in auth.users
  SELECT id INTO admin_uid FROM auth.users WHERE email = 'admin@tapeecement.com';
  
  -- If admin doesn't exist in auth.users, create new user
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

  -- Check if user exists in public.users
  SELECT id INTO existing_public_uid FROM public.users WHERE email = 'admin@tapeecement.com';

  IF existing_public_uid IS NULL THEN
    -- Create new public user if doesn't exist
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
    );
  ELSE
    -- Update existing public user
    UPDATE public.users
    SET
      id = admin_uid,
      first_name = 'Admin',
      last_name = 'User',
      role = 'admin',
      city = 'Ahmedabad',
      address = 'Corporate Office',
      district = 'Ahmedabad',
      mobile_number = '9876543210',
      user_code = 'ADMIN1',
      updated_at = now()
    WHERE email = 'admin@tapeecement.com';
  END IF;
END $$;