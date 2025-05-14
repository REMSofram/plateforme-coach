import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import {
  FiHome,
  FiUsers,
  FiSettings,
  FiHelpCircle,
  FiLogOut,
} from "react-icons/fi";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        alert("Erreur lors de la déconnexion: " + error.message);
        return;
      }
      navigate("/login");
    } catch {
      alert("Une erreur est survenue lors de la déconnexion");
    }
  };

  const handleGoHome = (e) => {
    e.preventDefault();
    navigate("/");
  };

  // Utilitaire pour le style actif
  const isActive = (path) => location.pathname === path;

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen justify-between">
      <div>
        <div className="py-6 px-6">
          <button
            className="text-lg font-semibold text-blue-700 tracking-wide focus:outline-none"
            onClick={handleGoHome}
            style={{ width: "100%", textAlign: "left" }}
          >
            Application
          </button>
        </div>
        <nav className="px-4">
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => navigate("/")}
                className={`flex items-center w-full px-3 py-2 rounded-lg transition-colors duration-150 ${
                  isActive("/")
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                }`}
              >
                <FiHome className="mr-3 text-lg" />
                Dashboard
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate("/clients")}
                className={`flex items-center w-full px-3 py-2 rounded-lg transition-colors duration-150 ${
                  isActive("/clients")
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                }`}
              >
                <FiUsers className="mr-3 text-lg" />
                Mes Clients
              </button>
            </li>
          </ul>
        </nav>
      </div>
      <div className="px-4 pb-6">
        <ul className="space-y-2">
          <li>
            <button
              onClick={() => navigate("/parametres")}
              className={`flex items-center w-full px-3 py-2 rounded-lg transition-colors duration-150 ${
                isActive("/parametres")
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
              }`}
            >
              <FiSettings className="mr-3 text-lg" />
              Paramètres
            </button>
          </li>
          <li>
            <button
              onClick={() => navigate("/aide")}
              className={`flex items-center w-full px-3 py-2 rounded-lg transition-colors duration-150 ${
                isActive("/aide")
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
              }`}
            >
              <FiHelpCircle className="mr-3 text-lg" />
              Aide
            </button>
          </li>
          <li className="mt-4">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors duration-150"
            >
              <FiLogOut className="mr-3 text-lg" />
              Déconnexion
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Sidebar;
