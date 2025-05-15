import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

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

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Ajouter un poids</h2>
            <form
              className="flex flex-col md:flex-row md:items-center gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                ajouterPoids();
              }}
            >
              <input
                type="number"
                step="0.1"
                value={poids}
                onChange={(e) => setPoids(e.target.value)}
                className="border p-2 rounded w-40"
                placeholder="Poids en kg"
              />
              <input
                type="date"
                value={datePoids}
                onChange={(e) => setDatePoids(e.target.value)}
                className="border p-2 rounded w-40"
              />
              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Ajouter
              </button>
            </form>
            {message && (
              <p
                className={`mt-2 text-sm ${
                  message.includes("Erreur") ? "text-red-600" : "text-green-600"
                }`}
              >
                {message}
              </p>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Historique des poids</h2>
            {poidsLogs.length === 0 ? (
              <p>Aucun poids enregistré</p>
            ) : (
              <div className="w-full flex justify-center">
                <div className="w-full max-w-xl bg-white rounded-lg shadow-md overflow-hidden">
                  <table className="min-w-full">
                    <thead className="bg-blue-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider rounded-tl-lg">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">
                          Poids (kg)
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-blue-700 uppercase tracking-wider rounded-tr-lg">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {poidsLogs.map((log) => (
                        <tr
                          key={log.id}
                          className="hover:bg-blue-50 transition-colors"
                        >
                          <td className="border-t px-6 py-3 text-gray-800">
                            {log.date}
                          </td>
                          <td className="border-t px-6 py-3 text-gray-800">
                            {log.poids}
                          </td>
                          <td className="border-t px-6 py-3 text-right">
                            <button
                              className="text-red-500 hover:underline text-sm"
                              onClick={() => demanderSuppressionPoids(log.id)}
                              disabled={deletingId === log.id}
                            >
                              {deletingId === log.id
                                ? "Suppression..."
                                : "Supprimer"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <p>Client non trouvé</p>
      )}

      {/* Modale de confirmation de suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4 text-red-600">
              Confirmer la suppression
            </h3>
            <p className="mb-6">
              Voulez-vous vraiment supprimer ce poids&nbsp;?
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                onClick={() => setShowDeleteModal(false)}
              >
                Annuler
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                onClick={supprimerPoids}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDetail;
