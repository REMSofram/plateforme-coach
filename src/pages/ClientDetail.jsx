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
  const [activeTab, setActiveTab] = useState("evolution");

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
          <div className="p-4 space-y-10">
            {/* 1. Liste simple de séances */}
            <div>
              <h3 className="text-lg font-bold mb-2 text-blue-700">
                1. Liste simple de séances
              </h3>
              <ul className="list-disc pl-6 mb-2">
                <li>
                  Séance 1 : Full Body (3x10 Squat, 3x10 Développé couché, ...)
                </li>
                <li>Séance 2 : Cardio (30 min vélo, ...)</li>
              </ul>
              <div className="flex gap-2">
                <button className="bg-blue-500 text-white px-3 py-1 rounded">
                  Ajouter une séance
                </button>
                <button className="bg-gray-200 text-gray-700 px-3 py-1 rounded">
                  Modifier
                </button>
                <button className="bg-red-500 text-white px-3 py-1 rounded">
                  Supprimer
                </button>
              </div>
            </div>

            {/* 2. Tableau éditable */}
            <div>
              <h3 className="text-lg font-bold mb-2 text-blue-700">
                2. Tableau éditable
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded shadow">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-4 py-2">Exercice</th>
                      <th className="px-4 py-2">Séries</th>
                      <th className="px-4 py-2">Répétitions</th>
                      <th className="px-4 py-2">Charge</th>
                      <th className="px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border-t px-4 py-2">Squat</td>
                      <td className="border-t px-4 py-2">3</td>
                      <td className="border-t px-4 py-2">10</td>
                      <td className="border-t px-4 py-2">60kg</td>
                      <td className="border-t px-4 py-2 flex gap-2">
                        <button className="text-blue-600 hover:underline">
                          ✏️
                        </button>
                        <button className="text-red-500 hover:underline">
                          🗑️
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td className="border-t px-4 py-2">Développé couché</td>
                      <td className="border-t px-4 py-2">3</td>
                      <td className="border-t px-4 py-2">10</td>
                      <td className="border-t px-4 py-2">40kg</td>
                      <td className="border-t px-4 py-2 flex gap-2">
                        <button className="text-blue-600 hover:underline">
                          ✏️
                        </button>
                        <button className="text-red-500 hover:underline">
                          🗑️
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <button className="mt-2 bg-blue-500 text-white px-3 py-1 rounded">
                  Ajouter un exercice
                </button>
              </div>
            </div>

            {/* 3. Système de blocs/semaine */}
            <div>
              <h3 className="text-lg font-bold mb-2 text-blue-700">
                3. Blocs par semaine
              </h3>
              <div className="bg-gray-50 rounded p-4 mb-2">
                <h4 className="font-semibold mb-1">Semaine 1</h4>
                <ul className="list-disc pl-6">
                  <li>Lundi : Squat, Développé couché</li>
                  <li>Mercredi : Cardio, Abdos</li>
                  <li>Vendredi : Tractions, Dips</li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded p-4 mb-2">
                <h4 className="font-semibold mb-1">Semaine 2</h4>
                <ul className="list-disc pl-6">
                  <li>Lundi : Fentes, Rowing</li>
                  <li>Jeudi : Course, Gainage</li>
                </ul>
              </div>
              <button className="bg-blue-500 text-white px-3 py-1 rounded">
                Ajouter une semaine
              </button>
            </div>

            {/* 4. Affichage type cartes */}
            <div>
              <h3 className="text-lg font-bold mb-2 text-blue-700">
                4. Affichage type cartes
              </h3>
              <div className="flex flex-wrap gap-4">
                <div className="bg-white shadow rounded p-4 w-64">
                  <h4 className="font-semibold mb-2">Séance 1 : Full Body</h4>
                  <ul className="list-disc pl-6 mb-2">
                    <li>Squat</li>
                    <li>Développé couché</li>
                    <li>Rowing</li>
                  </ul>
                  <div className="flex gap-2">
                    <button className="bg-gray-200 text-gray-700 px-2 py-1 rounded">
                      Modifier
                    </button>
                    <button className="bg-red-500 text-white px-2 py-1 rounded">
                      Supprimer
                    </button>
                  </div>
                </div>
                <div className="bg-white shadow rounded p-4 w-64">
                  <h4 className="font-semibold mb-2">Séance 2 : Cardio</h4>
                  <ul className="list-disc pl-6 mb-2">
                    <li>Vélo</li>
                    <li>Course</li>
                  </ul>
                  <div className="flex gap-2">
                    <button className="bg-gray-200 text-gray-700 px-2 py-1 rounded">
                      Modifier
                    </button>
                    <button className="bg-red-500 text-white px-2 py-1 rounded">
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
              <button className="mt-4 bg-blue-500 text-white px-3 py-1 rounded">
                Ajouter une séance
              </button>
            </div>

            {/* 5. Blocs par semaine avec cartes de séances et tableau éditable */}
            <div>
              <h3 className="text-lg font-bold mb-2 text-blue-700">
                5. Blocs par semaine avec cartes de séances et tableau éditable
              </h3>
              <div className="space-y-6">
                {/* Semaine 1 */}
                <div className="bg-gray-50 rounded p-4">
                  <h4 className="font-semibold mb-3">Semaine 1</h4>
                  <div className="flex flex-wrap gap-4">
                    {/* Séance 1 */}
                    <div className="bg-white shadow rounded p-4 w-80">
                      <h5 className="font-semibold mb-2">
                        Séance 1 : Full Body
                      </h5>
                      <table className="min-w-full bg-white rounded shadow mb-2">
                        <thead className="bg-blue-50">
                          <tr>
                            <th className="px-2 py-1">Exercice</th>
                            <th className="px-2 py-1">Séries</th>
                            <th className="px-2 py-1">Répétitions</th>
                            <th className="px-2 py-1">Charge</th>
                            <th className="px-2 py-1">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border-t px-2 py-1">Squat</td>
                            <td className="border-t px-2 py-1">3</td>
                            <td className="border-t px-2 py-1">10</td>
                            <td className="border-t px-2 py-1">60kg</td>
                            <td className="border-t px-2 py-1 flex gap-1">
                              <button className="text-blue-600 hover:underline">
                                ✏️
                              </button>
                              <button className="text-red-500 hover:underline">
                                🗑️
                              </button>
                            </td>
                          </tr>
                          <tr>
                            <td className="border-t px-2 py-1">
                              Développé couché
                            </td>
                            <td className="border-t px-2 py-1">3</td>
                            <td className="border-t px-2 py-1">10</td>
                            <td className="border-t px-2 py-1">40kg</td>
                            <td className="border-t px-2 py-1 flex gap-1">
                              <button className="text-blue-600 hover:underline">
                                ✏️
                              </button>
                              <button className="text-red-500 hover:underline">
                                🗑️
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <button className="bg-blue-500 text-white px-2 py-1 rounded text-sm">
                        Ajouter un exercice
                      </button>
                    </div>
                    {/* Séance 2 */}
                    <div className="bg-white shadow rounded p-4 w-80">
                      <h5 className="font-semibold mb-2">Séance 2 : Cardio</h5>
                      <table className="min-w-full bg-white rounded shadow mb-2">
                        <thead className="bg-blue-50">
                          <tr>
                            <th className="px-2 py-1">Exercice</th>
                            <th className="px-2 py-1">Durée</th>
                            <th className="px-2 py-1">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border-t px-2 py-1">Vélo</td>
                            <td className="border-t px-2 py-1">30 min</td>
                            <td className="border-t px-2 py-1 flex gap-1">
                              <button className="text-blue-600 hover:underline">
                                ✏️
                              </button>
                              <button className="text-red-500 hover:underline">
                                🗑️
                              </button>
                            </td>
                          </tr>
                          <tr>
                            <td className="border-t px-2 py-1">Course</td>
                            <td className="border-t px-2 py-1">20 min</td>
                            <td className="border-t px-2 py-1 flex gap-1">
                              <button className="text-blue-600 hover:underline">
                                ✏️
                              </button>
                              <button className="text-red-500 hover:underline">
                                🗑️
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <button className="bg-blue-500 text-white px-2 py-1 rounded text-sm">
                        Ajouter un exercice
                      </button>
                    </div>
                  </div>
                  <button className="mt-4 bg-green-500 text-white px-3 py-1 rounded">
                    Ajouter une séance
                  </button>
                </div>
                {/* Semaine 2 */}
                <div className="bg-gray-50 rounded p-4">
                  <h4 className="font-semibold mb-3">Semaine 2</h4>
                  <div className="flex flex-wrap gap-4">
                    {/* Séance 1 */}
                    <div className="bg-white shadow rounded p-4 w-80">
                      <h5 className="font-semibold mb-2">
                        Séance 1 : Haut du corps
                      </h5>
                      <table className="min-w-full bg-white rounded shadow mb-2">
                        <thead className="bg-blue-50">
                          <tr>
                            <th className="px-2 py-1">Exercice</th>
                            <th className="px-2 py-1">Séries</th>
                            <th className="px-2 py-1">Répétitions</th>
                            <th className="px-2 py-1">Charge</th>
                            <th className="px-2 py-1">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border-t px-2 py-1">Tractions</td>
                            <td className="border-t px-2 py-1">4</td>
                            <td className="border-t px-2 py-1">8</td>
                            <td className="border-t px-2 py-1">PDC</td>
                            <td className="border-t px-2 py-1 flex gap-1">
                              <button className="text-blue-600 hover:underline">
                                ✏️
                              </button>
                              <button className="text-red-500 hover:underline">
                                🗑️
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <button className="bg-blue-500 text-white px-2 py-1 rounded text-sm">
                        Ajouter un exercice
                      </button>
                    </div>
                  </div>
                  <button className="mt-4 bg-green-500 text-white px-3 py-1 rounded">
                    Ajouter une séance
                  </button>
                </div>
              </div>
              <button className="mt-6 bg-blue-700 text-white px-4 py-2 rounded">
                Ajouter une semaine
              </button>
            </div>
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
