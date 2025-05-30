import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import Login from "./pages/Login";
import UpdatePassword from "./pages/UpdatePassword";
import Home from "./pages/Home";
import ClientList from "./pages/ClientList";
import ClientDetail from "./pages/ClientDetail";
import Layout from "./components/Layout";
import Profil from "./pages/Profil";
import Settings from "./pages/Settings";
import Help from "./pages/Help";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier la session au chargement
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Chargement...</div>;
  }

  // Fonction pour vérifier si l'utilisateur est en train de réinitialiser son mot de passe
  const isResettingPassword = window.location.pathname === '/update-password' && 
    (window.location.search.includes('type=recovery') || 
     window.location.search.includes('access_token='));

  console.log('=== ROUTER DEBUG ===');
  console.log('Chemin actuel:', window.location.pathname);
  console.log('Recherche actuelle:', window.location.search);
  console.log('Session active:', session ? 'oui' : 'non');
  console.log('isResettingPassword:', isResettingPassword);
  console.log('===================');

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            isResettingPassword ? (
              <Navigate to={`/update-password${window.location.search}`} replace />
            ) : !session ? (
              <Login />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        
        <Route 
          path="/update-password" 
          element={
            isResettingPassword || session ? (
              <UpdatePassword />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        <Route 
          path="/" 
          element={
            session ? (
              <Layout />
            ) : isResettingPassword ? (
              <Navigate to={`/update-password${window.location.search}`} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route index element={<Home />} />
          <Route path="clients" element={<ClientList />} />
          <Route path="client/:id" element={<ClientDetail />} />
          <Route path="profil" element={<Profil />} />
          <Route path="parametres" element={<Settings />} />
          <Route path="aide" element={<Help />} />
        </Route>
        
        <Route 
          path="*" 
          element={
            <Navigate to={
              isResettingPassword 
                ? `/update-password${window.location.search}` 
                : session ? "/" : "/login"
            } replace />
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
