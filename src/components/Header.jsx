import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const Header = () => {
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          console.log("Pas de session active");
          return;
        }

        console.log("Session utilisateur:", session.user.id);

        // Essayer de récupérer l'utilisateur avec tous les champs
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();

        if (error) {
          console.error(
            "Erreur lors de la récupération de l'utilisateur :",
            error
          );
          return;
        }

        if (!data) {
          console.log("Utilisateur non trouvé, création en cours...");
          // Créer l'utilisateur s'il n'existe pas
          const { data: newUser, error: createError } = await supabase
            .from("users")
            .upsert(
              [
                {
                  id: session.user.id,
                  email: session.user.email,
                  role: "coach",
                  created_at: new Date().toISOString(),
                },
              ],
              {
                onConflict: "id",
                ignoreDuplicates: true,
              }
            )
            .select()
            .single();

          if (createError) {
            console.error(
              "Erreur lors de la création de l'utilisateur :",
              createError
            );
            return;
          }

          console.log("Nouvel utilisateur créé:", newUser);
          setUserRole(newUser?.role);
        } else {
          console.log("Utilisateur trouvé:", data);
          setUserRole(data.role);
        }
      } catch (error) {
        console.error("Erreur inattendue :", error);
      }
    };

    fetchUserRole();
  }, []);

  return (
    <header className="bg-white shadow-md p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-700">
          Dashboard
          {userRole && (
            <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
              connecté en tant que : {userRole}
            </span>
          )}
        </h1>
      </div>
    </header>
  );
};

export default Header;
