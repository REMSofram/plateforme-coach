-- Créer la table coach_clients
CREATE TABLE IF NOT EXISTS coach_clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    coach_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(coach_id, client_id)
);

-- Activer RLS sur la table coach_clients
ALTER TABLE coach_clients ENABLE ROW LEVEL SECURITY;

-- Créer une politique pour permettre aux coachs de voir leurs relations avec les clients
CREATE POLICY "Les coachs peuvent voir leurs relations avec les clients"
ON coach_clients
FOR SELECT
TO authenticated
USING (coach_id = auth.uid());

-- Créer une politique pour permettre aux coachs d'ajouter des clients
CREATE POLICY "Les coachs peuvent ajouter des clients"
ON coach_clients
FOR INSERT
TO authenticated
WITH CHECK (coach_id = auth.uid());

-- Créer une politique pour permettre aux coachs de supprimer leurs relations avec les clients
CREATE POLICY "Les coachs peuvent supprimer leurs relations avec les clients"
ON coach_clients
FOR DELETE
TO authenticated
USING (coach_id = auth.uid()); 