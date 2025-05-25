function SessionCard({ session, date, onClick, isSelected }) {
  console.log('SessionCard rendue - ID:', session.id, 'Sélectionnée:', isSelected);
  
  const handleClick = () => {
    console.log('Clic sur la session:', session.id);
    onClick(session);
  };

  return (
    <div
      onClick={handleClick}
      className={`bg-white p-3 rounded shadow-sm cursor-pointer hover:shadow-md transition-shadow ${
        isSelected ? "ring-2 ring-blue-500" : ""
      }`}
    >
      <h3 className="font-medium text-gray-900">{session.title}</h3>
    </div>
  );
}

export default SessionCard;
