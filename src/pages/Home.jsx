// src/pages/Home.jsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import MainLayout from "../layouts/MainLayout";
import ClientCard from "../components/ClientCard";

const Home = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("full_name", { ascending: true });

      if (error) {
        console.error("Erreur de récupération :", error);
      } else {
        setClients(data);
      }
      setLoading(false);
    };

    fetchClients();
  }, []);

  return (
    <MainLayout>
      <h1 className="text-3xl font-bold text-blue-700 mb-6">
        Liste des clients
      </h1>

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
