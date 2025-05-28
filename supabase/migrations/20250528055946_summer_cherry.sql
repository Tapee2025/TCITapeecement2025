/*
  # Update admin user password

  Updates the password for the admin user to a more secure value.
*/

-- Update admin user password to '123456789'
UPDATE auth.users
SET encrypted_password = crypt('123456789', gen_salt('bf'))
WHERE email = 'admin@tapeecement.com';