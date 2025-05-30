-- Create a function to safely add points to a user's balance
CREATE OR REPLACE FUNCTION add_points(p_user_id uuid, p_points integer)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET points = points + p_points,
      updated_at = now()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;