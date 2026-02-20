// src/app/api/booking/events/[eventId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { updateCalendarEvent } from '@/lib/google-calendar';
import { auth, db } from '@/lib/firebase-admin';

export async function PUT(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);

    // Verificar que sea admin
    if (decodedToken.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { technicianId, technicianName } = await request.json();
    const eventId = params.eventId;

    if (!technicianId || !technicianName) {
      return NextResponse.json(
        { error: 'technicianId y technicianName son requeridos' },
        { status: 400 }
      );
    }

    // Actualizar el evento en Google Calendar
    const updatedEvent = await updateCalendarEvent(eventId, {
      extendedProperties: {
        private: {
          technicianId,
          technicianName,
          assignedAt: new Date().toISOString(),
        },
      },
    });

    // También actualizar en Firestore si existe el registro
    try {
      const bookingsRef = db.collection('bookings');
      const querySnapshot = await bookingsRef
        .where('googleEventId', '==', eventId)
        .limit(1)
        .get();

      if (!querySnapshot.empty) {
        const bookingDoc = querySnapshot.docs[0];
        await bookingDoc.ref.update({
          technicianId,
          technicianName,
          assignedAt: new Date(),
        });
      }
    } catch (firestoreError) {
      console.warn('No se pudo actualizar Firestore (evento puede no existir):', firestoreError);
    }

    return NextResponse.json({
      success: true,
      event: updatedEvent,
    });

  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Error al actualizar evento' },
      { status: 500 }
    );
  }
}
