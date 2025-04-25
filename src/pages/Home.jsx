import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import MainLayout from "../layouts/MainLayout";
import ClientCard from "../components/ClientCard";

const Home = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    email: "",
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);

    const session = await supabase.auth.getSession();
    const jwt = session.data.session?.access_token;

    const res = await fetch(
      "https://csottmuidhsyamnabzww.supabase.co/rest/v1/users?select=*&order=full_name.asc",
      {
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${jwt}`,
        },
      }
    );

    if (!res.ok) {
      const error = await res.json();
      console.error("Erreur de récupération :", error);
      setLoading(false);
      return;
    }

    const data = await res.json();
    setClients(data);
    setLoading(false);
  };

  const handleCreateClient = async () => {
    const { email, prenom, nom } = formData;
    const password = "secure-password"; // temporaire ou à générer

    const session = await supabase.auth.getSession();
    const jwt = session.data.session?.access_token;

    const response = await fetch(
      "https://csottmuidhsyamnabzww.functions.supabase.co/create-client",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ email, password, prenom, nom }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      alert(`❌ Erreur : ${result.error || JSON.stringify(result.details)}`);
      return;
    }

    alert("✅ Client créé avec succès !");
    setShowForm(false);
    setFormData({ prenom: "", nom: "", email: "" });
    fetchClients(); // Refresh la liste
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Erreur de déconnexion :", error.message);
    }
  };

  return (
    <MainLayout>
      <div className="flex justify-end">
        <button
          onClick={handleLogout}
          className="mb-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Déconnexion
        </button>
      </div>

      <h1 className="text-3xl font-bold text-blue-700 mb-6">
        Liste des clients
      </h1>

      <button
        className="mb-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        onClick={() => setShowForm(!showForm)}
      >
        {showForm ? "Annuler" : "Nouveau client"}
      </button>

      {showForm && (
        <div className="mb-6 p-4 border rounded bg-gray-100">
          <input
            type="text"
            placeholder="Prénom"
            value={formData.prenom}
            onChange={(e) =>
              setFormData({ ...formData, prenom: e.target.value })
            }
            className="mb-2 p-2 w-full"
          />
          <input
            type="text"
            placeholder="Nom"
            value={formData.nom}
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            className="mb-2 p-2 w-full"
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="mb-2 p-2 w-full"
          />
          <button
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            onClick={handleCreateClient}
          >
            Créer
          </button>
        </div>
      )}

      {loading ? (
        <p>Chargement…</p>
      ) : clients.length === 0 ? (
        <p>Aucun client trouvé.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}
    </MainLayout>
  );
};

export default Home;
