import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const ClientDetail = () => {
  const { id } = useParams(); // id du client depuis l'URL
  const [client, setClient] = useState(null);
  const [poids, setPoids] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchClient = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Erreur récupération client :", error);
      } else {
        setClient(data);
      }
    };

    fetchClient();
  }, [id]);

  const ajouterPoids = async () => {
    const { error } = await supabase.from("poids_logs").insert([
      {
        user_id: id,
        date: new Date().toISOString().split("T")[0],
        poids: parseFloat(poids),
      },
    ]);

    if (error) {
      console.error(error);
      setMessage("Erreur à l'ajout.");
    } else {
      setMessage("Poids ajouté !");
      setPoids("");
    }
  };

  return (
    <div className="p-4">
      {client ? (
        <>
          <h1 className="text-2xl font-bold mb-4">{client.full_name}</h1>
          <p className="mb-6 text-gray-600">{client.email}</p>

          <div className="mb-4">
            <label className="block mb-1">Ajouter un poids (kg)</label>
            <input
              type="number"
              value={poids}
              onChange={(e) => setPoids(e.target.value)}
              className="border p-2 rounded w-40"
            />
            <button
              className="ml-4 bg-green-500 text-white px-4 py-2 rounded"
              onClick={ajouterPoids}
            >
              Ajouter
            </button>
          </div>
          {message && <p className="text-sm text-blue-600">{message}</p>}
        </>
      ) : (
        <p>Chargement...</p>
      )}
    </div>
  );
};

export default ClientDetail;
