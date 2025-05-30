-- Add policy for admins to view all users
CREATE POLICY "Admins can view all users"
ON users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Add policy for admins to view all transactions
CREATE POLICY "Admins can view all transactions"
ON transactions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Fix the dealer approved transactions query
CREATE OR REPLACE FUNCTION get_pending_admin_approvals()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  dealer_id uuid,
  type text,
  amount integer,
  description text,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  user_details jsonb,
  dealer_details jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.user_id,
    t.dealer_id,
    t.type,
    t.amount,
    t.description,
    t.status,
    t.created_at,
    t.updated_at,
    jsonb_build_object(
      'first_name', u.first_name,
      'last_name', u.last_name,
      'user_code', u.user_code,
      'role', u.role
    ) as user_details,
    jsonb_build_object(
      'first_name', d.first_name,
      'last_name', d.last_name,
      'user_code', d.user_code
    ) as dealer_details
  FROM transactions t
  JOIN users u ON t.user_id = u.id
  LEFT JOIN users d ON t.dealer_id = d.id
  WHERE t.status = 'dealer_approved'
  ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql;