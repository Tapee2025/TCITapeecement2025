/*
  # Add transaction cancellation functionality

  1. New Functions
    - `cancel_transaction` - Function to safely cancel/undo approved transactions
    - `get_transaction_details` - Function to get full transaction details for cancellation

  2. Security
    - Only admins can cancel transactions
    - Proper validation to ensure data integrity
    - Audit trail for cancelled transactions

  3. Business Logic
    - Refund points to user if transaction was approved
    - Update transaction status to 'cancelled'
    - Add cancellation reason and timestamp
*/

-- Add cancellation fields to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
ADD COLUMN IF NOT EXISTS cancelled_by uuid REFERENCES users(id),
ADD COLUMN IF NOT EXISTS cancellation_reason text;

-- Update transaction status constraint to include 'cancelled'
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_status_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_status_check 
  CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'dealer_approved'::text, 'cancelled'::text]));

-- Function to safely cancel a transaction
CREATE OR REPLACE FUNCTION cancel_transaction(
  p_transaction_id uuid,
  p_admin_id uuid,
  p_reason text DEFAULT 'Administrative cancellation'
) RETURNS json AS $$
DECLARE
  v_transaction RECORD;
  v_user RECORD;
  v_admin RECORD;
  v_result json;
BEGIN
  -- Verify admin permissions
  SELECT * INTO v_admin FROM users WHERE id = p_admin_id AND role = 'admin';
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Unauthorized: Admin privileges required'
    );
  END IF;

  -- Get transaction details
  SELECT t.*, u.first_name, u.last_name, u.points, u.email
  INTO v_transaction
  FROM transactions t
  JOIN users u ON t.user_id = u.id
  WHERE t.id = p_transaction_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Transaction not found'
    );
  END IF;

  -- Check if transaction can be cancelled
  IF v_transaction.status = 'cancelled' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Transaction is already cancelled'
    );
  END IF;

  IF v_transaction.status NOT IN ('approved', 'dealer_approved') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Only approved transactions can be cancelled'
    );
  END IF;

  -- Start transaction
  BEGIN
    -- For earned points: Remove points from user
    IF v_transaction.type = 'earned' AND v_transaction.status = 'approved' THEN
      UPDATE users 
      SET points = points - v_transaction.amount,
          updated_at = now()
      WHERE id = v_transaction.user_id;

      -- Ensure points don't go negative
      UPDATE users 
      SET points = GREATEST(points, 0)
      WHERE id = v_transaction.user_id;
    END IF;

    -- For redeemed points: Add points back to user
    IF v_transaction.type = 'redeemed' THEN
      UPDATE users 
      SET points = points + v_transaction.amount,
          updated_at = now()
      WHERE id = v_transaction.user_id;
    END IF;

    -- Update transaction status to cancelled
    UPDATE transactions 
    SET status = 'cancelled',
        cancelled_at = now(),
        cancelled_by = p_admin_id,
        cancellation_reason = p_reason,
        updated_at = now()
    WHERE id = p_transaction_id;

    -- Get updated user points
    SELECT points INTO v_user FROM users WHERE id = v_transaction.user_id;

    v_result := json_build_object(
      'success', true,
      'message', 'Transaction cancelled successfully',
      'transaction_id', p_transaction_id,
      'user_name', v_transaction.first_name || ' ' || v_transaction.last_name,
      'transaction_type', v_transaction.type,
      'amount', v_transaction.amount,
      'user_points_before', v_transaction.points,
      'user_points_after', v_user.points,
      'cancelled_by', v_admin.first_name || ' ' || v_admin.last_name,
      'cancelled_at', now(),
      'reason', p_reason
    );

    RETURN v_result;

  EXCEPTION WHEN OTHERS THEN
    -- Rollback will happen automatically
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to cancel transaction: ' || SQLERRM
    );
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get transaction details for cancellation preview
CREATE OR REPLACE FUNCTION get_transaction_details(p_transaction_id uuid)
RETURNS json AS $$
DECLARE
  v_transaction RECORD;
  v_dealer RECORD;
  v_reward RECORD;
BEGIN
  -- Get transaction with user details
  SELECT 
    t.*,
    u.first_name as user_first_name,
    u.last_name as user_last_name,
    u.email as user_email,
    u.points as user_current_points,
    u.user_code as user_code
  INTO v_transaction
  FROM transactions t
  JOIN users u ON t.user_id = u.id
  WHERE t.id = p_transaction_id;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Transaction not found');
  END IF;

  -- Get dealer details if applicable
  IF v_transaction.dealer_id IS NOT NULL THEN
    SELECT first_name, last_name, user_code
    INTO v_dealer
    FROM users
    WHERE id = v_transaction.dealer_id;
  END IF;

  -- Get reward details if applicable
  IF v_transaction.reward_id IS NOT NULL THEN
    SELECT title, points_required
    INTO v_reward
    FROM rewards
    WHERE id = v_transaction.reward_id;
  END IF;

  RETURN json_build_object(
    'transaction', json_build_object(
      'id', v_transaction.id,
      'type', v_transaction.type,
      'amount', v_transaction.amount,
      'description', v_transaction.description,
      'status', v_transaction.status,
      'created_at', v_transaction.created_at,
      'updated_at', v_transaction.updated_at
    ),
    'user', json_build_object(
      'id', v_transaction.user_id,
      'name', v_transaction.user_first_name || ' ' || v_transaction.user_last_name,
      'email', v_transaction.user_email,
      'user_code', v_transaction.user_code,
      'current_points', v_transaction.user_current_points
    ),
    'dealer', CASE 
      WHEN v_dealer IS NOT NULL THEN json_build_object(
        'name', v_dealer.first_name || ' ' || v_dealer.last_name,
        'user_code', v_dealer.user_code
      )
      ELSE NULL
    END,
    'reward', CASE 
      WHEN v_reward IS NOT NULL THEN json_build_object(
        'title', v_reward.title,
        'points_required', v_reward.points_required
      )
      ELSE NULL
    END,
    'cancellation', CASE 
      WHEN v_transaction.cancelled_at IS NOT NULL THEN json_build_object(
        'cancelled_at', v_transaction.cancelled_at,
        'reason', v_transaction.cancellation_reason
      )
      ELSE NULL
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for better performance on cancelled transactions
CREATE INDEX IF NOT EXISTS idx_transactions_cancelled_at ON transactions(cancelled_at) WHERE cancelled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_cancelled_by ON transactions(cancelled_by) WHERE cancelled_by IS NOT NULL;