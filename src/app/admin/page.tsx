// src/app/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/button';
import TechnicianManager from '@/components/admin/technician-manager';
import BookingsManager from '@/components/admin/bookings-manager';

interface User {
  uid: string;
  email: string;
  role: 'admin' | 'user';
  lastSignInTime?: string;
  creationTime?: string;
}

export default function AdminPage() {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (!loading && (!user || userRole !== 'admin')) {
      router.push('/');
      return;
    }

    if (user && userRole === 'admin') {
      fetchUsers();
    }
  }, [user, userRole, loading, router]);

  const copyBookingLink = async () => {
    const bookingUrl = `${window.location.origin}/booking`;
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
      alert('Error al copiar el enlace');
    }
  };

  const fetchUsers = async () => {
    if (!user) return;
    
    setLoadingUsers(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        console.error('Error fetching users:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const updateUserRole = async (uid: string, newRole: 'admin' | 'user') => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user?.getIdToken()}`,
        },
        body: JSON.stringify({ uid, role: newRole }),
      });

      if (response.ok) {
        // Actualizar la lista local
        setUsers(users.map(u => u.uid === uid ? { ...u, role: newRole } : u));
        alert('Rol actualizado exitosamente');
      } else {
        alert('Error al actualizar el rol');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Error al actualizar el rol');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-black">Cargando...</div>
      </div>
    );
  }

  if (!user || userRole !== 'admin') {
    return null; // Redirigirá automáticamente
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-black">Panel de Administración</h1>
        <div className="flex gap-3">
          <Button 
            onClick={copyBookingLink}
            className={`transition-all ${copySuccess ? 'bg-green-600 hover:bg-green-700' : ''}`}
          >
            {copySuccess ? '✓ Link Copiado!' : '📋 Copiar Link de Reservas'}
          </Button>
          <Button onClick={() => router.push('/')} variant="secondary">
            ← Volver al Dashboard
          </Button>
        </div>
      </div>

      {/* Mensaje informativo del link */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">ℹ️</span>
          <div>
            <p className="font-semibold text-blue-900">Link de Reservas Públicas</p>
            <p className="text-sm text-blue-800 mt-1">
              Comparte este link con tus clientes para que puedan reservar citas directamente: 
              <span className="font-mono bg-white px-2 py-1 rounded ml-2 text-blue-600">
                {typeof window !== 'undefined' ? `${window.location.origin}/booking` : '/booking'}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold mb-4 text-black">Gestión de Usuarios</h2>

        {loadingUsers ? (
          <div className="text-center py-8 text-black">Cargando usuarios...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-black font-semibold">Email</th>
                  <th className="px-4 py-3 text-left text-black font-semibold">Rol</th>
                  <th className="px-4 py-3 text-left text-black font-semibold">Último Acceso</th>
                  <th className="px-4 py-3 text-left text-black font-semibold">Fecha de Creación</th>
                  <th className="px-4 py-3 text-left text-black font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.uid} className="border-t">
                    <td className="px-4 py-3 text-black">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-sm ${
                        user.role === 'admin'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {user.lastSignInTime ? new Date(user.lastSignInTime).toLocaleDateString() : 'Nunca'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {user.creationTime ? new Date(user.creationTime).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      {user.role === 'admin' ? (
                        <Button
                          onClick={() => updateUserRole(user.uid, 'user')}
                          variant="secondary"
                          className="text-sm"
                        >
                          Degradar a Usuario
                        </Button>
                      ) : (
                        <Button
                          onClick={() => updateUserRole(user.uid, 'admin')}
                          className="text-sm"
                        >
                          Promover a Admin
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Gestión de Reservas Públicas */}
      <BookingsManager />

      {/* Gestión de Técnicos */}
      <TechnicianManager />
    </div>
  );
}