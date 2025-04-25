import { Link } from "react-router-dom";

const ClientCard = ({ client }) => {
  return (
    <Link to={`/client/${client.id}`}>
      <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition hover:bg-gray-50 cursor-pointer">
        <h2 className="text-xl font-semibold text-gray-800">
          {client.full_name}
        </h2>
        <p className="text-gray-600">{client.email}</p>
        <p className="mt-2 text-sm text-gray-500">Rôle : {client.role}</p>
        <p className="text-sm text-gray-500">Poids : {client.weight} kg</p>
      </div>
    </Link>
  );
};

export default ClientCard;
