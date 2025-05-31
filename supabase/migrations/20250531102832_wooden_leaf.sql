-- Create a function to handle transaction approval and points update atomically
CREATE OR REPLACE FUNCTION approve_transaction(
  p_transaction_id uuid,
  p_user_id uuid,
  p_points integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update transaction status
  UPDATE transactions
  SET status = 'approved',
      updated_at = now()
  WHERE id = p_transaction_id;

  -- Update user points if points are being earned
  IF p_points > 0 THEN
    UPDATE users
    SET points = points + p_points,
        updated_at = now()
    WHERE id = p_user_id;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION approve_transaction TO authenticated;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_points ON transactions(user_id, type, amount);