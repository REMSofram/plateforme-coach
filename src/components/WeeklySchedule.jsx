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
  
  // États pour la suppression
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // États pour la duplication
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateOptions, setDuplicateOptions] = useState({
    repeat: 'none', // 'none', 'weekly', 'biweekly', 'monthly'
    occurrences: 4,
    startDate: ''
  });
  const [isDuplicating, setIsDuplicating] = useState(false);
  
  // État pour les notifications
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  
  // Afficher une notification temporaire
  const showNotification = (message, type = 'success', duration = 5000) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, duration);
  };

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
      console.log('Tentative de création d\'une séance pour la date:', date);
      
      // Récupérer l'utilisateur connecté
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        throw new Error('Vous devez être connecté pour créer une séance');
      }
      
      console.log('Utilisateur connecté:', authUser.id);
      
      // Vérifier que l'utilisateur est un coach
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', authUser.id)
        .single();

      if (userError || !userData) {
        console.error('Erreur lors de la récupération du profil utilisateur:', userError);
        throw new Error('Erreur lors de la vérification de votre profil');
      }
      
      if (userData.role !== 'coach') {
        throw new Error('Accès refusé : vous devez être un coach pour créer une séance');
      }

      console.log('Vérification du client et de la relation coach-client. Coach:', authUser.id, 'Client:', clientId);
      
      // 1. Vérifier d'abord que le client existe et a le bon rôle
      const { data: clientData, error: clientError } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', clientId)
        .eq('role', 'client')
        .single();
        
      console.log('Résultat de la vérification du client:', { clientData, clientError });

      if (clientError || !clientData) {
        console.error('Client non trouvé ou rôle invalide:', clientError);
        throw new Error('Client introuvable ou non autorisé');
      }
      
      // 2. Vérifier la relation coach-client dans la table coach_clients
      console.log('Vérification de la relation dans coach_clients...');
      const { data: relationData, error: relationError } = await supabase
        .from('coach_clients')
        .select('*')
        .eq('coach_id', authUser.id)
        .eq('client_id', clientId);
        
      console.log('Résultat de la vérification de la relation coach_clients:', { 
        coach_id: authUser.id, 
        client_id: clientId,
        relationData, 
        relationError 
      });

      if (relationError) {
        console.error('Erreur lors de la vérification de la relation:', relationError);
        throw new Error('Erreur lors de la vérification des autorisations');
      }
      
      if (!relationData || relationData.length === 0) {
        console.error('Aucune relation coach-client trouvée pour cette paire');
        // Créer automatiquement la relation si elle n'existe pas (pour le développement)
        const { data: newRelation, error: createRelationError } = await supabase
          .from('coach_clients')
          .insert([
            { coach_id: authUser.id, client_id: clientId }
          ]);
          
        if (createRelationError) {
          console.error('Échec de la création de la relation coach-client:', createRelationError);
          throw new Error('Impossible de créer la relation avec ce client');
        }
        
        console.log('Nouvelle relation coach-client créée:', newRelation);
      }

      // Si tout est bon, créer la session
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
      alert(error.message);
    }
  };

  const handleSessionClick = (session) => {
    console.log('handleSessionClick appelé avec session:', session);
    console.log('Session actuellement sélectionnée:', selectedSession);
    
    // Vérifier si la session est déjà sélectionnée
    const isSameSession = selectedSession && selectedSession.id === session.id;
    console.log('Est-ce la même session?', isSameSession);
    
    if (isSameSession) {
      console.log('Désélection de la session');
      setSelectedSession(null);
    } else {
      console.log('Nouvelle session sélectionnée');
      setSelectedSession(session);
    }
  };
  
  const handleDeleteClick = (session, e) => {
    e.stopPropagation();
    setSessionToDelete(session);
    setShowDeleteModal(true);
  };
  
  const handleDuplicateClick = (session, e) => {
    e.stopPropagation();
    setSessionToDelete(session);
    setDuplicateOptions({
      ...duplicateOptions,
      startDate: session.date,
      repeat: 'none',
      occurrences: 4
    });
    setShowDuplicateModal(true);
  };

  const handleDuplicateSession = async () => {
    if (!sessionToDelete) return;
    
    setIsDuplicating(true);
    try {
      const { repeat, occurrences, startDate } = duplicateOptions;
      const baseSession = { ...sessionToDelete };
      delete baseSession.id; // Supprimer l'ID pour en créer un nouveau
      
      const sessionsToCreate = [];
      const baseDate = new Date(startDate);
      
      // Si pas de récurrence, on crée juste une copie pour le jour suivant
      if (repeat === 'none') {
        const nextDay = new Date(baseDate);
        nextDay.setDate(baseDate.getDate() + 1); // Créer pour le jour suivant
        
        sessionsToCreate.push({
          ...baseSession,
          date: nextDay.toISOString().split('T')[0]
        });
      } else {
        // Calculer les dates de récurrence
        for (let i = 1; i <= occurrences; i++) {
          const newDate = new Date(baseDate);
          
          // Ajouter le délai en fonction du type de récurrence
          switch (repeat) {
            case 'weekly':
              newDate.setDate(baseDate.getDate() + (i * 7));
              break;
            case 'biweekly':
              newDate.setDate(baseDate.getDate() + (i * 14));
              break;
            case 'monthly':
              newDate.setMonth(baseDate.getMonth() + i);
              break;
            default:
              break;
          }
          
          sessionsToCreate.push({
            ...baseSession,
            date: newDate.toISOString().split('T')[0]
          });
        }
      }
      
      // Insérer les nouvelles sessions
      const { data, error } = await supabase
        .from('sessions')
        .insert(sessionsToCreate)
        .select();
        
      if (error) throw error;
      
      // Mettre à jour l'état local avec les nouvelles sessions
      setSessions(prev => {
        const newSessions = { ...prev };
        
        data.forEach(session => {
          const dateStr = format(parseISO(session.date), 'yyyy-MM-dd');
          if (!newSessions[dateStr]) {
            newSessions[dateStr] = [];
          }
          newSessions[dateStr].push(session);
        });
        
        return newSessions;
      });
      
      // Fermer la modale
      setShowDuplicateModal(false);
      setSessionToDelete(null);
      
      // Afficher une notification de succès
      const successMessage = `Séance${occurrences > 1 ? 's' : ''} dupliquée${occurrences > 1 ? 's' : ''} avec succès !`;
      showNotification(successMessage, 'success');
    } catch (error) {
      console.error('Erreur lors de la duplication de la séance:', error);
      showNotification('Erreur lors de la duplication de la séance', 'error');
    } finally {
      setIsDuplicating(false);
    }
  };
  
  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("sessions")
        .delete()
        .eq("id", sessionToDelete.id);

      if (error) throw error;

      // Mettre à jour l'état local
      setSessions(prev => {
        const newSessions = { ...prev };
        const dateStr = format(parseISO(sessionToDelete.date), "yyyy-MM-dd");
        if (newSessions[dateStr]) {
          newSessions[dateStr] = newSessions[dateStr].filter(
            s => s.id !== sessionToDelete.id
          );
        }
        return newSessions;
      });

      // Fermer la modale et réinitialiser
      setShowDeleteModal(false);
      setSessionToDelete(null);
      
      // Désélectionner la session supprimée si elle était sélectionnée
      if (selectedSession?.id === sessionToDelete.id) {
        setSelectedSession(null);
      }
      
    } catch (error) {
      console.error("Erreur lors de la suppression de la séance:", error);
      alert("Erreur lors de la suppression de la séance");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateSession = async (updatedSession) => {
    if (!updatedSession) return;

    try {
      const { error } = await supabase
        .from("sessions")
        .update({
          title: updatedSession.title,
          description: updatedSession.description,
        })
        .eq("id", updatedSession.id);

      if (error) throw error;

      // Mettre à jour l'état local
      setSessions((prev) => {
        const newSessions = { ...prev };
        const dateStr = format(parseISO(updatedSession.date), "yyyy-MM-dd");
        if (newSessions[dateStr]) {
          newSessions[dateStr] = newSessions[dateStr].map((s) =>
            s.id === updatedSession.id ? updatedSession : s
          );
        }
        return newSessions;
      });

      // Mettre à jour la session sélectionnée si c'est la même
      if (selectedSession?.id === updatedSession.id) {
        setSelectedSession(updatedSession);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la séance:", error);
      alert("Erreur lors de la mise à jour de la séance");
    }
  };

  if (loading) {
    return <div className="p-4">Chargement...</div>;
  }

  // Styles pour les notifications
  const notificationStyles = {
    success: 'bg-green-100 border-green-500 text-green-700',
    error: 'bg-red-100 border-red-500 text-red-700',
    info: 'bg-blue-100 border-blue-500 text-blue-700'
  };

  return (
    <div className="p-4 relative">
      {/* Notification */}
      {notification.show && (
        <div 
          className={`fixed top-4 right-4 border-l-4 p-4 rounded shadow-lg z-50 ${notificationStyles[notification.type]}`}
          style={{ minWidth: '300px' }}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="font-medium">
                {notification.type === 'success' ? 'Succès' : 'Erreur'}
              </p>
              <p className="text-sm">{notification.message}</p>
            </div>
            <button
              onClick={() => setNotification(prev => ({ ...prev, show: false }))}
              className="ml-4 text-gray-500 hover:text-gray-700"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
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
            // Créer une clé unique pour chaque session en incluant la date et l'ID
            const sortedSessions = [...daySessions].sort((a, b) => 
              new Date(a.created_at || 0) - new Date(b.created_at || 0)
            );

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
                    items={sortedSessions.map(
                      (session) => `session-${dateStr}-${session.id}`
                    )}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {sortedSessions.map((session) => (
                        <SessionCard
                          key={`${dateStr}-${session.id}-${session.created_at || ''}`}
                          session={session}
                          date={dateStr}
                          onClick={handleSessionClick}
                          onDelete={handleDeleteClick}
                          onDuplicate={handleDuplicateClick}
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

      {/* Modale de confirmation de suppression */}
      {showDeleteModal && sessionToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-red-600 mb-4">
              Supprimer la séance
            </h3>
            <p className="mb-6">
              Êtes-vous sûr de vouloir supprimer cette séance ? Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSessionToDelete(null);
                }}
                className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
                disabled={isDeleting}
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteSession}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                disabled={isDeleting}
              >
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de duplication de séance */}
      {showDuplicateModal && sessionToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-blue-700 mb-4">
              Dupliquer la séance
            </h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Répétition
                </label>
                <select
                  value={duplicateOptions.repeat}
                  onChange={(e) => setDuplicateOptions({
                    ...duplicateOptions,
                    repeat: e.target.value
                  })}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="none">Ne pas répéter</option>
                  <option value="weekly">Toutes les semaines</option>
                  <option value="biweekly">Toutes les 2 semaines</option>
                  <option value="monthly">Tous les mois</option>
                </select>
              </div>
              
              {duplicateOptions.repeat !== 'none' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre d'occurrences (max 12)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={duplicateOptions.occurrences}
                    onChange={(e) => setDuplicateOptions({
                      ...duplicateOptions,
                      occurrences: Math.min(12, Math.max(1, parseInt(e.target.value) || 1))
                    })}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de début
                </label>
                <input
                  type="date"
                  value={duplicateOptions.startDate}
                  onChange={(e) => setDuplicateOptions({
                    ...duplicateOptions,
                    startDate: e.target.value
                  })}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDuplicateModal(false)}
                className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
                disabled={isDuplicating}
              >
                Annuler
              </button>
              <button
                onClick={handleDuplicateSession}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                disabled={isDuplicating}
              >
                {isDuplicating ? 'Duplication en cours...' : 'Dupliquer'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Panneau de détails de la séance */}
      {selectedSession && (
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold text-blue-700">
              Détails de la séance
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={(e) => handleDuplicateClick(selectedSession, e)}
                className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-100"
                title="Dupliquer la séance"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={(e) => handleDeleteClick(selectedSession, e)}
                className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100"
                title="Supprimer la séance"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedSession(null);
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
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
          </div>
        </div>
      )}
    </div>
  );
}

export default WeeklySchedule;
