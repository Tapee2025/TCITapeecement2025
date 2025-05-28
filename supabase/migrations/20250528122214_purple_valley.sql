/*
  # Create admin user

  1. Changes
    - Creates admin user if it doesn't exist
    - Creates admin profile in public.users table
  
  2. Security
    - Uses secure password hashing
    - Sets up proper role and permissions
*/

DO $$
BEGIN
  -- Create admin user if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@tapeecement.com'
  ) THEN
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
  END IF;

  -- Create admin profile if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM public.users WHERE email = 'admin@tapeecement.com'
  ) THEN
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
  END IF;
END $$;