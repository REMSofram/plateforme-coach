import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = async (e) => {
    e.preventDefault();
    console.log("Tentative de déconnexion...");

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Erreur lors de la déconnexion:", error);
        alert("Erreur lors de la déconnexion: " + error.message);
        return;
      }
      console.log("Déconnexion réussie, redirection vers login");
      navigate("/login");
    } catch (error) {
      console.error("Erreur inattendue lors de la déconnexion:", error);
      alert("Une erreur est survenue lors de la déconnexion");
    }
  };

  // Nouveau handler pour le bouton Application
  const handleGoHome = (e) => {
    e.preventDefault();
    navigate("/");
  };

  return (
    <div className="w-64 bg-blue-800 text-white p-6">
      <button
        className="text-2xl font-bold mb-6 hover:text-blue-200 focus:outline-none"
        onClick={handleGoHome}
        style={{ display: "block", width: "100%", textAlign: "left" }}
      >
        Application
      </button>
      <nav>
        <ul className="space-y-4">
          <li>
            <a href="#" className="hover:text-blue-200">
              Voir mes clients
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-blue-200">
              Ajouter un suivi
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-blue-200">
              Stats générales
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-blue-200">
              Profil
            </a>
          </li>
          <li>
            <button
              onClick={handleLogout}
              className="w-full text-left hover:text-blue-200"
            >
              Déconnexion
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default Sidebar;
