import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { FiUser } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const [userRole, setUserRole] = useState(null);
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
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
        if (data) {
          setUser(data);
          setUserRole(data.role);
        }
      } catch {
        // Ignorer les erreurs silencieusement
      }
    };
    fetchUser();
  }, []);

  // Fermer le menu si on clique en dehors
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <header className="bg-white shadow flex items-center justify-between px-8 py-4">
      <div />
      <div className="flex items-center gap-4 relative">
        {userRole && (
          <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            {userRole === "coach" ? "Coach connecté" : "Client connecté"}
          </span>
        )}
        <button
          className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center focus:outline-none"
          onClick={() => setDropdownOpen((open) => !open)}
        >
          <FiUser className="text-blue-700 text-2xl" />
        </button>
        {dropdownOpen && user && (
          <div
            ref={dropdownRef}
            className="absolute right-0 top-14 bg-white shadow-lg rounded-lg p-4 min-w-[220px] z-50 border"
          >
            <div className="mb-2">
              <div className="font-semibold text-blue-700 text-base">
                {user.full_name || "Utilisateur"}
              </div>
              <div className="text-sm text-gray-600 break-all">
                {user.email}
              </div>
            </div>
            <button
              className="w-full mt-2 px-3 py-2 rounded bg-blue-700 text-white hover:bg-blue-800 transition-colors duration-150 text-sm"
              onClick={() => {
                setDropdownOpen(false);
                navigate("/profil");
              }}
            >
              Voir mon profil
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
