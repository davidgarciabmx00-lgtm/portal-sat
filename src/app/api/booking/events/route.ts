// src/app/api/booking/events/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCalendarEvents } from '@/lib/google-calendar';
import { auth } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    try {
      await auth.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Obtener parámetros de filtro
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'upcoming'; // upcoming, past, all

    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (filter === 'upcoming') {
      // Próximas: desde ahora hasta 1 año en el futuro
      startDate = now;
      endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    } else if (filter === 'past') {
      // Pasadas: desde 1 año atrás hasta ahora
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      endDate = now;
    } else {
      // Todas: desde 1 año atrás hasta 1 año adelante
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    }

    // Obtener eventos del calendario
    const events = await getCalendarEvents(startDate, endDate);

    // Formatear eventos para el cliente
    const formattedEvents = events.map((event: any) => ({
      id: event.id,
      googleEventId: event.id,
      summary: event.summary || 'Sin título',
      description: event.description || '',
      clientName: event.extendedProperties?.private?.clientName || 'Sin nombre',
      clientEmail: event.extendedProperties?.private?.clientEmail || '',
      clientPhone: event.extendedProperties?.private?.clientPhone || '',
      startDateTime: event.start?.dateTime || event.start?.date,
      endDateTime: event.end?.dateTime || event.end?.date,
      status: event.status || 'confirmed',
      htmlLink: event.htmlLink,
      createdAt: event.created,
    }));

    // Filtrar y ordenar según el tipo
    let filteredEvents = formattedEvents;
    
    if (filter === 'upcoming') {
      filteredEvents = formattedEvents
        .filter((event: any) => new Date(event.startDateTime) >= now)
        .sort((a: any, b: any) => 
          new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
        );
    } else if (filter === 'past') {
      filteredEvents = formattedEvents
        .filter((event: any) => new Date(event.startDateTime) < now)
        .sort((a: any, b: any) => 
          new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime()
        );
    } else {
      // Todas: ordenar por fecha descendente
      filteredEvents = formattedEvents.sort((a: any, b: any) => 
        new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime()
      );
    }

    return NextResponse.json({ events: filteredEvents }, { status: 200 });

  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Error al obtener eventos' },
      { status: 500 }
    );
  }
}
