import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import ClientCard from "../components/ClientCard";

// Fonction utilitaire pour récupérer le poids actuel d'un client
async function getPoidsActuel(clientId) {
  const { data, error } = await supabase
    .from("poids_logs")
    .select("poids")
    .eq("user_id", clientId)
    .order("date", { ascending: false })
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data.poids;
}

function ClientList() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [sortBy, setSortBy] = useState("full_name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    email: "",
  });
  const [viewMode, setViewMode] = useState("card"); // "card" ou "list"
  const [poidsActuels, setPoidsActuels] = useState({});
  const [activeTab, setActiveTab] = useState("programme");

  useEffect(() => {
    fetchClients();
  }, [sortBy, sortOrder]);

  // Récupérer le poids actuel de tous les clients (pour la vue liste)
  useEffect(() => {
    if (viewMode !== "list" || clients.length === 0) return;
    let isMounted = true;
    async function fetchPoids() {
      const poidsObj = {};
      for (const client of clients) {
        const poids = await getPoidsActuel(client.id);
        poidsObj[client.id] = poids;
      }
      if (isMounted) setPoidsActuels(poidsObj);
    }
    fetchPoids();
    return () => {
      isMounted = false;
    };
  }, [viewMode, clients]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("role", "client")
        .order(sortBy, { ascending: sortOrder === "asc" });

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

  const handleSort = (newSortBy) => {
    if (newSortBy === sortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("asc");
    }
  };

  const handleClientDeleted = (clientId) => {
    setClients(clients.filter((client) => client.id !== clientId));
  };

  const handleCreateClient = async () => {
    const { email, prenom, nom } = formData;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const jwt = session?.access_token;

      const requestBody = {
        email,
        prenom,
        nom,
        role: "client",
      };

      console.log("Données envoyées:", requestBody);
      console.log("JWT:", jwt);

      const response = await fetch(
        "https://csottmuidhsyamnabzww.functions.supabase.co/create-client",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwt}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      const result = await response.json();
      console.log("Réponse du serveur:", result);

      if (!response.ok) {
        console.error("Erreur complète:", {
          status: response.status,
          statusText: response.statusText,
          result,
        });
        alert(`❌ Erreur : ${result.error || JSON.stringify(result.details)}`);
        return;
      }

      alert("✅ Client créé avec succès !");
      setShowModal(false);
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

  const renderTabContent = (client) => {
    switch (activeTab) {
      case "programme":
        return (
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Programmes</h3>
            {/* Contenu des programmes à implémenter */}
            <p className="text-gray-500">
              Aucun programme disponible pour le moment
            </p>
          </div>
        );
      case "evolution":
        return (
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Évolution du poids</h3>
            {poidsActuels[client.id] !== undefined &&
            poidsActuels[client.id] !== null ? (
              <div>
                <p>Poids actuel : {poidsActuels[client.id]} kg</p>
                {/* Graphique d'évolution à implémenter */}
              </div>
            ) : (
              <p className="text-gray-500">Aucune donnée de poids disponible</p>
            )}
          </div>
        );
      case "nutrition":
        return (
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Nutrition</h3>
            <p className="text-gray-500">
              Cette fonctionnalité sera bientôt disponible
            </p>
          </div>
        );
      case "morpho":
        return (
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Morpho-anatomie</h3>
            <p className="text-gray-500">
              Cette fonctionnalité sera bientôt disponible
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  const renderTabs = () => {
    const tabs = [
      { id: "programme", label: "Programme" },
      { id: "evolution", label: "Évolution" },
      { id: "nutrition", label: "Nutrition" },
      { id: "morpho", label: "Morpho-anatomie" },
    ];

    return (
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center w-full">
            <div className="flex-1 flex justify-center md:justify-start mb-4 md:mb-0">
              <h1 className="text-3xl font-semibold text-blue-700">
                Liste des clients
              </h1>
            </div>
            <div className="flex items-center space-x-4 justify-end w-full md:w-auto">
              <div className="flex items-center space-x-2">
                <label htmlFor="sort" className="text-sm text-gray-600">
                  Trier par :
                </label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e) => handleSort(e.target.value)}
                  className="border rounded p-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="full_name">Nom complet</option>
                  <option value="email">Email</option>
                  <option value="created_at">Date de création</option>
                </select>
              </div>
              <button
                onClick={() =>
                  setViewMode(viewMode === "card" ? "list" : "card")
                }
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 ml-2"
                title={
                  viewMode === "card"
                    ? "Afficher en liste"
                    : "Afficher en cartes"
                }
              >
                {viewMode === "card" ? (
                  // Icône liste
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <rect
                      x="4"
                      y="6"
                      width="16"
                      height="2"
                      rx="1"
                      fill="currentColor"
                    />
                    <rect
                      x="4"
                      y="11"
                      width="16"
                      height="2"
                      rx="1"
                      fill="currentColor"
                    />
                    <rect
                      x="4"
                      y="16"
                      width="16"
                      height="2"
                      rx="1"
                      fill="currentColor"
                    />
                  </svg>
                ) : (
                  // Icône cartes
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <rect
                      x="4"
                      y="4"
                      width="7"
                      height="7"
                      rx="2"
                      fill="currentColor"
                    />
                    <rect
                      x="13"
                      y="4"
                      width="7"
                      height="7"
                      rx="2"
                      fill="currentColor"
                    />
                    <rect
                      x="4"
                      y="13"
                      width="7"
                      height="7"
                      rx="2"
                      fill="currentColor"
                    />
                    <rect
                      x="13"
                      y="13"
                      width="7"
                      height="7"
                      rx="2"
                      fill="currentColor"
                    />
                  </svg>
                )}
              </button>
              <button
                className="p-2 text-blue-700 hover:bg-blue-100 rounded-full transition-colors duration-150"
                onClick={() => setShowModal(true)}
                title="Nouveau client"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25v-1.5A2.25 2.25 0 016.75 16.5h4.5a2.25 2.25 0 012.25 2.25v1.5M18 9v6m3-3h-6"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-blue-700">
                  Nouveau client
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Prénom"
                  value={formData.prenom}
                  onChange={(e) =>
                    setFormData({ ...formData, prenom: e.target.value })
                  }
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Nom"
                  value={formData.nom}
                  onChange={(e) =>
                    setFormData({ ...formData, nom: e.target.value })
                  }
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => {
                      handleCreateClient();
                      setShowModal(false);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Créer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <p>Chargement…</p>
        ) : clients.length === 0 ? (
          <p>Aucun client trouvé.</p>
        ) : viewMode === "card" ? (
          <div className="w-full max-w-[1540px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-stretch">
              {clients.map((client) => (
                <div key={client.id} className="h-full min-h-[140px]">
                  <ClientCard
                    client={client}
                    onClientDeleted={handleClientDeleted}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">
                    Date de création
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">
                    Poids actuel
                  </th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-blue-50 transition-colors cursor-pointer"
                    onClick={() =>
                      (window.location.href = `/client/${client.id}`)
                    }
                  >
                    <td className="border-t px-6 py-3 text-gray-800 font-medium">
                      {client.full_name}
                    </td>
                    <td className="border-t px-6 py-3 text-gray-800">
                      {client.email}
                    </td>
                    <td className="border-t px-6 py-3 text-gray-800">
                      {client.created_at
                        ? new Date(client.created_at).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="border-t px-6 py-3 text-gray-800">
                      {poidsActuels[client.id] !== undefined &&
                      poidsActuels[client.id] !== null ? (
                        `${poidsActuels[client.id]} kg`
                      ) : (
                        <span className="text-gray-400">Non renseigné</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClientList;
