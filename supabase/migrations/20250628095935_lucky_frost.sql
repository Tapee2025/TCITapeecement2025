/*
  # Fix get_transaction_details function

  1. Function Updates
    - Fix the get_transaction_details function to handle cases where dealer records don't exist
    - Use LEFT JOINs and proper null handling to prevent "record not assigned" errors
    - Ensure all record variables are properly initialized

  2. Changes Made
    - Replace problematic SELECT INTO statements with LEFT JOINs
    - Add proper null checks and default values
    - Handle cases where transactions don't have associated dealers
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_transaction_details(uuid);

-- Create the improved get_transaction_details function
CREATE OR REPLACE FUNCTION get_transaction_details(p_transaction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
BEGIN
    -- Build the result using a single query with LEFT JOINs to avoid unassigned record issues
    SELECT jsonb_build_object(
        'transaction', jsonb_build_object(
            'id', t.id,
            'type', t.type,
            'amount', t.amount,
            'description', t.description,
            'status', t.status,
            'created_at', t.created_at,
            'cancelled_at', t.cancelled_at,
            'cancellation_reason', t.cancellation_reason
        ),
        'user', jsonb_build_object(
            'id', u.id,
            'name', u.first_name || ' ' || u.last_name,
            'user_code', u.user_code,
            'email', u.email,
            'role', u.role,
            'district', u.district,
            'current_points', u.points
        ),
        'dealer', CASE 
            WHEN d.id IS NOT NULL THEN jsonb_build_object(
                'id', d.id,
                'name', d.first_name || ' ' || d.last_name,
                'user_code', d.user_code,
                'district', d.district
            )
            ELSE null
        END,
        'reward', CASE 
            WHEN r.id IS NOT NULL THEN jsonb_build_object(
                'id', r.id,
                'title', r.title,
                'points_required', r.points_required
            )
            ELSE null
        END,
        'cancellation', CASE 
            WHEN t.cancelled_at IS NOT NULL THEN jsonb_build_object(
                'cancelled_at', t.cancelled_at,
                'reason', t.cancellation_reason,
                'cancelled_by', CASE 
                    WHEN cb.id IS NOT NULL THEN jsonb_build_object(
                        'id', cb.id,
                        'name', cb.first_name || ' ' || cb.last_name
                    )
                    ELSE null
                END
            )
            ELSE null
        END
    ) INTO result
    FROM transactions t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN users d ON t.dealer_id = d.id
    LEFT JOIN rewards r ON t.reward_id = r.id
    LEFT JOIN users cb ON t.cancelled_by = cb.id
    WHERE t.id = p_transaction_id;

    -- Check if transaction was found
    IF result IS NULL THEN
        RAISE EXCEPTION 'Transaction not found with id: %', p_transaction_id;
    END IF;

    RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_transaction_details(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_transaction_details(uuid) TO service_role;