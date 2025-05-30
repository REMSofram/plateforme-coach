import { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (isSignUp) {
        // Inscription
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + '/profil',
          },
        });
        
        if (signUpError) throw signUpError;
        
        setMessage("Un email de confirmation a été envoyé. Vérifiez votre boîte mail pour confirmer votre inscription.");
      } else {
        // Connexion
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (signInError) throw signInError;
        
        // Rediriger vers la page d'accueil après connexion réussie
        navigate('/');
      }
    } catch (error) {
      console.error("Erreur d'authentification:", error);
      
      // Messages d'erreur plus conviviaux
      if (error.message.includes('Invalid login credentials')) {
        setError("Email ou mot de passe incorrect.");
      } else if (error.message.includes('Email not confirmed')) {
        setError("Veuillez vérifier votre email pour confirmer votre inscription avant de vous connecter.");
      } else if (error.message.includes('Email rate limit exceeded')) {
        setError("Trop de tentatives. Veuillez réessayer plus tard.");
      } else {
        setError(error.message || "Une erreur est survenue lors de l'authentification");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      // Utilisation de l'URL du site en production
      const siteUrl = window.location.hostname === 'localhost' 
        ? window.location.origin 
        : 'https://plateforme-coach.vercel.app';
        
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${siteUrl}/update-password`,
      });
      
      if (error) throw error;
      
      setResetSent(true);
      setMessage("Un email de réinitialisation a été envoyé. Vérifiez votre boîte mail.");
    } catch (error) {
      console.error("Erreur lors de la demande de réinitialisation:", error);
      setError(error.message || "Une erreur est survenue lors de l'envoi de l'email de réinitialisation");
    } finally {
      setLoading(false);
    }
  };

  if (showResetForm) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow">
        <h2 className="text-2xl font-bold mb-4 text-center">
          Réinitialiser le mot de passe
        </h2>
        {!resetSent ? (
          <form onSubmit={handlePasswordReset} className="flex flex-col gap-4">
            <p className="text-gray-600">Entrez votre adresse email pour recevoir un lien de réinitialisation.</p>
            <input
              type="email"
              placeholder="Email"
              className="p-2 border rounded"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              required
            />
            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 bg-gray-200 text-gray-800 p-2 rounded hover:bg-gray-300"
                onClick={() => {
                  setShowResetForm(false);
                  setResetEmail("");
                  setError("");
                  setMessage("");
                }}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Envoi en cours..." : "Envoyer le lien"}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center">
            <p className="text-green-500 mb-4">{message}</p>
            <button
              onClick={() => {
                setShowResetForm(false);
                setResetEmail("");
                setResetSent(false);
                setMessage("");
              }}
              className="text-blue-500 underline"
            >
              Retour à la connexion
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded shadow">
      <div className="flex justify-center mb-6">
        <img 
          src="/logo_rd_coaching.png" 
          alt="RD Coaching Logo" 
          className="h-24 w-auto" 
        />
      </div>
      <h2 className="text-2xl font-bold mb-4 text-center">
        {isSignUp ? "Créer un compte" : "Se connecter"}
      </h2>
      <form onSubmit={handleAuth} className="flex flex-col gap-4">
        <input
          type="email"
          placeholder="Email"
          className="p-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          className="p-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          {isSignUp ? "Créer un compte" : "Se connecter"}
        </button>
      </form>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {message && <p className="text-green-500 mt-2">{message}</p>}

      <p className="mt-4 text-center text-sm text-gray-600">
        {isSignUp ? "Déjà un compte ?" : "Pas encore de compte ?"}{" "}
        <button
          className="text-blue-500 underline"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError("");
            setMessage("");
          }}
        >
          {isSignUp ? "Se connecter" : "Créer un compte"}
        </button>
      </p>
      
      {!isSignUp && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowResetForm(true)}
            className="text-sm text-blue-500 hover:underline"
          >
            Mot de passe oublié ?
          </button>
        </div>
      )}
    </div>
  );
};

export default Login;
