import React from "react";

function Home() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-semibold text-blue-700 mb-6">
        Bienvenue sur votre plateforme de coaching
      </h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-lg mb-4">
          Cette plateforme vous permet de gérer vos clients et leur suivi de
          manière efficace.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-blue-700 mb-3">
              Gestion des clients
            </h2>
            <p className="text-gray-600">
              Accédez à la liste de vos clients, ajoutez-en de nouveaux et
              suivez leur progression.
            </p>
          </div>
          <div className="bg-green-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-green-700 mb-3">
              Suivi personnalisé
            </h2>
            <p className="text-gray-600">
              Suivez les objectifs et les progrès de chaque client de manière
              individualisée.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
