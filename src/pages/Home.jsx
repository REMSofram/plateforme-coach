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
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("role", "client")
        .order("full_name", { ascending: true });

      if (error) {
        console.error("Erreur de récupération :", error);
        return;
      }

      setClients(data || []);
    } catch (error) {
      console.error("Erreur :", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClientDeleted = (clientId) => {
    setClients(clients.filter((client) => client.id !== clientId));
  };

  const handleCreateClient = async () => {
    const { email, prenom, nom } = formData;
    const password = "secure-password"; // temporaire ou à générer

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const jwt = session?.access_token;

      const response = await fetch(
        "https://csottmuidhsyamnabzww.functions.supabase.co/create-client",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwt}`,
          },
          body: JSON.stringify({
            email,
            password,
            prenom,
            nom,
            role: "client", // Ajout explicite du rôle client
          }),
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

      // Attendre un court instant pour laisser le temps à la base de données de se mettre à jour
      setTimeout(() => {
        fetchClients(); // Refresh la liste
      }, 1000);
    } catch (error) {
      console.error("Erreur lors de la création du client :", error);
      alert("❌ Erreur lors de la création du client");
    }
  };

  return (
    <MainLayout>
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
            <ClientCard
              key={client.id}
              client={client}
              onClientDeleted={handleClientDeleted}
            />
          ))}
        </div>
      )}
    </MainLayout>
  );
};

export default Home;
