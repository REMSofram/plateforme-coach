import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import WeeklySchedule from "../components/WeeklySchedule";

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [poids, setPoids] = useState("");
  const [datePoids, setDatePoids] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [poidsLogs, setPoidsLogs] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [activeTab, setActiveTab] = useState("programme");

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          console.error("Erreur récupération client :", error);
          return;
        }

        setClient(data);
      } catch (error) {
        console.error("Erreur :", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchPoidsLogs = async () => {
      try {
        const { data, error } = await supabase
          .from("poids_logs")
          .select("*")
          .eq("user_id", id)
          .order("date", { ascending: false })
          .order("id", { ascending: false });

        if (error) {
          console.error("Erreur récupération des poids :", error);
          return;
        }

        setPoidsLogs(data || []);
      } catch (error) {
        console.error("Erreur :", error);
      }
    };

    fetchClient();
    fetchPoidsLogs();
  }, [id]);

  const ajouterPoids = async () => {
    if (!poids || isNaN(poids)) {
      setMessage("Veuillez entrer un poids valide");
      return;
    }

    try {
      const { error } = await supabase.from("poids_logs").insert([
        {
          user_id: id,
          date: datePoids,
          poids: parseFloat(poids),
        },
      ]);

      if (error) {
        console.error("Erreur lors de l'ajout du poids :", error);
        setMessage("Erreur lors de l'ajout du poids");
        return;
      }

      setMessage("Poids ajouté avec succès !");
      setPoids("");
      setDatePoids(new Date().toISOString().split("T")[0]);

      // Rafraîchir la liste des poids
      const { data, error: fetchError } = await supabase
        .from("poids_logs")
        .select("*")
        .eq("user_id", id)
        .order("date", { ascending: false })
        .order("id", { ascending: false });

      if (!fetchError) {
        setPoidsLogs(data || []);
      }
    } catch (error) {
      console.error("Erreur :", error);
      setMessage("Erreur lors de l'ajout du poids");
    }
  };

  const demanderSuppressionPoids = (poidsId) => {
    setPendingDeleteId(poidsId);
    setShowDeleteModal(true);
  };

  const supprimerPoids = async () => {
    if (!pendingDeleteId) return;
    setDeletingId(pendingDeleteId);
    setShowDeleteModal(false);
    try {
      const { error } = await supabase
        .from("poids_logs")
        .delete()
        .eq("id", pendingDeleteId);

      if (error) {
        console.error("Erreur lors de la suppression :", error);
        setMessage("Erreur lors de la suppression");
        return;
      }

      setMessage("Poids supprimé avec succès !");
      setPoidsLogs(poidsLogs.filter((log) => log.id !== pendingDeleteId));
    } catch (error) {
      console.error("Erreur :", error);
      setMessage("Erreur lors de la suppression");
    } finally {
      setDeletingId(null);
      setPendingDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <p>Chargement...</p>
      </div>
    );
  }

  // Récupérer le dernier poids enregistré
  const poidsActuel = poidsLogs.length > 0 ? poidsLogs[0].poids : null;
  // Formater la date de création
  const dateCreation =
    client && client.created_at
      ? new Date(client.created_at).toLocaleDateString()
      : "-";

  const renderTabs = () => {
    const tabs = [
      { id: "programme", label: "Programme" },
      { id: "evolution", label: "Évolution" },
      { id: "nutrition", label: "Nutrition" },
      { id: "morpho", label: "Morpho-anatomie" },
    ];
    return (
      <div className="border-b border-gray-200 mb-6">
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

  const renderTabContent = () => {
    switch (activeTab) {
      case "programme":
        return (
          <div className="p-4">
            <WeeklySchedule clientId={id} />
          </div>
        );
      case "evolution":
        return (
          <div className="p-4">
            {/* Ajout Poids + Historique (interface actuelle) */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Ajouter un poids</h2>
              <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                <input
                  type="number"
                  placeholder="Poids en kg"
                  value={poids}
                  onChange={(e) => setPoids(e.target.value)}
                  className="border rounded p-2 w-40"
                />
                <input
                  type="date"
                  value={datePoids}
                  onChange={(e) => setDatePoids(e.target.value)}
                  className="border rounded p-2 w-40"
                />
                <button
                  onClick={ajouterPoids}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Ajouter
                </button>
              </div>
              {message && (
                <p className="text-sm text-red-500 mb-2">{message}</p>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Historique des poids
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded shadow">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">
                        Poids (kg)
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {poidsLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="border-t px-4 py-2">{log.date}</td>
                        <td className="border-t px-4 py-2">{log.poids}</td>
                        <td className="border-t px-4 py-2">
                          <button
                            onClick={() => demanderSuppressionPoids(log.id)}
                            className="text-red-500 hover:underline"
                            disabled={deletingId === log.id}
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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

  return (
    <div className="p-4">
      {client ? (
        <>
          {/* Flèche retour */}
          <button
            onClick={() => navigate("/clients")}
            className="mb-4 flex items-center text-blue-700 hover:text-blue-900 transition-colors"
            title="Retour à la liste des clients"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Retour à la liste
          </button>
          {/* Carte de profil */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-blue-700 mb-1">
                {client.full_name}
              </h1>
              <p className="text-gray-600 mb-1">{client.email}</p>
              <p className="text-gray-500 text-sm">
                Compte créé le :{" "}
                <span className="font-medium">{dateCreation}</span>
              </p>
            </div>
            <div className="flex flex-col items-start md:items-end">
              <span className="text-gray-500 text-sm mb-1">Poids actuel</span>
              <span className="text-2xl font-semibold text-green-600">
                {poidsActuel !== null ? `${poidsActuel} kg` : "Non renseigné"}
              </span>
            </div>
          </div>
          {/* Onglets */}
          {renderTabs()}
          {/* Contenu de l'onglet */}
          {renderTabContent()}
          {/* Modal suppression poids (inchangé) */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-semibold mb-4">
                  Confirmer la suppression
                </h2>
                <p>Voulez-vous vraiment supprimer ce poids ?</p>
                <div className="flex justify-end space-x-2 mt-6">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={supprimerPoids}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <p>Client introuvable.</p>
      )}
    </div>
  );
};

export default ClientDetail;
