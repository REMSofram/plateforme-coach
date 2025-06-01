-- Fonction pour gérer la création d'un nouvel utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insérer un nouvel enregistrement dans la table users avec le rôle 'client'
  INSERT INTO public.users (id, email, role, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    'client',  -- Rôle par défaut
    NEW.created_at
  )
  ON CONFLICT (id) DO NOTHING;  -- Ne rien faire si l'utilisateur existe déjà
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer le trigger qui s'exécute après l'insertion d'un nouvel utilisateur
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Commentaires pour la documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'Gère la création d''un nouvel utilisateur en ajoutant un enregistrement dans la table users avec le rôle client par défaut';

-- Permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
