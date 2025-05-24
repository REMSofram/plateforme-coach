import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SessionCard({ session, date, onClick, isSelected }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `${date}-${session.id}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`bg-white p-3 rounded shadow-sm cursor-pointer hover:shadow-md transition-shadow ${
        isSelected ? "ring-2 ring-blue-500" : ""
      }`}
    >
      <h3 className="font-medium text-gray-900">{session.title}</h3>
      {session.description && (
        <p className="text-sm text-gray-600 mt-1">{session.description}</p>
      )}
      {session.start_time && session.end_time && (
        <p className="text-xs text-gray-500 mt-1">
          {session.start_time} - {session.end_time}
        </p>
      )}
    </div>
  );
}

export default SessionCard;
