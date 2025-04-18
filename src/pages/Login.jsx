import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (isSignUp) {
      // Sign up
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Compte créé ! Vérifie tes mails pour valider ton adresse.");
      }
    } else {
      // Login
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      }
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
