import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function Profil() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;
        const { data } = await supabase
          .from("users")
          .select("full_name, email, role")
          .eq("id", session.user.id)
          .maybeSingle();
        if (data) setUser(data);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (loading) return <div className="p-8">Chargement…</div>;

  if (!user) return <div className="p-8">Utilisateur non trouvé.</div>;

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold text-blue-700 mb-6">Mon profil</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <span className="block text-gray-500 text-sm">Nom complet</span>
          <span className="block text-lg font-medium text-gray-800">
            {user.full_name}
          </span>
        </div>
        <div className="mb-4">
          <span className="block text-gray-500 text-sm">Adresse e-mail</span>
          <span className="block text-lg font-medium text-gray-800">
            {user.email}
          </span>
        </div>
        <div>
          <span className="block text-gray-500 text-sm">Rôle</span>
          <span className="block text-lg font-medium text-gray-800">
            {user.role}
          </span>
        </div>
      </div>
    </div>
  );
}

export default Profil;
