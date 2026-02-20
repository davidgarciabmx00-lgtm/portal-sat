// src/lib/google-calendar.ts
import { google } from 'googleapis';

// Configurar autenticación con Service Account
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CALENDAR_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_CALENDAR_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

// Crear cliente de Calendar API
const calendar = google.calendar({ version: 'v3', auth });

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  extendedProperties?: {
    private?: {
      [key: string]: string;
    };
  };
}

/**
 * Obtener eventos del calendario en un rango de fechas
 */
export async function getCalendarEvents(startDate: Date, endDate: Date) {
  try {
    const response = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items || [];
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw error;
  }
}

/**
 * Crear un nuevo evento en el calendario
 */
export async function createCalendarEvent(event: CalendarEvent) {
  try {
    const response = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      requestBody: event,
    });

    return response.data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}

/**
 * Actualizar un evento existente
 */
export async function updateCalendarEvent(eventId: string, event: Partial<CalendarEvent>) {
  try {
    const response = await calendar.events.patch({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      eventId: eventId,
      requestBody: event,
    });

    return response.data;
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw error;
  }
}

/**
 * Eliminar un evento del calendario
 */
export async function deleteCalendarEvent(eventId: string) {
  try {
    await calendar.events.delete({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      eventId: eventId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw error;
  }
}

/**
 * Obtener franjas horarias disponibles para un día específico
 * @param date - Fecha a consultar
 * @param workingHours - Horario laboral (por defecto 9:00 - 18:00)
 * @param slotDuration - Duración de cada franja en minutos (por defecto 60)
 */
export async function getAvailableSlots(
  date: Date,
  workingHours = { start: 9, end: 18 },
  slotDuration = 60
) {
  try {
    // Crear inicio y fin del día
    const dayStart = new Date(date);
    dayStart.setHours(workingHours.start, 0, 0, 0);
    
    const dayEnd = new Date(date);
    dayEnd.setHours(workingHours.end, 0, 0, 0);

    // Obtener eventos existentes del día
    const events = await getCalendarEvents(dayStart, dayEnd);

    // Generar todas las franjas horarias posibles
    const allSlots: Array<{ start: Date; end: Date; available: boolean }> = [];
    let currentTime = new Date(dayStart);

    while (currentTime < dayEnd) {
      const slotStart = new Date(currentTime);
      const slotEnd = new Date(currentTime.getTime() + slotDuration * 60000);

      // Verificar si esta franja está ocupada por algún evento
      const isOccupied = events.some((event) => {
        if (!event.start?.dateTime || !event.end?.dateTime) return false;
        
        const eventStart = new Date(event.start.dateTime);
        const eventEnd = new Date(event.end.dateTime);

        // Hay conflicto si hay cualquier solapamiento
        return (
          (slotStart >= eventStart && slotStart < eventEnd) ||
          (slotEnd > eventStart && slotEnd <= eventEnd) ||
          (slotStart <= eventStart && slotEnd >= eventEnd)
        );
      });

      allSlots.push({
        start: slotStart,
        end: slotEnd,
        available: !isOccupied,
      });

      currentTime = slotEnd;
    }

    return allSlots;
  } catch (error) {
    console.error('Error getting available slots:', error);
    throw error;
  }
}

export default calendar;
