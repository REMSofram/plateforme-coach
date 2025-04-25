import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import ClientDetail from "./pages/ClientDetail"; // ✅ Ajouté

function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    // Check si un utilisateur est déjà connecté
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
      setCheckingSession(false);
    };

    getUser();

    // On écoute aussi les changements (login/logout)
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => listener?.subscription.unsubscribe();
  }, []);

  if (checkingSession) return <p>Chargement...</p>;

  return (
    <Router>
      <Routes>
        {/* Route protégée : home visible que si connecté */}
        <Route path="/" element={user ? <Home /> : <Navigate to="/login" />} />

        {/* Page de login : redirige si déjà connecté */}
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />

        {/* ✅ Nouvelle route dynamique pour les pages client */}
        <Route
          path="/client/:id"
          element={user ? <ClientDetail /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
}

export default App;
