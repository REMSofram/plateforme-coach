import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const UpdatePassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Vérifier si l'utilisateur est arrivé depuis un email de réinitialisation
  useEffect(() => {
    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");
    const type = searchParams.get("type");

    const handleSession = async () => {
      if (type === "recovery" && accessToken && refreshToken) {
        try {
          // Restaurer la session depuis le lien de réinitialisation
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (error) throw error;
          
          // Nettoyer l'URL après avoir établi la session
          window.history.replaceState({}, document.title, "/update-password");
        } catch (error) {
          console.error("Erreur lors de la restauration de la session:", error);
          setError("Le lien de réinitialisation est invalide ou a expiré.");
          navigate("/login");
        }
      } else if (!accessToken || !refreshToken || type !== "recovery") {
        // Rediriger vers la page de connexion si les paramètres sont manquants
        navigate("/login");
      }
    };
    
    handleSession();
  }, [navigate, searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    // Validation des champs
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    try {
      // Mettre à jour le mot de passe
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      setMessage("Votre mot de passe a été mis à jour avec succès !");
      
      // Rediriger vers la page de connexion après un court délai
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du mot de passe:", error);
      setError(
        error.message || "Une erreur est survenue lors de la mise à jour du mot de passe."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow">
      <h2 className="text-2xl font-bold mb-4 text-center">
        Réinitialiser votre mot de passe
      </h2>
      
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{message}</div>}
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Nouveau mot de passe
          </label>
          <input
            id="password"
            type="password"
            placeholder="Entrez votre nouveau mot de passe"
            className="w-full p-2 border rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <p className="text-xs text-gray-500 mt-1">Le mot de passe doit contenir au moins 6 caractères.</p>
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirmez le mot de passe
          </label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="Confirmez votre nouveau mot de passe"
            className="w-full p-2 border rounded"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Traitement en cours..." : "Réinitialiser le mot de passe"}
        </button>
      </form>
      
      <div className="mt-4 text-center">
        <button
          onClick={() => navigate("/login")}
          className="text-blue-500 hover:underline text-sm"
        >
          Retour à la connexion
        </button>
      </div>
    </div>
  );
};

export default UpdatePassword;
