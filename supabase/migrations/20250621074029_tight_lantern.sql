/*
  # Correct Dealer Performance Metrics

  1. Changes
    - Update performance calculation to track dealer's own point requests
    - Dealer performance = bags they requested points for (their sales to customers)
    - Fix the logic to show dealer's business performance correctly

  2. Performance Logic
    - Dealers sell bags to customers
    - Dealers request points from admin for bags sold
    - Performance metrics show dealer's point requests (their sales volume)
*/

-- Update the calculate_monthly_performance function to track dealer's own requests
CREATE OR REPLACE FUNCTION calculate_monthly_performance(
  p_dealer_id uuid,
  p_year integer,
  p_month integer
) RETURNS void AS $$
DECLARE
  v_start_date timestamptz;
  v_end_date timestamptz;
  v_total_bags integer;
  v_total_points integer;
  v_total_transactions integer;
  v_unique_customers integer;
BEGIN
  -- Calculate date range for the month
  v_start_date := make_date(p_year, p_month, 1);
  v_end_date := v_start_date + interval '1 month';
  
  -- Calculate total points requested BY the dealer (their sales to customers)
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_points
  FROM transactions
  WHERE user_id = p_dealer_id  -- Dealer's own requests
    AND type = 'earned'  -- Points earned requests
    AND status IN ('pending', 'dealer_approved', 'approved')
    AND created_at >= v_start_date
    AND created_at < v_end_date;
  
  -- Calculate total bags (points / 10) - bags dealer sold to customers
  v_total_bags := FLOOR(v_total_points / 10);
  
  -- Calculate total transactions (dealer's own requests)
  SELECT COALESCE(COUNT(*), 0)
  INTO v_total_transactions
  FROM transactions
  WHERE user_id = p_dealer_id  -- Dealer's own requests
    AND type = 'earned'
    AND created_at >= v_start_date
    AND created_at < v_end_date;
  
  -- Calculate unique customers who made requests through this dealer
  SELECT COALESCE(COUNT(DISTINCT user_id), 0)
  INTO v_unique_customers
  FROM transactions
  WHERE dealer_id = p_dealer_id
    AND type = 'earned'
    AND user_id != p_dealer_id  -- Exclude dealer's own requests
    AND created_at >= v_start_date
    AND created_at < v_end_date;
  
  -- Insert or update monthly performance
  INSERT INTO monthly_performance (
    dealer_id, year, month, total_bags_sold, total_points_approved,
    total_transactions, unique_customers, updated_at
  )
  VALUES (
    p_dealer_id, p_year, p_month, v_total_bags, v_total_points,
    v_total_transactions, v_unique_customers, now()
  )
  ON CONFLICT (dealer_id, year, month)
  DO UPDATE SET
    total_bags_sold = EXCLUDED.total_bags_sold,
    total_points_approved = EXCLUDED.total_points_approved,
    total_transactions = EXCLUDED.total_transactions,
    unique_customers = EXCLUDED.unique_customers,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the get_performance_metrics function to track dealer's own requests
CREATE OR REPLACE FUNCTION get_performance_metrics(
  p_dealer_id uuid,
  p_period text DEFAULT 'current_month',
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
) RETURNS TABLE (
  period_label text,
  total_bags_sold bigint,
  total_points_approved bigint,
  total_transactions bigint,
  unique_customers bigint,
  period_start date,
  period_end date
) AS $$
DECLARE
  v_current_date date := CURRENT_DATE;
  v_current_year integer := EXTRACT(YEAR FROM v_current_date);
  v_current_month integer := EXTRACT(MONTH FROM v_current_date);
  v_month_name text;
  v_start_date date;
  v_end_date date;
BEGIN
  -- Get current month name
  v_month_name := to_char(v_current_date, 'Month YYYY');
  
  CASE p_period
    WHEN 'current_month' THEN
      v_start_date := make_date(v_current_year, v_current_month, 1);
      v_end_date := (v_start_date + interval '1 month - 1 day')::date;
      
      RETURN QUERY
      SELECT 
        trim(v_month_name)::text,
        COALESCE(SUM(mp.total_bags_sold), 0)::bigint,
        COALESCE(SUM(mp.total_points_approved), 0)::bigint,
        COALESCE(SUM(mp.total_transactions), 0)::bigint,
        COALESCE(SUM(mp.unique_customers), 0)::bigint,
        v_start_date,
        v_end_date
      FROM monthly_performance mp
      WHERE mp.dealer_id = p_dealer_id
        AND mp.year = v_current_year
        AND mp.month = v_current_month;
    
    WHEN 'last_3_months' THEN
      v_start_date := (v_current_date - interval '3 months')::date;
      v_end_date := v_current_date;
      
      RETURN QUERY
      SELECT 
        'Last 3 Months'::text,
        COALESCE(SUM(mp.total_bags_sold), 0)::bigint,
        COALESCE(SUM(mp.total_points_approved), 0)::bigint,
        COALESCE(SUM(mp.total_transactions), 0)::bigint,
        COALESCE(SUM(mp.unique_customers), 0)::bigint,
        v_start_date,
        v_end_date
      FROM monthly_performance mp
      WHERE mp.dealer_id = p_dealer_id
        AND mp.created_at >= v_start_date
        AND mp.created_at <= v_end_date;
    
    WHEN 'last_6_months' THEN
      v_start_date := (v_current_date - interval '6 months')::date;
      v_end_date := v_current_date;
      
      RETURN QUERY
      SELECT 
        'Last 6 Months'::text,
        COALESCE(SUM(mp.total_bags_sold), 0)::bigint,
        COALESCE(SUM(mp.total_points_approved), 0)::bigint,
        COALESCE(SUM(mp.total_transactions), 0)::bigint,
        COALESCE(SUM(mp.unique_customers), 0)::bigint,
        v_start_date,
        v_end_date
      FROM monthly_performance mp
      WHERE mp.dealer_id = p_dealer_id
        AND mp.created_at >= v_start_date
        AND mp.created_at <= v_end_date;
    
    WHEN 'yearly' THEN
      v_start_date := make_date(v_current_year, 1, 1);
      v_end_date := make_date(v_current_year, 12, 31);
      
      RETURN QUERY
      SELECT 
        (v_current_year::text)::text,
        COALESCE(SUM(mp.total_bags_sold), 0)::bigint,
        COALESCE(SUM(mp.total_points_approved), 0)::bigint,
        COALESCE(SUM(mp.total_transactions), 0)::bigint,
        COALESCE(SUM(mp.unique_customers), 0)::bigint,
        v_start_date,
        v_end_date
      FROM monthly_performance mp
      WHERE mp.dealer_id = p_dealer_id
        AND mp.year = v_current_year;
    
    WHEN 'lifetime' THEN
      -- Get all-time performance from dealer's own requests
      RETURN QUERY
      SELECT 
        'Lifetime'::text,
        COALESCE(FLOOR(SUM(CASE WHEN t.status IN ('pending', 'dealer_approved', 'approved') AND t.type = 'earned' THEN t.amount ELSE 0 END) / 10), 0)::bigint,
        COALESCE(SUM(CASE WHEN t.status IN ('pending', 'dealer_approved', 'approved') AND t.type = 'earned' THEN t.amount ELSE 0 END), 0)::bigint,
        COALESCE(COUNT(CASE WHEN t.type = 'earned' THEN 1 END), 0)::bigint,
        COALESCE((SELECT COUNT(DISTINCT user_id) FROM transactions WHERE dealer_id = p_dealer_id AND type = 'earned' AND user_id != p_dealer_id), 0)::bigint,
        (SELECT MIN(created_at)::date FROM transactions WHERE user_id = p_dealer_id AND type = 'earned'),
        v_current_date
      FROM transactions t
      WHERE t.user_id = p_dealer_id;  -- Dealer's own requests
    
    WHEN 'custom' THEN
      -- Use provided start and end dates for dealer's own requests
      IF p_start_date IS NULL OR p_end_date IS NULL THEN
        RAISE EXCEPTION 'Start date and end date must be provided for custom period';
      END IF;
      
      RETURN QUERY
      SELECT 
        ('Custom Period (' || p_start_date::text || ' to ' || p_end_date::text || ')')::text,
        COALESCE(FLOOR(SUM(CASE WHEN t.status IN ('pending', 'dealer_approved', 'approved') AND t.type = 'earned' THEN t.amount ELSE 0 END) / 10), 0)::bigint,
        COALESCE(SUM(CASE WHEN t.status IN ('pending', 'dealer_approved', 'approved') AND t.type = 'earned' THEN t.amount ELSE 0 END), 0)::bigint,
        COALESCE(COUNT(CASE WHEN t.type = 'earned' THEN 1 END), 0)::bigint,
        COALESCE((SELECT COUNT(DISTINCT user_id) FROM transactions WHERE dealer_id = p_dealer_id AND type = 'earned' AND user_id != p_dealer_id AND created_at::date >= p_start_date AND created_at::date <= p_end_date), 0)::bigint,
        p_start_date,
        p_end_date
      FROM transactions t
      WHERE t.user_id = p_dealer_id  -- Dealer's own requests
        AND t.created_at::date >= p_start_date
        AND t.created_at::date <= p_end_date;
    
    ELSE
      -- Default to current month
      v_start_date := make_date(v_current_year, v_current_month, 1);
      v_end_date := (v_start_date + interval '1 month - 1 day')::date;
      
      RETURN QUERY
      SELECT 
        trim(v_month_name)::text,
        COALESCE(SUM(mp.total_bags_sold), 0)::bigint,
        COALESCE(SUM(mp.total_points_approved), 0)::bigint,
        COALESCE(SUM(mp.total_transactions), 0)::bigint,
        COALESCE(SUM(mp.unique_customers), 0)::bigint,
        v_start_date,
        v_end_date
      FROM monthly_performance mp
      WHERE mp.dealer_id = p_dealer_id
        AND mp.year = v_current_year
        AND mp.month = v_current_month;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the trigger function to track dealer's own requests
CREATE OR REPLACE FUNCTION trigger_update_monthly_performance() RETURNS trigger AS $$
DECLARE
  v_year integer;
  v_month integer;
  v_dealer_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_year := EXTRACT(YEAR FROM OLD.created_at);
    v_month := EXTRACT(MONTH FROM OLD.created_at);
    
    -- Update performance if this was a dealer's own request
    SELECT id INTO v_dealer_id FROM users WHERE id = OLD.user_id AND role = 'dealer';
    IF v_dealer_id IS NOT NULL AND OLD.type = 'earned' THEN
      PERFORM calculate_monthly_performance(v_dealer_id, v_year, v_month);
    END IF;
    
    RETURN OLD;
  ELSE
    v_year := EXTRACT(YEAR FROM NEW.created_at);
    v_month := EXTRACT(MONTH FROM NEW.created_at);
    
    -- Update performance if this is a dealer's own request
    SELECT id INTO v_dealer_id FROM users WHERE id = NEW.user_id AND role = 'dealer';
    IF v_dealer_id IS NOT NULL AND NEW.type = 'earned' THEN
      PERFORM calculate_monthly_performance(v_dealer_id, v_year, v_month);
    END IF;
    
    -- Also update old month if transaction was moved
    IF TG_OP = 'UPDATE' AND OLD.created_at != NEW.created_at THEN
      v_year := EXTRACT(YEAR FROM OLD.created_at);
      v_month := EXTRACT(MONTH FROM OLD.created_at);
      SELECT id INTO v_dealer_id FROM users WHERE id = OLD.user_id AND role = 'dealer';
      IF v_dealer_id IS NOT NULL AND OLD.type = 'earned' THEN
        PERFORM calculate_monthly_performance(v_dealer_id, v_year, v_month);
      END IF;
    END IF;
    
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Recalculate all existing monthly performance data with the corrected logic
DO $$
DECLARE
  dealer_record RECORD;
  v_current_year integer := EXTRACT(YEAR FROM CURRENT_DATE);
  v_current_month integer := EXTRACT(MONTH FROM CURRENT_DATE);
  v_month integer;
  v_year integer;
BEGIN
  -- Clear existing monthly performance data to recalculate correctly
  DELETE FROM monthly_performance;
  
  -- Recalculate for all dealers for the past 12 months
  FOR dealer_record IN 
    SELECT id FROM users WHERE role = 'dealer'
  LOOP
    -- Calculate for past 12 months
    FOR i IN 0..11 LOOP
      v_year := EXTRACT(YEAR FROM (CURRENT_DATE - (i || ' months')::interval));
      v_month := EXTRACT(MONTH FROM (CURRENT_DATE - (i || ' months')::interval));
      
      PERFORM calculate_monthly_performance(
        dealer_record.id,
        v_year,
        v_month
      );
    END LOOP;
  END LOOP;
END $$;