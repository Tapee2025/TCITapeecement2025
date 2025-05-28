/*
  # Initial Schema Setup for Tapee Cement Loyalty Program

  1. New Tables
    - users
      - id (uuid, primary key)
      - email (text, unique)
      - first_name (text)
      - last_name (text)
      - role (text)
      - city (text)
      - address (text)
      - district (text)
      - gst_number (text, optional)
      - mobile_number (text)
      - user_code (text, unique)
      - points (integer)
      - created_at (timestamp)
      - updated_at (timestamp)
    
    - rewards
      - id (uuid, primary key)
      - title (text)
      - description (text)
      - image_url (text)
      - points_required (integer)
      - available (boolean)
      - expiry_date (timestamp)
      - created_at (timestamp)
      - updated_at (timestamp)
    
    - transactions
      - id (uuid, primary key)
      - user_id (uuid, references users)
      - type (text)
      - amount (integer)
      - description (text)
      - status (text)
      - dealer_id (uuid, references users)
      - reward_id (uuid, references rewards)
      - created_at (timestamp)
      - updated_at (timestamp)
    
    - marketing_slides
      - id (uuid, primary key)
      - image_url (text)
      - title (text)
      - active (boolean)
      - order_number (integer)
      - created_at (timestamp)
      - updated_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('builder', 'dealer', 'contractor', 'admin')),
  city text NOT NULL,
  address text NOT NULL,
  district text NOT NULL,
  gst_number text,
  mobile_number text NOT NULL,
  user_code text UNIQUE NOT NULL,
  points integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Rewards table
CREATE TABLE IF NOT EXISTS rewards (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text NOT NULL,
  image_url text NOT NULL,
  points_required integer NOT NULL,
  available boolean DEFAULT true,
  expiry_date timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('earned', 'redeemed')),
  amount integer NOT NULL,
  description text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  dealer_id uuid REFERENCES users(id) ON DELETE SET NULL,
  reward_id uuid REFERENCES rewards(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Marketing Slides table
CREATE TABLE IF NOT EXISTS marketing_slides (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_url text NOT NULL,
  title text NOT NULL,
  active boolean DEFAULT true,
  order_number integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_slides ENABLE ROW LEVEL SECURITY;

-- Users Policies
CREATE POLICY "Users can read their own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Rewards Policies
CREATE POLICY "Anyone can view available rewards"
  ON rewards
  FOR SELECT
  TO authenticated
  USING (available = true);

CREATE POLICY "Admins can manage rewards"
  ON rewards
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  ));

-- Transactions Policies
CREATE POLICY "Users can view their own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Dealers can view and manage transactions they're involved with"
  ON transactions
  FOR ALL
  TO authenticated
  USING (
    dealer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'dealer'
    )
  );

-- Marketing Slides Policies
CREATE POLICY "Anyone can view active marketing slides"
  ON marketing_slides
  FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "Admins can manage marketing slides"
  ON marketing_slides
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_district ON users(district);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_dealer_id ON transactions(dealer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_rewards_available ON rewards(available);
CREATE INDEX IF NOT EXISTS idx_marketing_slides_active ON marketing_slides(active);
CREATE INDEX IF NOT EXISTS idx_marketing_slides_order ON marketing_slides(order_number);