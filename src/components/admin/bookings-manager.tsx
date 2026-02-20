// src/components/admin/bookings-manager.tsx
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Booking {
  id: string;
  googleEventId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  description: string;
  startDateTime: any;
  endDateTime: any;
  status: string;
  createdAt: any;
  htmlLink?: string;
  technicianId?: string;
  technicianName?: string;
}

interface Technician {
  id: string;
  name: string;
  city: string;
}

const BookingsManager = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchBookings();
      fetchTechnicians();
    }
  }, [user, filter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const token = await user?.getIdToken();
      
      const response = await fetch(`/api/booking/events?filter=${filter}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al obtener eventos');
      }

      const data = await response.json();
      setBookings(data.events || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const token = await user?.getIdToken();
      if (!token) return;

      const response = await fetch('/api/technicians', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTechnicians(data);
      }
    } catch (error) {
      console.error('Error fetching technicians:', error);
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
        fetchBookings();
      } else {
        alert('Error al asignar técnico');
      }
    } catch (error) {
      console.error('Error assigning technician:', error);
      alert('Error al asignar técnico');
    }
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Reservas de Clientes</h2>
        
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'upcoming'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Próximas
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'past'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Pasadas
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Todas
          </button>
          <button
            onClick={fetchBookings}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            title="Recargar eventos"
          >
            🔄
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-600">Cargando reservas...</div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-8 text-gray-600">
          No hay reservas {filter === 'upcoming' ? 'próximas' : filter === 'past' ? 'pasadas' : ''}
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {booking.clientName}
                  </h3>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">📧</span> {booking.clientEmail}
                    </p>
                    <p>
                      <span className="font-medium">📞</span> {booking.clientPhone}
                    </p>
                    <p>
                      <span className="font-medium">📅</span>{' '}
                      {formatDateTime(booking.startDateTime)} -{' '}
                      {new Date(booking.endDateTime).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {booking.description && (
                      <p className="mt-2">
                        <span className="font-medium">📝 Descripción:</span>{' '}
                        {booking.description}
                      </p>
                    )}
                    {booking.technicianName ? (
                      <p className="mt-2">
                        <span className="font-medium">👨‍🔧 Técnico Asignado:</span>{' '}
                        <span className="font-semibold text-green-700">{booking.technicianName}</span>
                      </p>
                    ) : (
                      <div className="mt-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Asignar Técnico:
                        </label>
                        <select
                          className="w-full max-w-xs px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                          value={booking.technicianId || ''}
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAssignTechnician(booking.googleEventId, e.target.value);
                            }
                          }}
                        >
                          <option value="">Seleccionar técnico...</option>
                          {technicians.map(tech => (
                            <option key={tech.id} value={tech.id}>
                              {tech.name} - {tech.city}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      booking.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : booking.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {booking.status === 'confirmed' ? 'Confirmada' : booking.status}
                  </span>
                  
                  <a
                    href={booking.htmlLink || `https://calendar.google.com/calendar/u/0/r/eventedit/${booking.googleEventId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Ver en Google Calendar →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingsManager;
