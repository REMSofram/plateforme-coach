-- Créer la table poids_logs
CREATE TABLE IF NOT EXISTS poids_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    poids NUMERIC NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activer RLS sur la table poids_logs
ALTER TABLE poids_logs ENABLE ROW LEVEL SECURITY;

-- Créer une politique pour permettre aux coachs d'ajouter des poids pour leurs clients
CREATE POLICY "Les coachs peuvent ajouter des poids pour leurs clients"
ON poids_logs
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'coach'
    )
);

-- Créer une politique pour permettre aux coachs de voir les poids de leurs clients
CREATE POLICY "Les coachs peuvent voir les poids de leurs clients"
ON poids_logs
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'coach'
    )
);

-- Créer une politique pour permettre aux clients de voir leurs propres poids
CREATE POLICY "Les clients peuvent voir leurs propres poids"
ON poids_logs
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Créer une politique pour permettre aux coachs de supprimer les poids de leurs clients
CREATE POLICY "Les coachs peuvent supprimer les poids de leurs clients"
ON poids_logs
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'coach'
    )
); 