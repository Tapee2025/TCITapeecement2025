/*
  # Create admin user
  
  1. Changes
    - Creates admin user in auth.users table
    - Creates corresponding user record in public.users table
    
  2. Security
    - Sets up admin role and permissions
*/

-- Create admin user in auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@tapeecement.com',
  crypt('123456789', gen_salt('bf')),
  now(),
  NULL,
  '',
  NULL,
  '',
  NULL,
  '',
  '',
  NULL,
  NULL,
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  now(),
  now(),
  NULL,
  NULL,
  '',
  '',
  NULL,
  '',
  0,
  NULL,
  '',
  NULL
) ON CONFLICT (email) DO UPDATE
SET encrypted_password = crypt('123456789', gen_salt('bf'));

-- Get the user id from auth.users and create public user
DO $$
DECLARE
  auth_uid uuid;
BEGIN
  SELECT id INTO auth_uid FROM auth.users WHERE email = 'admin@tapeecement.com';

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
    0,
    now(),
    now()
  ) ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    updated_at = now();
END $$;