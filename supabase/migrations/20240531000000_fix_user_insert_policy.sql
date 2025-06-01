-- Créer une politique pour permettre à la fonction handle-new-user d'insérer de nouveaux utilisateurs
CREATE POLICY "Allow handle-new-user to insert users"
ON users
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Vérifier que la politique a bien été créée
COMMENT ON POLICY "Allow handle-new-user to insert users" ON users 
IS 'Permet à la fonction handle-new-user de créer des profils utilisateurs.';
