-- Créer la table users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL CHECK (role IN ('coach', 'client')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    weight NUMERIC,
    birth_date DATE,
    injuries TEXT
);

-- Activer RLS sur la table users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Créer une politique pour permettre aux utilisateurs de voir leurs propres informations
CREATE POLICY "Les utilisateurs peuvent voir leurs propres informations"
ON users
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Créer une politique pour permettre aux coachs de voir les informations de leurs clients
CREATE POLICY "Les coachs peuvent voir les informations de leurs clients"
ON users
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM coach_clients
        WHERE coach_id = auth.uid()
        AND client_id = users.id
    )
);

-- Créer une politique pour permettre aux coachs de modifier les informations de leurs clients
CREATE POLICY "Les coachs peuvent modifier les informations de leurs clients"
ON users
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM coach_clients
        WHERE coach_id = auth.uid()
        AND client_id = users.id
    )
);

-- Créer une politique pour permettre aux coachs de supprimer leurs clients
CREATE POLICY "Les coachs peuvent supprimer leurs clients"
ON users
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM coach_clients
        WHERE coach_id = auth.uid()
        AND client_id = users.id
    )
); 