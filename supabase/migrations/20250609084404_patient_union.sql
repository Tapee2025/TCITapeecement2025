/*
  # Enhanced Performance Metrics with Custom Periods

  1. Functions
    - Enhanced get_performance_metrics function with month names and custom periods
    - New get_lifetime_performance function for all-time metrics
    - New get_custom_period_performance function for date range queries

  2. Features
    - Month names instead of "this month"
    - Custom date range support
    - Lifetime/all-time performance metrics
    - Better period labeling
*/

-- Enhanced function to get performance metrics with proper month names and custom periods
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
      -- Get all-time performance from transactions directly
      RETURN QUERY
      SELECT 
        'Lifetime'::text,
        COALESCE(FLOOR(SUM(CASE WHEN t.status IN ('dealer_approved', 'approved') THEN t.amount ELSE 0 END) / 10), 0)::bigint,
        COALESCE(SUM(CASE WHEN t.status IN ('dealer_approved', 'approved') THEN t.amount ELSE 0 END), 0)::bigint,
        COALESCE(COUNT(*), 0)::bigint,
        COALESCE(COUNT(DISTINCT t.user_id), 0)::bigint,
        (SELECT MIN(created_at)::date FROM transactions WHERE dealer_id = p_dealer_id),
        v_current_date
      FROM transactions t
      WHERE t.dealer_id = p_dealer_id;
    
    WHEN 'custom' THEN
      -- Use provided start and end dates
      IF p_start_date IS NULL OR p_end_date IS NULL THEN
        RAISE EXCEPTION 'Start date and end date must be provided for custom period';
      END IF;
      
      RETURN QUERY
      SELECT 
        ('Custom Period (' || p_start_date::text || ' to ' || p_end_date::text || ')')::text,
        COALESCE(FLOOR(SUM(CASE WHEN t.status IN ('dealer_approved', 'approved') THEN t.amount ELSE 0 END) / 10), 0)::bigint,
        COALESCE(SUM(CASE WHEN t.status IN ('dealer_approved', 'approved') THEN t.amount ELSE 0 END), 0)::bigint,
        COALESCE(COUNT(*), 0)::bigint,
        COALESCE(COUNT(DISTINCT t.user_id), 0)::bigint,
        p_start_date,
        p_end_date
      FROM transactions t
      WHERE t.dealer_id = p_dealer_id
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

-- Function to get monthly breakdown for a year
CREATE OR REPLACE FUNCTION get_monthly_breakdown(
  p_dealer_id uuid,
  p_year integer DEFAULT NULL
) RETURNS TABLE (
  month_name text,
  month_number integer,
  year integer,
  total_bags_sold integer,
  total_points_approved integer,
  total_transactions integer,
  unique_customers integer
) AS $$
DECLARE
  v_year integer := COALESCE(p_year, EXTRACT(YEAR FROM CURRENT_DATE));
BEGIN
  RETURN QUERY
  SELECT 
    to_char(make_date(mp.year, mp.month, 1), 'Month')::text,
    mp.month,
    mp.year,
    mp.total_bags_sold,
    mp.total_points_approved,
    mp.total_transactions,
    mp.unique_customers
  FROM monthly_performance mp
  WHERE mp.dealer_id = p_dealer_id
    AND mp.year = v_year
  ORDER BY mp.month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get performance comparison between periods
CREATE OR REPLACE FUNCTION get_performance_comparison(
  p_dealer_id uuid
) RETURNS TABLE (
  current_month_name text,
  current_month_bags integer,
  last_month_bags integer,
  bags_change integer,
  bags_change_percent numeric,
  current_month_points integer,
  last_month_points integer,
  points_change integer,
  points_change_percent numeric
) AS $$
DECLARE
  v_current_date date := CURRENT_DATE;
  v_current_year integer := EXTRACT(YEAR FROM v_current_date);
  v_current_month integer := EXTRACT(MONTH FROM v_current_date);
  v_last_month integer;
  v_last_year integer;
  v_current_month_name text;
  v_current_bags integer := 0;
  v_last_bags integer := 0;
  v_current_points integer := 0;
  v_last_points integer := 0;
BEGIN
  -- Calculate last month and year
  IF v_current_month = 1 THEN
    v_last_month := 12;
    v_last_year := v_current_year - 1;
  ELSE
    v_last_month := v_current_month - 1;
    v_last_year := v_current_year;
  END IF;
  
  -- Get current month name
  v_current_month_name := trim(to_char(v_current_date, 'Month YYYY'));
  
  -- Get current month data
  SELECT COALESCE(mp.total_bags_sold, 0), COALESCE(mp.total_points_approved, 0)
  INTO v_current_bags, v_current_points
  FROM monthly_performance mp
  WHERE mp.dealer_id = p_dealer_id
    AND mp.year = v_current_year
    AND mp.month = v_current_month;
  
  -- Get last month data
  SELECT COALESCE(mp.total_bags_sold, 0), COALESCE(mp.total_points_approved, 0)
  INTO v_last_bags, v_last_points
  FROM monthly_performance mp
  WHERE mp.dealer_id = p_dealer_id
    AND mp.year = v_last_year
    AND mp.month = v_last_month;
  
  RETURN QUERY
  SELECT 
    v_current_month_name,
    v_current_bags,
    v_last_bags,
    (v_current_bags - v_last_bags),
    CASE 
      WHEN v_last_bags = 0 THEN 0
      ELSE ROUND(((v_current_bags - v_last_bags)::numeric / v_last_bags::numeric) * 100, 2)
    END,
    v_current_points,
    v_last_points,
    (v_current_points - v_last_points),
    CASE 
      WHEN v_last_points = 0 THEN 0
      ELSE ROUND(((v_current_points - v_last_points)::numeric / v_last_points::numeric) * 100, 2)
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;