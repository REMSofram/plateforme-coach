function Sidebar() {
  return (
    <div className="w-64 bg-blue-800 text-white p-6">
      <h2 className="text-2xl font-bold mb-6">Bienvenue Coach</h2>
      <nav>
        <ul className="space-y-4">
          <li>
            <a href="#" className="hover:text-blue-200">
              Voir mes clients
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-blue-200">
              Ajouter un suivi
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-blue-200">
              Stats générales
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-blue-200">
              Profil
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-blue-200">
              Déconnexion
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default Sidebar;
