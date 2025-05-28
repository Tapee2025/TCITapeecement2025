/*
  # Create admin user

  1. Changes
    - Insert initial admin user into users table
    - Email: admin@tapeecement.com
    - Password will be set through Supabase Auth UI
*/

INSERT INTO public.users (
  email,
  first_name,
  last_name,
  role,
  city,
  address,
  district,
  mobile_number,
  user_code
) VALUES (
  'admin@tapeecement.com',
  'Admin',
  'User',
  'admin',
  'Ahmedabad',
  'Corporate Office',
  'Ahmedabad',
  '9876543210',
  'ADMIN1'
) ON CONFLICT (email) DO NOTHING;