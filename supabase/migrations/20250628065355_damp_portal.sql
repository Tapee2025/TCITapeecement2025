/*
  # Advanced Features Migration

  1. New Tables
    - `notifications` - User notifications system
    - `achievements` - Achievement definitions
    - `user_achievements` - User achievement progress
    - `announcements` - Company-wide announcements
    - `support_tickets` - Support ticket system
    - `support_messages` - Support ticket messages
    - `faqs` - Frequently asked questions

  2. Functions
    - `get_analytics_data` - Analytics data aggregation
    - `check_and_award_achievements` - Achievement checking logic
    - `create_transaction_notification` - Transaction notifications

  3. Triggers
    - Achievement checking on transaction updates
    - Notification creation on transaction status changes

  4. Security
    - RLS policies for all new tables
    - Proper access controls
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'achievement', 'reward', 'transaction')),
  read boolean DEFAULT false,
  action_url text,
  action_text text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  badge_color text NOT NULL,
  points_threshold integer,
  bags_threshold integer,
  transactions_threshold integer,
  category text NOT NULL CHECK (category IN ('points', 'bags', 'transactions', 'loyalty', 'special')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  achievement_id uuid REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
  earned_at timestamptz DEFAULT now(),
  progress integer,
  is_claimed boolean DEFAULT false,
  UNIQUE(user_id, achievement_id)
);

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  type text NOT NULL CHECK (type IN ('general', 'maintenance', 'feature', 'promotion', 'urgent')),
  target_roles text[] NOT NULL,
  is_active boolean DEFAULT true,
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Create support_tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('technical', 'account', 'points', 'rewards', 'general')),
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text NOT NULL CHECK (status IN ('open', 'in_progress', 'waiting_user', 'resolved', 'closed')),
  assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create support_messages table
CREATE TABLE IF NOT EXISTS support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES support_tickets(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES users(id) ON DELETE SET NULL NOT NULL,
  message text NOT NULL,
  is_internal boolean DEFAULT false,
  attachments text[],
  created_at timestamptz DEFAULT now()
);

-- Create faqs table
CREATE TABLE IF NOT EXISTS faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text NOT NULL,
  tags text[] DEFAULT '{}',
  is_published boolean DEFAULT true,
  view_count integer DEFAULT 0,
  helpful_count integer DEFAULT 0,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create function to get analytics data
CREATE OR REPLACE FUNCTION get_analytics_data(
  p_start_date timestamptz,
  p_end_date timestamptz,
  p_dealer_id uuid DEFAULT NULL
) RETURNS json AS $$
DECLARE
  v_result json;
  v_total_users integer;
  v_active_users integer;
  v_new_registrations integer;
  v_total_transactions integer;
  v_total_points_issued integer;
  v_total_bags_sold integer;
  v_total_rewards_redeemed integer;
  v_revenue_impact numeric;
  v_user_engagement_rate numeric;
  v_top_dealers json;
  v_popular_rewards json;
BEGIN
  -- Get total users
  SELECT COUNT(*) INTO v_total_users
  FROM users
  WHERE role != 'admin';

  -- Get active users (users with transactions in the period)
  SELECT COUNT(DISTINCT user_id) INTO v_active_users
  FROM transactions
  WHERE created_at BETWEEN p_start_date AND p_end_date;

  -- Get new registrations
  SELECT COUNT(*) INTO v_new_registrations
  FROM users
  WHERE created_at BETWEEN p_start_date AND p_end_date
    AND role != 'admin';

  -- Get total transactions
  SELECT COUNT(*) INTO v_total_transactions
  FROM transactions
  WHERE created_at BETWEEN p_start_date AND p_end_date;

  -- Get total points issued
  SELECT COALESCE(SUM(amount), 0) INTO v_total_points_issued
  FROM transactions
  WHERE type = 'earned'
    AND status = 'approved'
    AND created_at BETWEEN p_start_date AND p_end_date;

  -- Get total bags sold (from dealer transactions only)
  SELECT COALESCE(SUM(
    CASE
      WHEN description ILIKE '%OPC%' THEN FLOOR(amount / 5)
      WHEN description ILIKE '%PPC%' THEN FLOOR(amount / 10)
      ELSE FLOOR(amount / 10)
    END
  ), 0) INTO v_total_bags_sold
  FROM transactions t
  JOIN users u ON t.user_id = u.id
  WHERE t.type = 'earned'
    AND t.status = 'approved'
    AND u.role = 'dealer'
    AND t.created_at BETWEEN p_start_date AND p_end_date;

  -- Get total rewards redeemed
  SELECT COUNT(*) INTO v_total_rewards_redeemed
  FROM transactions
  WHERE type = 'redeemed'
    AND status IN ('approved', 'completed')
    AND created_at BETWEEN p_start_date AND p_end_date;

  -- Calculate revenue impact (assuming average bag price of ₹350)
  v_revenue_impact := v_total_bags_sold * 350;

  -- Calculate user engagement rate
  v_user_engagement_rate := CASE WHEN v_total_users > 0 THEN 
    ROUND((v_active_users::numeric / v_total_users::numeric) * 100, 2)
  ELSE 0 END;

  -- Get top performing dealers
  SELECT json_agg(dealer_data)
  INTO v_top_dealers
  FROM (
    SELECT 
      u.id AS dealer_id,
      u.first_name || ' ' || u.last_name AS name,
      COALESCE(SUM(
        CASE
          WHEN t.description ILIKE '%OPC%' THEN FLOOR(t.amount / 5)
          WHEN t.description ILIKE '%PPC%' THEN FLOOR(t.amount / 10)
          ELSE FLOOR(t.amount / 10)
        END
      ), 0) AS bags_sold,
      COALESCE(SUM(t.amount), 0) AS points_issued
    FROM transactions t
    JOIN users u ON t.user_id = u.id
    WHERE t.type = 'earned'
      AND t.status = 'approved'
      AND u.role = 'dealer'
      AND t.created_at BETWEEN p_start_date AND p_end_date
    GROUP BY u.id, u.first_name, u.last_name
    ORDER BY bags_sold DESC
    LIMIT 5
  ) AS dealer_data;

  -- Get popular rewards
  SELECT json_agg(reward_data)
  INTO v_popular_rewards
  FROM (
    SELECT 
      r.id AS reward_id,
      r.title,
      COUNT(t.id) AS redemption_count
    FROM transactions t
    JOIN rewards r ON t.reward_id = r.id
    WHERE t.type = 'redeemed'
      AND t.status IN ('approved', 'completed')
      AND t.created_at BETWEEN p_start_date AND p_end_date
    GROUP BY r.id, r.title
    ORDER BY redemption_count DESC
    LIMIT 5
  ) AS reward_data;

  -- If dealer_id is provided, filter data for that dealer
  IF p_dealer_id IS NOT NULL THEN
    -- Get dealer-specific analytics
    SELECT 
      COALESCE(SUM(
        CASE
          WHEN t.description ILIKE '%OPC%' THEN FLOOR(t.amount / 5)
          WHEN t.description ILIKE '%PPC%' THEN FLOOR(t.amount / 10)
          ELSE FLOOR(t.amount / 10)
        END
      ), 0) INTO v_total_bags_sold
    FROM transactions t
    WHERE t.user_id = p_dealer_id
      AND t.type = 'earned'
      AND t.status = 'approved'
      AND t.created_at BETWEEN p_start_date AND p_end_date;

    -- Get dealer's total points issued
    SELECT COALESCE(SUM(amount), 0) INTO v_total_points_issued
    FROM transactions
    WHERE user_id = p_dealer_id
      AND type = 'earned'
      AND status = 'approved'
      AND created_at BETWEEN p_start_date AND p_end_date;

    -- Get dealer's total transactions
    SELECT COUNT(*) INTO v_total_transactions
    FROM transactions
    WHERE user_id = p_dealer_id
      AND created_at BETWEEN p_start_date AND p_end_date;

    -- Get dealer's customers (unique users who made transactions through this dealer)
    SELECT COUNT(DISTINCT user_id) INTO v_active_users
    FROM transactions
    WHERE dealer_id = p_dealer_id
      AND user_id != p_dealer_id
      AND created_at BETWEEN p_start_date AND p_end_date;

    -- Calculate revenue impact for dealer
    v_revenue_impact := v_total_bags_sold * 350;
  END IF;

  -- Build the result JSON
  v_result := json_build_object(
    'period', p_start_date || ' to ' || p_end_date,
    'total_users', v_total_users,
    'active_users', v_active_users,
    'new_registrations', v_new_registrations,
    'total_transactions', v_total_transactions,
    'total_points_issued', v_total_points_issued,
    'total_bags_sold', v_total_bags_sold,
    'total_rewards_redeemed', v_total_rewards_redeemed,
    'revenue_impact', v_revenue_impact,
    'user_engagement_rate', v_user_engagement_rate,
    'top_performing_dealers', COALESCE(v_top_dealers, '[]'::json),
    'popular_rewards', COALESCE(v_popular_rewards, '[]'::json)
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check and award achievements
CREATE OR REPLACE FUNCTION check_and_award_achievements(p_user_id uuid) RETURNS void AS $$
DECLARE
  v_user RECORD;
  v_achievement RECORD;
  v_user_points integer;
  v_user_bags integer := 0;
  v_user_transactions integer := 0;
  v_already_earned boolean;
BEGIN
  -- Get user data
  SELECT * INTO v_user FROM users WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Get user points
  v_user_points := v_user.points;

  -- Calculate total bags purchased (for contractors) or sold (for dealers)
  IF v_user.role = 'contractor' THEN
    SELECT COALESCE(SUM(
      CASE
        WHEN description ILIKE '%OPC%' THEN FLOOR(amount / 5)
        WHEN description ILIKE '%PPC%' THEN FLOOR(amount / 10)
        ELSE FLOOR(amount / 10)
      END
    ), 0) INTO v_user_bags
    FROM transactions
    WHERE user_id = p_user_id
      AND type = 'earned'
      AND status = 'approved';
  ELSIF v_user.role = 'dealer' THEN
    SELECT COALESCE(SUM(
      CASE
        WHEN description ILIKE '%OPC%' THEN FLOOR(amount / 5)
        WHEN description ILIKE '%PPC%' THEN FLOOR(amount / 10)
        ELSE FLOOR(amount / 10)
      END
    ), 0) INTO v_user_bags
    FROM transactions
    WHERE user_id = p_user_id
      AND type = 'earned'
      AND status = 'approved';
  END IF;

  -- Get total transactions
  SELECT COUNT(*) INTO v_user_transactions
  FROM transactions
  WHERE user_id = p_user_id
    AND status IN ('approved', 'completed');

  -- Check each achievement
  FOR v_achievement IN 
    SELECT * FROM achievements WHERE is_active = true
  LOOP
    -- Check if user already earned this achievement
    SELECT EXISTS(
      SELECT 1 FROM user_achievements 
      WHERE user_id = p_user_id AND achievement_id = v_achievement.id
    ) INTO v_already_earned;

    IF NOT v_already_earned THEN
      -- Check if user meets the criteria
      IF (v_achievement.points_threshold IS NOT NULL AND v_user_points >= v_achievement.points_threshold) OR
         (v_achievement.bags_threshold IS NOT NULL AND v_user_bags >= v_achievement.bags_threshold) OR
         (v_achievement.transactions_threshold IS NOT NULL AND v_user_transactions >= v_achievement.transactions_threshold) THEN
        
        -- Award the achievement
        INSERT INTO user_achievements (user_id, achievement_id)
        VALUES (p_user_id, v_achievement.id);
        
        -- Create notification
        INSERT INTO notifications (
          user_id, 
          title, 
          message, 
          type,
          action_url,
          action_text
        ) VALUES (
          p_user_id,
          'Achievement Unlocked: ' || v_achievement.title,
          'Congratulations! You have earned the ' || v_achievement.title || ' achievement.',
          'achievement',
          CASE 
            WHEN v_user.role = 'dealer' THEN '/dealer/achievements'
            ELSE '/achievements'
          END,
          'View Achievements'
        );
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function to check achievements after transactions
CREATE OR REPLACE FUNCTION trigger_check_achievements() RETURNS TRIGGER AS $$
BEGIN
  -- Only check for approved transactions
  IF NEW.status = 'approved' AND (TG_OP = 'INSERT' OR OLD.status != 'approved') THEN
    PERFORM check_and_award_achievements(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on transactions table
DROP TRIGGER IF EXISTS check_achievements_trigger ON transactions;
CREATE TRIGGER check_achievements_trigger
AFTER INSERT OR UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION trigger_check_achievements();

-- Create function to create notification for transaction status changes
CREATE OR REPLACE FUNCTION create_transaction_notification() RETURNS TRIGGER AS $$
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

-- Create trigger on transactions table for notifications
DROP TRIGGER IF EXISTS transaction_notification_trigger ON transactions;
CREATE TRIGGER transaction_notification_trigger
AFTER INSERT OR UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION create_transaction_notification();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_is_published ON faqs(is_published);

-- Enable RLS on new tables
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for achievements
CREATE POLICY "Anyone can view active achievements"
  ON achievements
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create RLS policies for user_achievements
CREATE POLICY "Users can view their own achievements"
  ON user_achievements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for announcements
CREATE POLICY "Users can view active announcements targeted to their role"
  ON announcements
  FOR SELECT
  TO authenticated
  USING (
    is_active = true AND
    (SELECT role FROM users WHERE id = auth.uid()) = ANY(target_roles)
  );

-- Create RLS policies for support_tickets
CREATE POLICY "Users can view their own support tickets"
  ON support_tickets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all support tickets"
  ON support_tickets
  FOR SELECT
  TO authenticated
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Users can create support tickets"
  ON support_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for support_messages
CREATE POLICY "Users can view messages for their tickets"
  ON support_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE id = ticket_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all support messages"
  ON support_messages
  FOR SELECT
  TO authenticated
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Users can send messages for their tickets"
  ON support_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE id = ticket_id AND user_id = auth.uid()
    )
  );

-- Create RLS policies for faqs
CREATE POLICY "Anyone can view published FAQs"
  ON faqs
  FOR SELECT
  TO authenticated
  USING (is_published = true);

-- Service role policies for all tables
CREATE POLICY "Service role has full access to notifications"
  ON notifications FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to achievements"
  ON achievements FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to user_achievements"
  ON user_achievements FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to announcements"
  ON announcements FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to support_tickets"
  ON support_tickets FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to support_messages"
  ON support_messages FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to faqs"
  ON faqs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Insert sample achievements
INSERT INTO achievements (title, description, icon, badge_color, points_threshold, category, is_active)
VALUES 
  ('Points Starter', 'Earn your first 100 points', 'star', 'yellow', 100, 'points', true),
  ('Points Collector', 'Accumulate 500 points', 'star', 'yellow', 500, 'points', true),
  ('Points Master', 'Reach 1,000 points', 'star', 'yellow', 1000, 'points', true),
  ('Points Champion', 'Achieve 5,000 points', 'star', 'yellow', 5000, 'points', true),
  ('Points Legend', 'Accumulate 10,000 points', 'star', 'yellow', 10000, 'points', true);

INSERT INTO achievements (title, description, icon, badge_color, bags_threshold, category, is_active)
VALUES 
  ('First Purchase', 'Buy your first bag of cement', 'package', 'blue', 1, 'bags', true),
  ('Bulk Buyer', 'Purchase 50 bags of cement', 'package', 'blue', 50, 'bags', true),
  ('Cement Enthusiast', 'Buy 100 bags of cement', 'package', 'blue', 100, 'bags', true),
  ('Construction Pro', 'Purchase 500 bags of cement', 'package', 'blue', 500, 'bags', true),
  ('Building Legend', 'Buy 1,000 bags of cement', 'package', 'blue', 1000, 'bags', true);

INSERT INTO achievements (title, description, icon, badge_color, transactions_threshold, category, is_active)
VALUES 
  ('First Transaction', 'Complete your first transaction', 'trending-up', 'green', 1, 'transactions', true),
  ('Regular Customer', 'Complete 5 transactions', 'trending-up', 'green', 5, 'transactions', true),
  ('Loyal Customer', 'Complete 10 transactions', 'trending-up', 'green', 10, 'transactions', true),
  ('VIP Customer', 'Complete 25 transactions', 'trending-up', 'green', 25, 'transactions', true),
  ('Premium Customer', 'Complete 50 transactions', 'trending-up', 'green', 50, 'transactions', true);

-- Insert sample FAQs
INSERT INTO faqs (question, answer, category, tags, is_published, order_index)
VALUES 
  ('How do I earn points?', 'You can earn points by purchasing Tapee Cement products. For each bag of OPC cement, you earn 5 points, and for each bag of PPC cement, you earn 10 points. Submit your purchase details through the "Get Points" section, and your dealer will verify and approve your points.', 'Points', ARRAY['points', 'earning', 'purchases'], true, 1),
  
  ('How do I redeem my points?', 'To redeem your points, navigate to the "Redeem Rewards" section in your dashboard. Browse available rewards, select the one you want, and confirm your redemption. Your points will be deducted, and your reward request will be processed.', 'Rewards', ARRAY['rewards', 'redemption', 'points'], true, 2),
  
  ('What happens if my points request is rejected?', 'If your points request is rejected, you will receive a notification explaining the reason. Common reasons include incorrect information or duplicate submissions. You can submit a new request with the correct information.', 'Points', ARRAY['points', 'rejection', 'requests'], true, 3),
  
  ('How long does it take to receive my reward after redemption?', 'After your redemption request is approved, it typically takes 7-10 business days for physical rewards to be processed and shipped. Digital rewards may be processed more quickly. You can check the status of your redemption in the "Transaction History" section.', 'Rewards', ARRAY['rewards', 'delivery', 'timeline'], true, 4),
  
  ('Can I transfer my points to another user?', 'Currently, points cannot be transferred between users. Points are tied to your individual account and can only be redeemed by you.', 'Points', ARRAY['points', 'transfer', 'account'], true, 5),
  
  ('What is the difference between OPC and PPC cement?', 'OPC (Ordinary Portland Cement) is best for general construction work requiring quick setting and high early strength. PPC (Portland Pozzolana Cement) is more durable and resistant to chemical attacks, making it ideal for marine and hydraulic structures. In our loyalty program, OPC earns 5 points per bag, while PPC earns 10 points per bag.', 'Products', ARRAY['cement', 'OPC', 'PPC', 'differences'], true, 6),
  
  ('How do I update my profile information?', 'To update your profile information, navigate to the "Profile" section in your dashboard. Click on the fields you wish to update, make your changes, and click "Save Changes" to confirm.', 'Account', ARRAY['profile', 'account', 'information'], true, 7),
  
  ('What should I do if I forgot my password?', 'If you forgot your password, click on the "Forgot Password" link on the login page. Enter your registered email address, and you will receive instructions to reset your password.', 'Account', ARRAY['password', 'reset', 'login'], true, 8),
  
  ('How do I contact customer support?', 'You can contact customer support by clicking on the chat icon in the bottom right corner of the screen. Fill out the support ticket form with your issue details, and our team will respond as soon as possible.', 'Support', ARRAY['support', 'help', 'contact'], true, 9),
  
  ('Do points expire?', 'Points do not expire as long as your account remains active. However, rewards may have expiration dates, so be sure to check the details of each reward before redeeming.', 'Points', ARRAY['points', 'expiration', 'validity'], true, 10);

-- Insert sample announcement (using proper escaping)
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Get an admin user ID
  SELECT id INTO admin_user_id FROM users WHERE role = 'admin' LIMIT 1;
  
  -- Only insert if we found an admin user
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO announcements (title, content, type, target_roles, is_active, priority, starts_at, created_by)
    VALUES (
      'Welcome to the Enhanced Loyalty Program!', 
      '<p>We are excited to announce several new features to enhance your experience:</p><ul><li>Real-time notifications</li><li>Achievement system</li><li>Support chat</li><li>FAQ section</li></ul><p>Explore these features and let us know what you think!</p>', 
      'feature', 
      ARRAY['dealer', 'contractor'], 
      true, 
      'high', 
      now(), 
      admin_user_id
    );
  END IF;
END $$;