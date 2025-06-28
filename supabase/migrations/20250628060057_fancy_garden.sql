/*
  # Fix bag calculation functions and performance metrics

  1. Functions
    - `calculate_bags_from_transaction` - Calculate bags based on cement type
    - `calculate_monthly_performance` - Calculate monthly performance with proper bag counting
    - `get_performance_metrics` - Get performance metrics with corrected bag calculation

  2. Data Migration
    - Recalculate all existing monthly performance data with corrected logic
*/

-- Function to calculate bags from transaction description and points
CREATE OR REPLACE FUNCTION calculate_bags_from_transaction(
  p_description text,
  p_points integer
) RETURNS integer AS $$
BEGIN
  -- Check if description contains cement type
  IF p_description ILIKE '%OPC%' THEN
    RETURN FLOOR(p_points / 5); -- OPC cement: 5 points per bag
  ELSIF p_description ILIKE '%PPC%' THEN
    RETURN FLOOR(p_points / 10); -- PPC cement: 10 points per bag
  ELSE
    -- Legacy transactions without cement type - assume PPC
    RETURN FLOOR(p_points / 10);
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update the calculate_monthly_performance function to use proper bag calculation
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
  transaction_record RECORD;
BEGIN
  -- Calculate date range for the month
  v_start_date := make_date(p_year, p_month, 1);
  v_end_date := v_start_date + interval '1 month';
  
  -- Initialize counters
  v_total_bags := 0;
  v_total_points := 0;
  v_total_transactions := 0;
  v_unique_customers := 0;
  
  -- Calculate total points requested BY the dealer (their sales to customers)
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_points
  FROM transactions
  WHERE user_id = p_dealer_id  -- Dealer's own requests
    AND type = 'earned'  -- Points earned requests
    AND status IN ('pending', 'dealer_approved', 'approved')
    AND created_at >= v_start_date
    AND created_at < v_end_date;
  
  -- Calculate total bags based on cement type in description
  FOR transaction_record IN
    SELECT amount, description
    FROM transactions
    WHERE user_id = p_dealer_id  -- Dealer's own requests
      AND type = 'earned'
      AND status IN ('pending', 'dealer_approved', 'approved')
      AND created_at >= v_start_date
      AND created_at < v_end_date
  LOOP
    v_total_bags := v_total_bags + calculate_bags_from_transaction(
      transaction_record.description,
      transaction_record.amount
    );
  END LOOP;
  
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

-- Update the get_performance_metrics function to use proper bag calculation
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
  v_total_bags bigint := 0;
  v_total_points bigint := 0;
  v_total_transactions bigint := 0;
  v_unique_customers bigint := 0;
  transaction_record RECORD;
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
      -- Get all-time performance from dealer's own requests with proper bag calculation
      -- First get total points and other metrics
      SELECT 
        COALESCE(SUM(CASE WHEN t.status IN ('pending', 'dealer_approved', 'approved') AND t.type = 'earned' THEN t.amount ELSE 0 END), 0),
        COALESCE(COUNT(CASE WHEN t.type = 'earned' THEN 1 END), 0),
        COALESCE((SELECT MIN(created_at)::date FROM transactions WHERE user_id = p_dealer_id AND type = 'earned'), v_current_date)
      INTO 
        v_total_points,
        v_total_transactions,
        v_start_date
      FROM transactions t
      WHERE t.user_id = p_dealer_id;  -- Dealer's own requests
      
      -- Get unique customers count separately
      SELECT COALESCE(COUNT(DISTINCT user_id), 0)
      INTO v_unique_customers
      FROM transactions 
      WHERE dealer_id = p_dealer_id 
        AND type = 'earned' 
        AND user_id != p_dealer_id;
      
      -- Calculate bags based on cement type
      FOR transaction_record IN
        SELECT amount, description
        FROM transactions
        WHERE user_id = p_dealer_id  -- Dealer's own requests
          AND type = 'earned'
          AND status IN ('pending', 'dealer_approved', 'approved')
      LOOP
        v_total_bags := v_total_bags + calculate_bags_from_transaction(
          transaction_record.description,
          transaction_record.amount
        );
      END LOOP;
      
      v_end_date := v_current_date;
      
      RETURN QUERY
      SELECT 
        'Lifetime'::text,
        v_total_bags,
        v_total_points,
        v_total_transactions,
        v_unique_customers,
        v_start_date,
        v_end_date;
    
    WHEN 'custom' THEN
      -- Use provided start and end dates for dealer's own requests
      IF p_start_date IS NULL OR p_end_date IS NULL THEN
        RAISE EXCEPTION 'Start date and end date must be provided for custom period';
      END IF;
      
      -- First get total points and other metrics
      SELECT 
        COALESCE(SUM(CASE WHEN t.status IN ('pending', 'dealer_approved', 'approved') AND t.type = 'earned' THEN t.amount ELSE 0 END), 0),
        COALESCE(COUNT(CASE WHEN t.type = 'earned' THEN 1 END), 0)
      INTO 
        v_total_points,
        v_total_transactions
      FROM transactions t
      WHERE t.user_id = p_dealer_id  -- Dealer's own requests
        AND t.created_at::date >= p_start_date
        AND t.created_at::date <= p_end_date;
      
      -- Get unique customers count for custom period
      SELECT COALESCE(COUNT(DISTINCT user_id), 0)
      INTO v_unique_customers
      FROM transactions 
      WHERE dealer_id = p_dealer_id 
        AND type = 'earned' 
        AND user_id != p_dealer_id 
        AND created_at::date >= p_start_date 
        AND created_at::date <= p_end_date;
      
      -- Calculate bags based on cement type
      FOR transaction_record IN
        SELECT amount, description
        FROM transactions
        WHERE user_id = p_dealer_id  -- Dealer's own requests
          AND type = 'earned'
          AND status IN ('pending', 'dealer_approved', 'approved')
          AND created_at::date >= p_start_date
          AND created_at::date <= p_end_date
      LOOP
        v_total_bags := v_total_bags + calculate_bags_from_transaction(
          transaction_record.description,
          transaction_record.amount
        );
      END LOOP;
      
      RETURN QUERY
      SELECT 
        ('Custom Period (' || p_start_date::text || ' to ' || p_end_date::text || ')')::text,
        v_total_bags,
        v_total_points,
        v_total_transactions,
        v_unique_customers,
        p_start_date,
        p_end_date;
    
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