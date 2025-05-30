-- Create dealer_approvals table
CREATE TABLE IF NOT EXISTS dealer_approvals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  dealer_id uuid REFERENCES users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  description text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dealer_approvals_transaction_id ON dealer_approvals(transaction_id);
CREATE INDEX IF NOT EXISTS idx_dealer_approvals_user_id ON dealer_approvals(user_id);
CREATE INDEX IF NOT EXISTS idx_dealer_approvals_dealer_id ON dealer_approvals(dealer_id);
CREATE INDEX IF NOT EXISTS idx_dealer_approvals_status ON dealer_approvals(status);

-- Enable RLS
ALTER TABLE dealer_approvals ENABLE ROW LEVEL SECURITY;

-- Policies for dealer_approvals
CREATE POLICY "Dealers can view and manage their approvals"
  ON dealer_approvals
  FOR ALL
  TO authenticated
  USING (dealer_id = auth.uid());

CREATE POLICY "Users can view their own approvals"
  ON dealer_approvals
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all approvals"
  ON dealer_approvals
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  ));