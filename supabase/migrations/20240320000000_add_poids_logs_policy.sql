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