/*
  # Create admin user with password

  1. Changes
    - Creates admin user in auth.users table
    - Creates corresponding user record in public.users table
    - Sets password to '123456789'
*/

-- Create admin user in auth.users
INSERT INTO auth.users (
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  'admin@tapeecement.com',
  crypt('123456789', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  'authenticated'
) ON CONFLICT (email) DO UPDATE
SET encrypted_password = crypt('123456789', gen_salt('bf'));

-- Get the user id from auth.users
DO $$
DECLARE
  auth_uid uuid;
BEGIN
  SELECT id INTO auth_uid FROM auth.users WHERE email = 'admin@tapeecement.com';

  -- Create corresponding user in public.users
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
  ) VALUES (
    auth_uid,
    'admin@tapeecement.com',
    'Admin',
    'User',
    'admin',
    'Ahmedabad',
    'Corporate Office',
    'Ahmedabad',
    '9876543210',
    'ADMIN1',
    0
  ) ON CONFLICT (id) DO NOTHING;
END $$;