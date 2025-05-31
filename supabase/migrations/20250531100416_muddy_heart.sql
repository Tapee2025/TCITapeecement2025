-- Drop the old function as we'll handle points directly
DROP FUNCTION IF EXISTS add_points;

-- Add indexes for better user lookup performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id_status ON transactions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_users_role_district ON users(role, district);

-- Update the transactions foreign key to cascade user updates
ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_user_id_fkey,
ADD CONSTRAINT transactions_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;

-- Add a trigger to update timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_users_timestamp
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE OR REPLACE TRIGGER update_transactions_timestamp
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();