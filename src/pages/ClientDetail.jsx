import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import MainLayout from "../layouts/MainLayout";

const ClientDetail = () => {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [poids, setPoids] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [poidsLogs, setPoidsLogs] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

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
          .order("date", { ascending: false });

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
          date: new Date().toISOString().split("T")[0],
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

      // Rafraîchir la liste des poids
      const { data, error: fetchError } = await supabase
        .from("poids_logs")
        .select("*")
        .eq("user_id", id)
        .order("date", { ascending: false });

      if (!fetchError) {
        setPoidsLogs(data || []);
      }
    } catch (error) {
      console.error("Erreur :", error);
      setMessage("Erreur lors de l'ajout du poids");
    }
  };

  const supprimerPoids = async (poidsId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette entrée ?")) {
      return;
    }

    setDeletingId(poidsId);
    try {
      const { error } = await supabase
        .from("poids_logs")
        .delete()
        .eq("id", poidsId);

      if (error) {
        console.error("Erreur lors de la suppression :", error);
        setMessage("Erreur lors de la suppression");
        return;
      }

      setMessage("Poids supprimé avec succès !");
      setPoidsLogs(poidsLogs.filter((log) => log.id !== poidsId));
    } catch (error) {
      console.error("Erreur :", error);
      setMessage("Erreur lors de la suppression");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="p-4">
          <p>Chargement...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4">
        {client ? (
          <>
            <h1 className="text-2xl font-bold mb-4">{client.full_name}</h1>
            <p className="mb-6 text-gray-600">{client.email}</p>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Ajouter un poids</h2>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  step="0.1"
                  value={poids}
                  onChange={(e) => setPoids(e.target.value)}
                  className="border p-2 rounded w-40"
                  placeholder="Poids en kg"
                />
                <button
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  onClick={ajouterPoids}
                >
                  Ajouter
                </button>
              </div>
              {message && (
                <p
                  className={`mt-2 text-sm ${
                    message.includes("Erreur")
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {message}
                </p>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">
                Historique des poids
              </h2>
              {poidsLogs.length === 0 ? (
                <p className="text-gray-500">Aucun poids enregistré</p>
              ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Poids (kg)
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {poidsLogs.map((log) => (
                        <tr key={log.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(log.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {log.poids} kg
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => supprimerPoids(log.id)}
                              disabled={deletingId === log.id}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            >
                              {deletingId === log.id ? (
                                "Suppression..."
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <p>Client non trouvé</p>
        )}
      </div>
    </MainLayout>
  );
};

export default ClientDetail;
