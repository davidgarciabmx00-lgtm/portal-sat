// src/app/calendar/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import WeeklyCalendar from '@/components/calendar/weekly-calendar';
import TaskForm from '@/components/tasks/task-form';
import Button from '@/components/ui/button';
import { format, startOfWeek } from 'date-fns';

interface Technician {
  id: string;
  name: string;
  city: string;
}

interface Task {
  id: string;
  technicianId: string;
  technicianName: string;
  startDate: any;
  endDate: any;
  description: string;
  links: string[];
}

interface CalendarEvent {
  id: string;
  googleEventId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  status: string;
  technicianId?: string;
  technicianName?: string;
}

export default function CalendarPage() {
  const { user, userRole } = useAuth();
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState<string>('');
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'));

  useEffect(() => {
    fetchTechnicians();
  }, []);

  useEffect(() => {
    fetchTasks(currentWeekStart);
    fetchEvents();
  }, [currentWeekStart, selectedTechnician]);

  const fetchTechnicians = async () => {
    try {
      const response = await fetch('/api/technicians');
      if (response.ok) {
        const data = await response.json();
        setTechnicians(data);
      }
    } catch (error) {
      console.error('Error fetching technicians:', error);
    }
  };

  const fetchTasks = async (weekStart: string) => {
    try {
      const token = await user?.getIdToken();
      if (!token) return;

      const params = new URLSearchParams({
        weekStart: weekStart,
      });
      if (selectedTechnician) {
        params.append('technicianId', selectedTechnician);
      }

      const response = await fetch(`/api/tasks?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const token = await user?.getIdToken();
      if (!token) return;

      const response = await fetch('/api/booking/events?filter=all', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Filtrar por técnico si está seleccionado
        let filteredEvents = data.events || [];
        if (selectedTechnician) {
          filteredEvents = filteredEvents.filter((event: CalendarEvent) => 
            event.technicianId === selectedTechnician
          );
        }
        setEvents(filteredEvents);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleAssignTechnician = async (eventId: string, technicianId: string) => {
    try {
      const token = await user?.getIdToken();
      if (!token) return;

      const technician = technicians.find(t => t.id === technicianId);
      if (!technician) return;

      const response = await fetch(`/api/booking/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          technicianId,
          technicianName: technician.name,
        }),
      });

      if (response.ok) {
        // Recargar eventos
        fetchEvents();
      } else {
        alert('Error al asignar técnico');
      }
    } catch (error) {
      console.error('Error assigning technician:', error);
      alert('Error al asignar técnico');
    }
  };

  const handleWeekChange = (weekStart: string) => {
    setCurrentWeekStart(weekStart);
  };

  const handleTaskDeleted = () => {
    fetchTasks(currentWeekStart);
  };

  const handleTaskCreated = () => {
    fetchTasks(currentWeekStart);
    fetchEvents();
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando calendario...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h1 className="text-2xl font-bold">Calendario de Tareas y Reservas</h1>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="min-w-0 flex-1 sm:flex-initial">
            <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Técnico</label>
            <select
              value={selectedTechnician}
              onChange={(e) => setSelectedTechnician(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            >
              <option value="">Todos los técnicos</option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.name} - {tech.city}
                </option>
              ))}
            </select>
          </div>

          {userRole === 'admin' && (
            <div className="flex-shrink-0">
              <Button onClick={() => setIsTaskFormOpen(true)}>
                Nueva Tarea
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <WeeklyCalendar 
          tasks={tasks} 
          events={events}
          technicians={technicians}
          onWeekChange={handleWeekChange} 
          onTaskDeleted={handleTaskDeleted}
          onAssignTechnician={handleAssignTechnician}
        />
      </div>

      {isTaskFormOpen && (
        <TaskForm
          onClose={() => setIsTaskFormOpen(false)}
          onTaskCreated={handleTaskCreated}
        />
      )}
    </div>
  );
}