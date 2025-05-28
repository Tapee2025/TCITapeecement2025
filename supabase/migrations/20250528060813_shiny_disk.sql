/*
  # Create admin user
  
  1. Changes
    - Creates admin user in auth.users if not exists
    - Creates corresponding admin user in public.users
    - Updates password if user already exists
    
  2. Security
    - Admin user has authenticated role
    - Password is properly hashed
*/

-- First create admin in auth.users if not exists
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
)
ON CONFLICT (email) DO UPDATE
SET encrypted_password = crypt('123456789', gen_salt('bf')),
    updated_at = now()
RETURNING id INTO admin_uid;

-- Then create or update the public user
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
) 
SELECT 
  id,
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
FROM auth.users
WHERE email = 'admin@tapeecement.com'
ON CONFLICT (email) DO UPDATE
SET
  id = EXCLUDED.id,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role,
  city = EXCLUDED.city,
  address = EXCLUDED.address,
  district = EXCLUDED.district,
  mobile_number = EXCLUDED.mobile_number,
  user_code = EXCLUDED.user_code,
  updated_at = now();