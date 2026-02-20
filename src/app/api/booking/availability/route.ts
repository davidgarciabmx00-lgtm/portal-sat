// src/app/api/booking/availability/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAvailableSlots } from '@/lib/google-calendar';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    if (!dateParam) {
      return NextResponse.json(
        { error: 'Parámetro "date" es requerido (formato: YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    const date = new Date(dateParam);
    
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: 'Formato de fecha inválido' },
        { status: 400 }
      );
    }

    // Obtener franjas disponibles (9:00 - 18:00, franjas de 1 hora)
    const slots = await getAvailableSlots(date, { start: 9, end: 18 }, 60);

    // Formatear para el cliente
    const formattedSlots = slots.map((slot) => ({
      start: slot.start.toISOString(),
      end: slot.end.toISOString(),
      available: slot.available,
    }));

    return NextResponse.json({ date: dateParam, slots: formattedSlots });
  } catch (error) {
    console.error('Error al obtener disponibilidad:', error);
    return NextResponse.json(
      { error: 'Error al obtener disponibilidad' },
      { status: 500 }
    );
  }
}
