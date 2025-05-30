/*
  # Create admin user

  1. New Records
    - Creates an admin user in auth.users
    - Creates admin profile in public.users
    
  2. Details
    - Email: admin@tapeecement.com
    - Password: Admin@123
    - Role: admin
    - User Code: ADMIN1
*/

-- Create admin user with email and password
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'ad3d1e5c-a111-4542-8a7a-9ca2e0c4a333',
  'authenticated',
  'authenticated',
  'admin@tapeecement.com',
  crypt('Admin@123', gen_salt('bf')),
  now(),
  now(),
  now()
);

-- Create admin profile
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
  'ad3d1e5c-a111-4542-8a7a-9ca2e0c4a333',
  'admin@tapeecement.com',
  'System',
  'Admin',
  'admin',
  'Ahmedabad',
  'Corporate Office',
  'Ahmedabad',
  '9999999999',
  'ADMIN1',
  0
);