function Header() {
  return (
    <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
      <h1 className="text-xl font-semibold">Tableau de bord Coach</h1>
      <button className="bg-blue-800 px-4 py-2 rounded-md hover:bg-blue-700">
        Notifications
      </button>
    </div>
  );
}

export default Header;
