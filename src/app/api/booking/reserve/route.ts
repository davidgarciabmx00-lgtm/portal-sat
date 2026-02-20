// src/app/api/booking/reserve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createCalendarEvent, getAvailableSlots } from '@/lib/google-calendar';
import { db } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

interface ReservationData {
  name: string;
  email: string;
  phone: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: ReservationData = await request.json();

    // Validar campos requeridos
    if (!data.name || !data.email || !data.phone || !data.startDateTime || !data.endDateTime) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    const startDate = new Date(data.startDateTime);
    const endDate = new Date(data.endDateTime);

    // Validar que las fechas sean válidas
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Formato de fecha inválido' },
        { status: 400 }
      );
    }

    // Verificar disponibilidad en tiempo real
    const daySlots = await getAvailableSlots(startDate, { start: 9, end: 18 }, 60);
    const requestedSlot = daySlots.find(
      (slot) =>
        slot.start.getTime() === startDate.getTime() &&
        slot.end.getTime() === endDate.getTime()
    );

    if (!requestedSlot || !requestedSlot.available) {
      return NextResponse.json(
        { error: 'La franja horaria seleccionada ya no está disponible' },
        { status: 409 }
      );
    }

    // Crear evento en Google Calendar
    const calendarEvent = await createCalendarEvent({
      summary: `Cita - ${data.name}`,
      description: `
Cliente: ${data.name}
Email: ${data.email}
Teléfono: ${data.phone}
Descripción del problema: ${data.description || 'No especificado'}
      `.trim(),
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'Europe/Madrid',
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'Europe/Madrid',
      },
      // Nota: No incluimos attendees porque la service account requiere Domain-Wide Delegation
      // El email del cliente se guarda en Firestore y en la descripción del evento
      extendedProperties: {
        private: {
          clientName: data.name,
          clientEmail: data.email,
          clientPhone: data.phone,
          bookingType: 'public',
        },
      },
    });

    // Guardar información sensible en Firestore
    const bookingRef = await db.collection('bookings').add({
      googleEventId: calendarEvent.id,
      clientName: data.name,
      clientEmail: data.email,
      clientPhone: data.phone,
      description: data.description || '',
      startDateTime: Timestamp.fromDate(startDate),
      endDateTime: Timestamp.fromDate(endDate),
      status: 'confirmed',
      createdAt: Timestamp.now(),
    });

    return NextResponse.json({
      success: true,
      bookingId: bookingRef.id,
      eventId: calendarEvent.id,
      message: 'Reserva confirmada. Recibirás un email de confirmación.',
    }, { status: 201 });

  } catch (error) {
    console.error('Error al crear reserva:', error);
    return NextResponse.json(
      { error: 'Error al crear la reserva. Por favor, intenta de nuevo.' },
      { status: 500 }
    );
  }
}
