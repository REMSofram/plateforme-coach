import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { format, startOfWeek, addDays, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "../lib/supabaseClient";
import SessionCard from "./SessionCard";

function WeeklySchedule({ clientId }) {
  const [sessions, setSessions] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [selectedSession, setSelectedSession] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Générer les jours de la semaine
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(currentWeekStart, i)
  );

  // Charger les sessions pour la semaine en cours
  useEffect(() => {
    fetchSessions();
  }, [currentWeekStart, clientId]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const weekEnd = addDays(currentWeekStart, 6);
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("client_id", clientId)
        .gte("date", currentWeekStart.toISOString())
        .lte("date", weekEnd.toISOString());

      if (error) throw error;

      // Organiser les sessions par jour
      const sessionsByDay = {};
      weekDays.forEach((day) => {
        sessionsByDay[format(day, "yyyy-MM-dd")] = data.filter(
          (session) =>
            format(parseISO(session.date), "yyyy-MM-dd") ===
            format(day, "yyyy-MM-dd")
        );
      });

      setSessions(sessionsByDay);
    } catch (error) {
      console.error("Erreur lors du chargement des sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    const [oldDate, sessionId] = active.id.split("-");
    const newDate = over.id;

    if (oldDate === newDate) return;

    try {
      // Mettre à jour la date dans Supabase
      const { error } = await supabase
        .from("sessions")
        .update({ date: newDate })
        .eq("id", sessionId);

      if (error) throw error;

      // Mettre à jour l'état local
      setSessions((prev) => {
        const newSessions = { ...prev };
        const session = newSessions[oldDate].find((s) => s.id === sessionId);

        // Retirer la session de l'ancienne date
        newSessions[oldDate] = newSessions[oldDate].filter(
          (s) => s.id !== sessionId
        );

        // Ajouter la session à la nouvelle date
        if (!newSessions[newDate]) {
          newSessions[newDate] = [];
        }
        newSessions[newDate] = [
          ...newSessions[newDate],
          { ...session, date: newDate },
        ];

        return newSessions;
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la session:", error);
    }
  };

  const handleAddSession = async (date) => {
    try {
      const { data, error } = await supabase
        .from("sessions")
        .insert([
          {
            client_id: clientId,
            title: "Nouvelle séance",
            description: "",
            date: date,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setSessions((prev) => ({
        ...prev,
        [date]: [...(prev[date] || []), data],
      }));

      // Sélectionner automatiquement la nouvelle séance
      setSelectedSession(data);
    } catch (error) {
      console.error("Erreur lors de la création de la session:", error);
    }
  };

  const handleSessionClick = (session) => {
    setSelectedSession(session);
  };

  const handleUpdateSession = async (updatedSession) => {
    try {
      const { error } = await supabase
        .from("sessions")
        .update(updatedSession)
        .eq("id", updatedSession.id);

      if (error) throw error;

      // Mettre à jour l'état local
      setSessions((prev) => {
        const newSessions = { ...prev };
        const dateStr = format(parseISO(updatedSession.date), "yyyy-MM-dd");
        newSessions[dateStr] = newSessions[dateStr].map((s) =>
          s.id === updatedSession.id ? updatedSession : s
        );
        return newSessions;
      });

      setSelectedSession(updatedSession);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la session:", error);
    }
  };

  if (loading) {
    return <div className="p-4">Chargement...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between mb-4">
        <button
          onClick={() => setCurrentWeekStart(addDays(currentWeekStart, -7))}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Semaine précédente
        </button>
        <button
          onClick={() => setCurrentWeekStart(addDays(currentWeekStart, 7))}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Semaine suivante
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-7 gap-4">
          {weekDays.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const daySessions = sessions[dateStr] || [];

            return (
              <div
                key={dateStr}
                className="min-h-[200px] bg-gray-50 rounded-lg p-2"
              >
                <div
                  className={`rounded-lg p-2 ${
                    format(day, "yyyy-MM-dd") ===
                    format(new Date(), "yyyy-MM-dd")
                      ? "bg-blue-100 border-2 border-blue-500"
                      : ""
                  }`}
                >
                  <div
                    className={`font-semibold mb-2 ${
                      format(day, "yyyy-MM-dd") ===
                      format(new Date(), "yyyy-MM-dd")
                        ? "text-blue-700"
                        : ""
                    }`}
                  >
                    {format(day, "EEEE d MMMM", { locale: fr })}
                  </div>
                  <SortableContext
                    items={daySessions.map(
                      (session) => `${dateStr}-${session.id}`
                    )}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {daySessions.map((session) => (
                        <SessionCard
                          key={session.id}
                          session={session}
                          date={dateStr}
                          onClick={() => handleSessionClick(session)}
                          isSelected={selectedSession?.id === session.id}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </div>
                <button
                  onClick={() => handleAddSession(dateStr)}
                  className="mt-2 w-full p-2 text-sm text-gray-500 hover:text-gray-700 border border-dashed border-gray-300 rounded hover:border-gray-400"
                >
                  + Ajouter une séance
                </button>
              </div>
            );
          })}
        </div>
      </DndContext>

      {/* Panneau de détails de la séance */}
      {selectedSession && (
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold text-blue-700">
              Détails de la séance
            </h2>
            <button
              onClick={() => setSelectedSession(null)}
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titre
              </label>
              <input
                type="text"
                value={selectedSession.title}
                onChange={(e) =>
                  handleUpdateSession({
                    ...selectedSession,
                    title: e.target.value,
                  })
                }
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={selectedSession.description || ""}
                onChange={(e) =>
                  handleUpdateSession({
                    ...selectedSession,
                    description: e.target.value,
                  })
                }
                rows={4}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Heure de début
                </label>
                <input
                  type="time"
                  value={selectedSession.start_time || ""}
                  onChange={(e) =>
                    handleUpdateSession({
                      ...selectedSession,
                      start_time: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Heure de fin
                </label>
                <input
                  type="time"
                  value={selectedSession.end_time || ""}
                  onChange={(e) =>
                    handleUpdateSession({
                      ...selectedSession,
                      end_time: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WeeklySchedule;
