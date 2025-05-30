/*
  # Create new admin user

  1. Changes
    - Creates new admin user with secure password
    - Sets up admin profile with required data
*/

DO $$
BEGIN
  -- Create admin user if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'newadmin@tapeecement.com'
  ) THEN
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
      'newadmin@tapeecement.com',
      crypt('Admin@123456', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(),
      now()
    );
  END IF;

  -- Create admin profile if it doesn't exist
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
    points
  ) 
  SELECT 
    id,
    'newadmin@tapeecement.com',
    'New',
    'Admin',
    'admin',
    'Ahmedabad',
    'Head Office',
    'Ahmedabad',
    '9876543210',
    'ADMIN2',
    0
  FROM auth.users
  WHERE email = 'newadmin@tapeecement.com'
  ON CONFLICT (email) DO NOTHING;
END $$;