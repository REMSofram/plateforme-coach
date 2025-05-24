-- Add coach_id column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS users_coach_id_idx ON users(coach_id);

-- Add comment to explain the column
COMMENT ON COLUMN users.coach_id IS 'Reference to the coach assigned to this user (for clients only)'; 