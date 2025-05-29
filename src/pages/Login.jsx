import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
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

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow">
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
          onClick={() => setIsSignUp(!isSignUp)}
        >
          {isSignUp ? "Se connecter" : "Créer un compte"}
        </button>
      </p>
    </div>
  );
};

export default Login;
