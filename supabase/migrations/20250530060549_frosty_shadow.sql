-- First, delete all existing admin accounts
DELETE FROM public.users WHERE role = 'admin';
DELETE FROM auth.users WHERE email LIKE '%@gmail.com' OR email LIKE '%@tapeecement.com';

DO $$
DECLARE
  admin_uid uuid;
BEGIN
  -- Create new admin user with all required fields
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change_token_current,
    phone,
    phone_change,
    phone_change_token,
    email_change,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    invitation_token,
    code_challenge_method
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin.tapee@gmail.com',
    crypt('Admin@123456', gen_salt('bf')),
    now(),
    now(),
    jsonb_build_object(
      'provider', 'email',
      'providers', array['email'],
      'is_super_admin', true
    ),
    jsonb_build_object(
      'role', 'admin',
      'is_super_admin', true
    ),
    true,
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    0,
    null,
    '',
    '',
    ''
  ) RETURNING id INTO admin_uid;

  -- Create admin profile with super admin privileges
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
    'Super',
    'Admin',
    'admin',
    'Ahmedabad',
    'Corporate Headquarters',
    'Ahmedabad',
    '9876543210',
    'SADMIN',
    0,
    now(),
    now()
  );

  -- Grant all necessary permissions to the super admin
  PERFORM set_config('role', 'authenticated', false);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', false);
  PERFORM set_config('request.jwt.claim.email', 'admin.tapee@gmail.com', false);
END $$;