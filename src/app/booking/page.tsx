// src/app/booking/page.tsx
'use client';

import { useState } from 'react';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

export default function BookingPage() {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'date' | 'slot' | 'form'>('date');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    description: '',
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleDateSelect = async (date: string) => {
    setSelectedDate(date);
    setLoading(true);
    setSubmitMessage(null);

    try {
      const response = await fetch(`/api/booking/availability?date=${date}`);
      if (response.ok) {
        const data = await response.json();
        setAvailableSlots(data.slots);
        setStep('slot');
      } else {
        setSubmitMessage({ type: 'error', text: 'Error al cargar disponibilidad' });
      }
    } catch (error) {
      console.error('Error:', error);
      setSubmitMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setStep('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    setSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await fetch('/api/booking/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          startDateTime: selectedSlot.start,
          endDateTime: selectedSlot.end,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitMessage({ 
          type: 'success', 
          text: '¡Reserva confirmada! Recibirás un email de confirmación.' 
        });
        // Resetear formulario después de 3 segundos
        setTimeout(() => {
          setStep('date');
          setSelectedDate('');
          setSelectedSlot(null);
          setFormData({ name: '', email: '', phone: '', description: '' });
          setSubmitMessage(null);
        }, 3000);
      } else {
        setSubmitMessage({ 
          type: 'error', 
          text: data.error || 'Error al crear la reserva' 
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setSubmitMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  // Obtener la fecha mínima (hoy)
  const today = new Date().toISOString().split('T')[0];
  // Obtener la fecha máxima (30 días desde hoy)
  const maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          Reserva tu Cita
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Selecciona una fecha y hora para tu visita técnica
        </p>

        {submitMessage && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              submitMessage.type === 'success'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {submitMessage.text}
          </div>
        )}

        {/* Paso 1: Seleccionar fecha */}
        {step === 'date' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecciona una fecha
              </label>
              <input
                type="date"
                min={today}
                max={maxDate}
                value={selectedDate}
                onChange={(e) => handleDateSelect(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
            {loading && (
              <div className="text-center text-gray-600">
                Cargando disponibilidad...
              </div>
            )}
          </div>
        )}

        {/* Paso 2: Seleccionar franja horaria */}
        {step === 'slot' && (
          <div className="space-y-6">
            <button
              onClick={() => setStep('date')}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
            >
              ← Cambiar fecha
            </button>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Franjas disponibles para {new Date(selectedDate).toLocaleDateString('es-ES')}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableSlots.filter(slot => slot.available).map((slot, index) => (
                  <button
                    key={index}
                    onClick={() => handleSlotSelect(slot)}
                    className="px-4 py-3 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors font-medium"
                  >
                    {formatTime(slot.start)}
                  </button>
                ))}
              </div>
              {availableSlots.filter(slot => slot.available).length === 0 && (
                <p className="text-gray-600 text-center py-8">
                  No hay franjas disponibles para esta fecha
                </p>
              )}
            </div>
          </div>
        )}

        {/* Paso 3: Formulario de datos */}
        {step === 'form' && selectedSlot && (
          <div className="space-y-6">
            <button
              onClick={() => setStep('slot')}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
            >
              ← Cambiar hora
            </button>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Fecha seleccionada:</p>
              <p className="font-semibold text-gray-800">
                {new Date(selectedDate).toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
              <p className="font-semibold text-blue-600">
                {formatTime(selectedSlot.start)} - {formatTime(selectedSlot.end)}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre completo *
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Tu nombre"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono *
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  placeholder="+34 600 000 000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción del problema (opcional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe brevemente el problema o servicio que necesitas..."
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full"
              >
                {submitting ? 'Procesando...' : 'Confirmar Reserva'}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
