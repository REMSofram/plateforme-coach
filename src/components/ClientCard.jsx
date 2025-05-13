import { Link } from "react-router-dom";
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

function ClientCard({ client, onClientDeleted }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", client.id);

      if (error) throw error;

      onClientDeleted(client.id);
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      alert("Erreur lors de la suppression du client");
    } finally {
      setIsDeleting(false);
      setShowDropdown(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 relative">
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowDropdown(!showDropdown);
          }}
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
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
            />
          </svg>
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-30">
            <div className="py-1">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                {isDeleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        )}
      </div>

      <Link to={`/client/${client.id}`} className="block">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          {client.full_name}
        </h3>
        <p className="text-gray-600">{client.email}</p>
      </Link>
    </div>
  );
}

export default ClientCard;
