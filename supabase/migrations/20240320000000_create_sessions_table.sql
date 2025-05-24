-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on client_id and date for faster queries
CREATE INDEX IF NOT EXISTS sessions_client_id_date_idx ON sessions(client_id, date);

-- Add RLS policies
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Policy for coaches to view their clients' sessions
CREATE POLICY "Coaches can view their clients' sessions"
    ON sessions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'coach'
            AND EXISTS (
                SELECT 1 FROM users AS clients
                WHERE clients.id = sessions.client_id
                AND clients.coach_id = auth.uid()
            )
        )
    );

-- Policy for coaches to insert sessions for their clients
CREATE POLICY "Coaches can insert sessions for their clients"
    ON sessions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'coach'
            AND EXISTS (
                SELECT 1 FROM users AS clients
                WHERE clients.id = sessions.client_id
                AND clients.coach_id = auth.uid()
            )
        )
    );

-- Policy for coaches to update their clients' sessions
CREATE POLICY "Coaches can update their clients' sessions"
    ON sessions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'coach'
            AND EXISTS (
                SELECT 1 FROM users AS clients
                WHERE clients.id = sessions.client_id
                AND clients.coach_id = auth.uid()
            )
        )
    );

-- Policy for coaches to delete their clients' sessions
CREATE POLICY "Coaches can delete their clients' sessions"
    ON sessions FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'coach'
            AND EXISTS (
                SELECT 1 FROM users AS clients
                WHERE clients.id = sessions.client_id
                AND clients.coach_id = auth.uid()
            )
        )
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
CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 