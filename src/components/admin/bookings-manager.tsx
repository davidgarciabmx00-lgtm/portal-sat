// src/components/admin/bookings-manager.tsx
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
}

const BookingsManager = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user, filter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const bookingsRef = collection(db, 'bookings');
      let q;

      const now = Timestamp.now();

      if (filter === 'upcoming') {
        q = query(
          bookingsRef,
          where('startDateTime', '>=', now),
          orderBy('startDateTime', 'asc')
        );
      } else if (filter === 'past') {
        q = query(
          bookingsRef,
          where('startDateTime', '<', now),
          orderBy('startDateTime', 'desc')
        );
      } else {
        q = query(bookingsRef, orderBy('startDateTime', 'desc'));
      }

      const snapshot = await getDocs(q);
      const bookingsData: Booking[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        bookingsData.push({
          id: doc.id,
          ...data,
          startDateTime: data.startDateTime?.toDate() || new Date(data.startDateTime),
          endDateTime: data.endDateTime?.toDate() || new Date(data.endDateTime),
          createdAt: data.createdAt?.toDate() || new Date(data.createdAt),
        } as Booking);
      });

      setBookings(bookingsData);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
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
                    href={`https://calendar.google.com/calendar/u/0/r/eventedit/${booking.googleEventId}`}
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
