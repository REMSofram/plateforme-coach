-- Create poids_logs table
CREATE TABLE IF NOT EXISTS poids_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    poids DECIMAL(5,2) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on user_id and date for faster queries
CREATE INDEX IF NOT EXISTS poids_logs_user_id_date_idx ON poids_logs(user_id, date);

-- Add RLS policies
ALTER TABLE poids_logs ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own weight logs
CREATE POLICY "Users can view their own weight logs"
    ON poids_logs FOR SELECT
    USING (
        user_id = auth.uid()
    );

-- Policy for users to insert their own weight logs
CREATE POLICY "Users can insert their own weight logs"
    ON poids_logs FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
    );

-- Policy for users to update their own weight logs
CREATE POLICY "Users can update their own weight logs"
    ON poids_logs FOR UPDATE
    USING (
        user_id = auth.uid()
    );

-- Policy for users to delete their own weight logs
CREATE POLICY "Users can delete their own weight logs"
    ON poids_logs FOR DELETE
    USING (
        user_id = auth.uid()
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_poids_logs_updated_at
    BEFORE UPDATE ON poids_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 