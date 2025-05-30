-- First, delete all existing admin accounts
DELETE FROM public.users WHERE role = 'admin';
DELETE FROM auth.users WHERE email LIKE '%@gmail.com' OR email LIKE '%@tapeecement.com';

DO $$
DECLARE
  admin_uid uuid;
BEGIN
  -- Create new admin user
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
    'admin.tapee@gmail.com',
    crypt('Admin@123456', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  ) RETURNING id INTO admin_uid;

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
    points,
    created_at,
    updated_at
  ) VALUES (
    admin_uid,
    'admin.tapee@gmail.com',
    'System',
    'Admin',
    'admin',
    'Ahmedabad',
    'Head Office',
    'Ahmedabad',
    '9876543210',
    'ADMIN1',
    0,
    now(),
    now()
  );
END $$;