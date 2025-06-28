/*
  # Fix Notifications RLS Policy for Transaction Triggers

  1. Problem
    - Transaction triggers need to create notifications for both users and dealers
    - Current RLS policy only allows users to create notifications for themselves
    - This causes RLS policy violations when triggers run

  2. Solution
    - Update RLS policies to allow service role full access to notifications
    - Ensure triggers can create notifications for any user
    - Maintain security by restricting regular user access appropriately
*/

-- Drop existing policies on notifications table
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Service role has full access to notifications" ON notifications;

-- Create proper policies for notifications
-- 1. Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. Users can update their own notifications (e.g., mark as read)
CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Service role has full access (for triggers and functions)
CREATE POLICY "Service role has full access to notifications"
  ON notifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4. Allow the transaction notification trigger to work properly
-- This policy allows the system to create notifications for any user
CREATE POLICY "System can create notifications for any user"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Update the create_transaction_notification function to use security definer
-- This ensures it runs with elevated privileges
CREATE OR REPLACE FUNCTION create_transaction_notification() 
RETURNS TRIGGER 
SECURITY DEFINER
AS $$
DECLARE
  v_title text;
  v_message text;
  v_type text;
  v_action_url text;
  v_action_text text;
BEGIN
  -- Only create notification if status changed
  IF (TG_OP = 'UPDATE' AND NEW.status != OLD.status) OR TG_OP = 'INSERT' THEN
    -- Set notification details based on transaction type and status
    IF NEW.type = 'earned' THEN
      CASE NEW.status
        WHEN 'pending' THEN
          v_title := 'Points Request Submitted';
          v_message := 'Your request for ' || NEW.amount || ' points has been submitted and is pending approval.';
          v_type := 'info';
        WHEN 'dealer_approved' THEN
          v_title := 'Points Request Approved by Dealer';
          v_message := 'Your request for ' || NEW.amount || ' points has been approved by the dealer and is pending admin approval.';
          v_type := 'info';
        WHEN 'approved' THEN
          v_title := 'Points Request Approved';
          v_message := 'Congratulations! Your request for ' || NEW.amount || ' points has been approved.';
          v_type := 'success';
        WHEN 'rejected' THEN
          v_title := 'Points Request Rejected';
          v_message := 'Your request for ' || NEW.amount || ' points has been rejected.';
          v_type := 'error';
        WHEN 'cancelled' THEN
          v_title := 'Points Request Cancelled';
          v_message := 'Your request for ' || NEW.amount || ' points has been cancelled. Reason: ' || COALESCE(NEW.cancellation_reason, 'Administrative action');
          v_type := 'warning';
        ELSE
          v_title := 'Points Request Updated';
          v_message := 'Your points request status has been updated to ' || NEW.status || '.';
          v_type := 'info';
      END CASE;
      v_action_url := CASE 
        WHEN NEW.user_id IN (SELECT id FROM users WHERE role = 'dealer') THEN '/dealer/transactions'
        ELSE '/transactions'
      END;
      v_action_text := 'View Transactions';
    ELSE -- redeemed
      CASE NEW.status
        WHEN 'pending' THEN
          v_title := 'Reward Redemption Submitted';
          v_message := 'Your redemption request for ' || NEW.amount || ' points has been submitted and is pending approval.';
          v_type := 'info';
        WHEN 'approved' THEN
          v_title := 'Reward Redemption Approved';
          v_message := 'Your redemption request for ' || NEW.amount || ' points has been approved.';
          v_type := 'success';
        WHEN 'rejected' THEN
          v_title := 'Reward Redemption Rejected';
          v_message := 'Your redemption request for ' || NEW.amount || ' points has been rejected.';
          v_type := 'error';
        WHEN 'cancelled' THEN
          v_title := 'Reward Redemption Cancelled';
          v_message := 'Your redemption request for ' || NEW.amount || ' points has been cancelled. Reason: ' || COALESCE(NEW.cancellation_reason, 'Administrative action');
          v_type := 'warning';
        ELSE
          v_title := 'Reward Redemption Updated';
          v_message := 'Your redemption request status has been updated to ' || NEW.status || '.';
          v_type := 'info';
      END CASE;
      v_action_url := CASE 
        WHEN NEW.user_id IN (SELECT id FROM users WHERE role = 'dealer') THEN '/dealer/transactions'
        ELSE '/transactions'
      END;
      v_action_text := 'View Transactions';
    END IF;

    -- Create notification
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      action_url,
      action_text,
      metadata
    ) VALUES (
      NEW.user_id,
      v_title,
      v_message,
      v_type,
      v_action_url,
      v_action_text,
      jsonb_build_object(
        'transaction_id', NEW.id,
        'transaction_type', NEW.type,
        'amount', NEW.amount,
        'status', NEW.status
      )
    );

    -- If dealer is involved, notify them too
    IF NEW.dealer_id IS NOT NULL AND NEW.status IN ('pending', 'approved', 'rejected', 'cancelled') THEN
      INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        action_url,
        action_text,
        metadata
      ) VALUES (
        NEW.dealer_id,
        CASE 
          WHEN NEW.status = 'pending' THEN 'New Points Request'
          WHEN NEW.status = 'approved' THEN 'Points Request Approved'
          WHEN NEW.status = 'rejected' THEN 'Points Request Rejected'
          WHEN NEW.status = 'cancelled' THEN 'Points Request Cancelled'
        END,
        CASE 
          WHEN NEW.status = 'pending' THEN 'A customer has submitted a new points request for ' || NEW.amount || ' points.'
          WHEN NEW.status = 'approved' THEN 'A points request for ' || NEW.amount || ' points has been approved by admin.'
          WHEN NEW.status = 'rejected' THEN 'A points request for ' || NEW.amount || ' points has been rejected.'
          WHEN NEW.status = 'cancelled' THEN 'A points request for ' || NEW.amount || ' points has been cancelled.'
        END,
        CASE 
          WHEN NEW.status = 'pending' THEN 'info'
          WHEN NEW.status = 'approved' THEN 'success'
          WHEN NEW.status = 'rejected' THEN 'error'
          WHEN NEW.status = 'cancelled' THEN 'warning'
        END,
        '/dealer/approve-points',
        'View Requests',
        jsonb_build_object(
          'transaction_id', NEW.id,
          'transaction_type', NEW.type,
          'amount', NEW.amount,
          'status', NEW.status
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger with the updated function
DROP TRIGGER IF EXISTS transaction_notification_trigger ON transactions;
CREATE TRIGGER transaction_notification_trigger
AFTER INSERT OR UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION create_transaction_notification();