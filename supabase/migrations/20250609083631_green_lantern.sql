/*
  # Create Performance Metrics System

  1. New Tables
    - `monthly_performance` - Store monthly performance data for dealers
      - `id` (uuid, primary key)
      - `dealer_id` (uuid, foreign key to users)
      - `year` (integer)
      - `month` (integer)
      - `total_bags_sold` (integer)
      - `total_points_approved` (integer)
      - `total_transactions` (integer)
      - `unique_customers` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Functions
    - `calculate_monthly_performance()` - Calculate and store monthly performance
    - `get_performance_metrics()` - Get performance data for different periods

  3. Security
    - Enable RLS on `monthly_performance` table
    - Add policies for dealers to view their own data
    - Add policies for admins to view all data
*/

-- Create monthly_performance table
CREATE TABLE IF NOT EXISTS monthly_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  year integer NOT NULL,
  month integer NOT NULL,
  total_bags_sold integer DEFAULT 0,
  total_points_approved integer DEFAULT 0,
  total_transactions integer DEFAULT 0,
  unique_customers integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(dealer_id, year, month)
);

-- Enable RLS
ALTER TABLE monthly_performance ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Dealers can view their own performance data"
  ON monthly_performance
  FOR SELECT
  TO authenticated
  USING (dealer_id = auth.uid());

CREATE POLICY "Admins can view all performance data"
  ON monthly_performance
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_monthly_performance_dealer_id ON monthly_performance(dealer_id);
CREATE INDEX IF NOT EXISTS idx_monthly_performance_year_month ON monthly_performance(year, month);
CREATE INDEX IF NOT EXISTS idx_monthly_performance_dealer_year_month ON monthly_performance(dealer_id, year, month);

-- Function to calculate monthly performance for a dealer
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
  
  -- Calculate total points approved in the month
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_points
  FROM transactions
  WHERE dealer_id = p_dealer_id
    AND status IN ('dealer_approved', 'approved')
    AND created_at >= v_start_date
    AND created_at < v_end_date;
  
  -- Calculate total bags (points / 10)
  v_total_bags := FLOOR(v_total_points / 10);
  
  -- Calculate total transactions
  SELECT COALESCE(COUNT(*), 0)
  INTO v_total_transactions
  FROM transactions
  WHERE dealer_id = p_dealer_id
    AND created_at >= v_start_date
    AND created_at < v_end_date;
  
  -- Calculate unique customers
  SELECT COALESCE(COUNT(DISTINCT user_id), 0)
  INTO v_unique_customers
  FROM transactions
  WHERE dealer_id = p_dealer_id
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

-- Function to get performance metrics for different periods
CREATE OR REPLACE FUNCTION get_performance_metrics(
  p_dealer_id uuid,
  p_period text DEFAULT 'current_month'
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
BEGIN
  CASE p_period
    WHEN 'current_month' THEN
      RETURN QUERY
      SELECT 
        'Current Month'::text,
        COALESCE(SUM(mp.total_bags_sold), 0)::bigint,
        COALESCE(SUM(mp.total_points_approved), 0)::bigint,
        COALESCE(SUM(mp.total_transactions), 0)::bigint,
        COALESCE(SUM(mp.unique_customers), 0)::bigint,
        make_date(v_current_year, v_current_month, 1),
        (make_date(v_current_year, v_current_month, 1) + interval '1 month - 1 day')::date
      FROM monthly_performance mp
      WHERE mp.dealer_id = p_dealer_id
        AND mp.year = v_current_year
        AND mp.month = v_current_month;
    
    WHEN 'last_3_months' THEN
      RETURN QUERY
      SELECT 
        'Last 3 Months'::text,
        COALESCE(SUM(mp.total_bags_sold), 0)::bigint,
        COALESCE(SUM(mp.total_points_approved), 0)::bigint,
        COALESCE(SUM(mp.total_transactions), 0)::bigint,
        COALESCE(SUM(mp.unique_customers), 0)::bigint,
        (v_current_date - interval '3 months')::date,
        v_current_date
      FROM monthly_performance mp
      WHERE mp.dealer_id = p_dealer_id
        AND (
          (mp.year = v_current_year AND mp.month >= v_current_month - 2) OR
          (mp.year = v_current_year - 1 AND mp.month >= 12 - (2 - v_current_month))
        );
    
    WHEN 'last_6_months' THEN
      RETURN QUERY
      SELECT 
        'Last 6 Months'::text,
        COALESCE(SUM(mp.total_bags_sold), 0)::bigint,
        COALESCE(SUM(mp.total_points_approved), 0)::bigint,
        COALESCE(SUM(mp.total_transactions), 0)::bigint,
        COALESCE(SUM(mp.unique_customers), 0)::bigint,
        (v_current_date - interval '6 months')::date,
        v_current_date
      FROM monthly_performance mp
      WHERE mp.dealer_id = p_dealer_id
        AND (
          (mp.year = v_current_year AND mp.month >= v_current_month - 5) OR
          (mp.year = v_current_year - 1 AND mp.month >= 12 - (5 - v_current_month))
        );
    
    WHEN 'yearly' THEN
      RETURN QUERY
      SELECT 
        'This Year'::text,
        COALESCE(SUM(mp.total_bags_sold), 0)::bigint,
        COALESCE(SUM(mp.total_points_approved), 0)::bigint,
        COALESCE(SUM(mp.total_transactions), 0)::bigint,
        COALESCE(SUM(mp.unique_customers), 0)::bigint,
        make_date(v_current_year, 1, 1),
        make_date(v_current_year, 12, 31)
      FROM monthly_performance mp
      WHERE mp.dealer_id = p_dealer_id
        AND mp.year = v_current_year;
    
    ELSE
      -- Default to current month
      RETURN QUERY
      SELECT 
        'Current Month'::text,
        COALESCE(SUM(mp.total_bags_sold), 0)::bigint,
        COALESCE(SUM(mp.total_points_approved), 0)::bigint,
        COALESCE(SUM(mp.total_transactions), 0)::bigint,
        COALESCE(SUM(mp.unique_customers), 0)::bigint,
        make_date(v_current_year, v_current_month, 1),
        (make_date(v_current_year, v_current_month, 1) + interval '1 month - 1 day')::date
      FROM monthly_performance mp
      WHERE mp.dealer_id = p_dealer_id
        AND mp.year = v_current_year
        AND mp.month = v_current_month;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update monthly performance for all dealers (to be called monthly)
CREATE OR REPLACE FUNCTION update_all_monthly_performance() RETURNS void AS $$
DECLARE
  dealer_record RECORD;
  v_current_year integer := EXTRACT(YEAR FROM CURRENT_DATE);
  v_current_month integer := EXTRACT(MONTH FROM CURRENT_DATE);
BEGIN
  -- Loop through all dealers
  FOR dealer_record IN 
    SELECT id FROM users WHERE role = 'dealer'
  LOOP
    PERFORM calculate_monthly_performance(
      dealer_record.id,
      v_current_year,
      v_current_month
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update monthly performance when transactions change
CREATE OR REPLACE FUNCTION trigger_update_monthly_performance() RETURNS trigger AS $$
DECLARE
  v_year integer;
  v_month integer;
BEGIN
  -- Get year and month from the transaction
  IF TG_OP = 'DELETE' THEN
    v_year := EXTRACT(YEAR FROM OLD.created_at);
    v_month := EXTRACT(MONTH FROM OLD.created_at);
    
    IF OLD.dealer_id IS NOT NULL THEN
      PERFORM calculate_monthly_performance(OLD.dealer_id, v_year, v_month);
    END IF;
    
    RETURN OLD;
  ELSE
    v_year := EXTRACT(YEAR FROM NEW.created_at);
    v_month := EXTRACT(MONTH FROM NEW.created_at);
    
    IF NEW.dealer_id IS NOT NULL THEN
      PERFORM calculate_monthly_performance(NEW.dealer_id, v_year, v_month);
    END IF;
    
    -- Also update old month if transaction was moved
    IF TG_OP = 'UPDATE' AND OLD.created_at != NEW.created_at THEN
      v_year := EXTRACT(YEAR FROM OLD.created_at);
      v_month := EXTRACT(MONTH FROM OLD.created_at);
      PERFORM calculate_monthly_performance(NEW.dealer_id, v_year, v_month);
    END IF;
    
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_monthly_performance_trigger ON transactions;
CREATE TRIGGER update_monthly_performance_trigger
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_monthly_performance();

-- Initialize current month data for existing dealers
DO $$
DECLARE
  dealer_record RECORD;
  v_current_year integer := EXTRACT(YEAR FROM CURRENT_DATE);
  v_current_month integer := EXTRACT(MONTH FROM CURRENT_DATE);
BEGIN
  FOR dealer_record IN 
    SELECT id FROM users WHERE role = 'dealer'
  LOOP
    PERFORM calculate_monthly_performance(
      dealer_record.id,
      v_current_year,
      v_current_month
    );
  END LOOP;
END $$;