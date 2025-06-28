/*
  # Fix Analytics RPC Function

  1. Drop existing function if it exists
  2. Create new get_analytics_data function with correct return type
  3. Grant permissions to authenticated users

  This function provides analytics data for both admin and dealer views.
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_analytics_data(timestamptz, timestamptz, uuid);

-- Create the analytics function
CREATE OR REPLACE FUNCTION get_analytics_data(
  p_start_date timestamptz,
  p_end_date timestamptz,
  p_dealer_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  total_users_count integer;
  active_users_count integer;
  new_registrations_count integer;
  total_transactions_count integer;
  total_points_issued_sum integer;
  total_bags_sold_sum integer;
  total_rewards_redeemed_count integer;
  user_engagement_rate_calc numeric;
  top_dealers jsonb;
  popular_rewards_data jsonb;
BEGIN
  -- Calculate total users (filtered by dealer if specified)
  IF p_dealer_id IS NOT NULL THEN
    SELECT COUNT(*)
    INTO total_users_count
    FROM users
    WHERE created_by = p_dealer_id OR id = p_dealer_id;
  ELSE
    SELECT COUNT(*)
    INTO total_users_count
    FROM users;
  END IF;

  -- Calculate active users (users with transactions in the period)
  IF p_dealer_id IS NOT NULL THEN
    SELECT COUNT(DISTINCT u.id)
    INTO active_users_count
    FROM users u
    INNER JOIN transactions t ON u.id = t.user_id
    WHERE t.created_at >= p_start_date 
      AND t.created_at <= p_end_date
      AND (u.created_by = p_dealer_id OR u.id = p_dealer_id);
  ELSE
    SELECT COUNT(DISTINCT user_id)
    INTO active_users_count
    FROM transactions
    WHERE created_at >= p_start_date AND created_at <= p_end_date;
  END IF;

  -- Calculate new registrations in the period
  IF p_dealer_id IS NOT NULL THEN
    SELECT COUNT(*)
    INTO new_registrations_count
    FROM users
    WHERE created_at >= p_start_date 
      AND created_at <= p_end_date
      AND (created_by = p_dealer_id OR id = p_dealer_id);
  ELSE
    SELECT COUNT(*)
    INTO new_registrations_count
    FROM users
    WHERE created_at >= p_start_date AND created_at <= p_end_date;
  END IF;

  -- Calculate transaction metrics
  IF p_dealer_id IS NOT NULL THEN
    SELECT 
      COUNT(*),
      COALESCE(SUM(CASE WHEN type = 'earned' THEN amount ELSE 0 END), 0),
      COUNT(CASE WHEN type = 'redeemed' THEN 1 END)
    INTO 
      total_transactions_count,
      total_points_issued_sum,
      total_rewards_redeemed_count
    FROM transactions t
    INNER JOIN users u ON t.user_id = u.id
    WHERE t.created_at >= p_start_date 
      AND t.created_at <= p_end_date
      AND (u.created_by = p_dealer_id OR u.id = p_dealer_id);
  ELSE
    SELECT 
      COUNT(*),
      COALESCE(SUM(CASE WHEN type = 'earned' THEN amount ELSE 0 END), 0),
      COUNT(CASE WHEN type = 'redeemed' THEN 1 END)
    INTO 
      total_transactions_count,
      total_points_issued_sum,
      total_rewards_redeemed_count
    FROM transactions
    WHERE created_at >= p_start_date AND created_at <= p_end_date;
  END IF;

  -- Calculate total bags sold from monthly performance or estimate from points
  IF p_dealer_id IS NOT NULL THEN
    SELECT COALESCE(SUM(total_bags_sold), 0)
    INTO total_bags_sold_sum
    FROM monthly_performance
    WHERE dealer_id = p_dealer_id
      AND (year * 100 + month) >= EXTRACT(YEAR FROM p_start_date) * 100 + EXTRACT(MONTH FROM p_start_date)
      AND (year * 100 + month) <= EXTRACT(YEAR FROM p_end_date) * 100 + EXTRACT(MONTH FROM p_end_date);
  ELSE
    SELECT COALESCE(SUM(total_bags_sold), 0)
    INTO total_bags_sold_sum
    FROM monthly_performance
    WHERE (year * 100 + month) >= EXTRACT(YEAR FROM p_start_date) * 100 + EXTRACT(MONTH FROM p_start_date)
      AND (year * 100 + month) <= EXTRACT(YEAR FROM p_end_date) * 100 + EXTRACT(MONTH FROM p_end_date);
  END IF;

  -- If no monthly performance data, estimate from points (assuming 1 bag = 10 points)
  IF total_bags_sold_sum = 0 THEN
    total_bags_sold_sum := COALESCE(total_points_issued_sum / 10, 0);
  END IF;

  -- Calculate user engagement rate
  IF total_users_count > 0 THEN
    user_engagement_rate_calc := ROUND((active_users_count::numeric / total_users_count::numeric) * 100, 2);
  ELSE
    user_engagement_rate_calc := 0;
  END IF;

  -- Get top performing dealers (only for admin view)
  IF p_dealer_id IS NULL THEN
    SELECT jsonb_agg(
      jsonb_build_object(
        'dealer_id', u.id,
        'name', u.first_name || ' ' || u.last_name,
        'points_issued', COALESCE(SUM(t.amount), 0),
        'bags_sold', COALESCE(mp.total_bags_sold, 0)
      ) ORDER BY COALESCE(SUM(t.amount), 0) DESC
    )
    INTO top_dealers
    FROM users u
    LEFT JOIN transactions t ON u.id = t.dealer_id 
      AND t.created_at >= p_start_date 
      AND t.created_at <= p_end_date
      AND t.type = 'earned'
    LEFT JOIN (
      SELECT dealer_id, SUM(total_bags_sold) as total_bags_sold
      FROM monthly_performance
      WHERE (year * 100 + month) >= EXTRACT(YEAR FROM p_start_date) * 100 + EXTRACT(MONTH FROM p_start_date)
        AND (year * 100 + month) <= EXTRACT(YEAR FROM p_end_date) * 100 + EXTRACT(MONTH FROM p_end_date)
      GROUP BY dealer_id
    ) mp ON u.id = mp.dealer_id
    WHERE u.role = 'dealer'
    GROUP BY u.id, u.first_name, u.last_name, mp.total_bags_sold
    LIMIT 10;
  ELSE
    top_dealers := '[]'::jsonb;
  END IF;

  -- Get popular rewards
  SELECT jsonb_agg(
    jsonb_build_object(
      'reward_id', r.id,
      'title', r.title,
      'redemption_count', COUNT(t.id)
    ) ORDER BY COUNT(t.id) DESC
  )
  INTO popular_rewards_data
  FROM rewards r
  INNER JOIN transactions t ON r.id = t.reward_id
  WHERE t.created_at >= p_start_date 
    AND t.created_at <= p_end_date
    AND t.type = 'redeemed'
  GROUP BY r.id, r.title
  LIMIT 10;

  -- Build final result
  result := jsonb_build_object(
    'total_users', total_users_count,
    'active_users', active_users_count,
    'new_registrations', new_registrations_count,
    'total_transactions', total_transactions_count,
    'total_points_issued', total_points_issued_sum,
    'total_bags_sold', total_bags_sold_sum,
    'total_rewards_redeemed', total_rewards_redeemed_count,
    'user_engagement_rate', user_engagement_rate_calc,
    'top_performing_dealers', COALESCE(top_dealers, '[]'::jsonb),
    'popular_rewards', COALESCE(popular_rewards_data, '[]'::jsonb)
  );

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_analytics_data(timestamptz, timestamptz, uuid) TO authenticated;