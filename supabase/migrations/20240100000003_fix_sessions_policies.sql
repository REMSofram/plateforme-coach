-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Coaches can view their clients' sessions" ON sessions;
DROP POLICY IF EXISTS "Coaches can insert sessions for their clients" ON sessions;
DROP POLICY IF EXISTS "Coaches can update their clients' sessions" ON sessions;
DROP POLICY IF EXISTS "Coaches can delete their clients' sessions" ON sessions;

-- Créer les nouvelles politiques simplifiées
CREATE POLICY "Coaches can view sessions"
    ON sessions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'coach'
        )
    );

CREATE POLICY "Coaches can insert sessions"
    ON sessions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'coach'
        )
    );

CREATE POLICY "Coaches can update sessions"
    ON sessions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'coach'
        )
    );

CREATE POLICY "Coaches can delete sessions"
    ON sessions FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'coach'
        )
    ); 