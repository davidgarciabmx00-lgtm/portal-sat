// test-calendar-connection.js
require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');

async function testCalendarConnection() {
  console.log('🔍 Probando conexión con Google Calendar...\n');

  try {
    // Configurar autenticación
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CALENDAR_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_CALENDAR_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    console.log('📧 Service Account Email:', process.env.GOOGLE_CALENDAR_CLIENT_EMAIL);
    console.log('📅 Calendar ID:', process.env.GOOGLE_CALENDAR_ID || 'primary');
    console.log('');

    // Intentar crear un evento de prueba
    console.log('📝 Intentando crear evento de prueba...');
    
    const event = {
      summary: 'PRUEBA - Ignora este evento',
      description: 'Este es un evento de prueba para verificar la conexión',
      start: {
        dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hora desde ahora
        timeZone: 'Europe/Madrid',
      },
      end: {
        dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 horas desde ahora
        timeZone: 'Europe/Madrid',
      },
    };

    const response = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      requestBody: event,
    });

    console.log('✅ ¡Evento creado exitosamente!');
    console.log('📌 ID del evento:', response.data.id);
    console.log('🔗 Link del evento:', response.data.htmlLink);
    console.log('');
    console.log('✅ La conexión funciona correctamente.');
    console.log('   Puedes eliminar el evento de prueba desde Google Calendar.');
    
  } catch (error) {
    console.error('❌ Error al conectar con Google Calendar:\n');
    
    if (error.code === 403) {
      console.error('🚫 ACCESO DENEGADO (403)');
      console.error('');
      console.error('La Service Account NO tiene acceso a tu calendario.');
      console.error('');
      console.error('📋 SOLUCIÓN:');
      console.error('1. Ve a https://calendar.google.com');
      console.error('2. En la barra lateral, encuentra tu calendario');
      console.error('3. Click en los 3 puntos → "Configuración y uso compartido"');
      console.error('4. En "Compartir con determinadas personas" click en "Añadir personas"');
      console.error('5. Agrega este email:');
      console.error('   ' + process.env.GOOGLE_CALENDAR_CLIENT_EMAIL);
      console.error('6. Permisos: "Hacer cambios en los eventos"');
      console.error('7. Click en "Enviar"');
      console.error('');
      console.error('SI ESTÁS USANDO UN CALENDARIO ESPECÍFICO (no el principal):');
      console.error('1. En "Integrar calendario", copia el "ID de calendario"');
      console.error('2. Actualiza GOOGLE_CALENDAR_ID en .env.local con ese ID');
    } else if (error.code === 404) {
      console.error('🔍 CALENDARIO NO ENCONTRADO (404)');
      console.error('');
      console.error('El ID del calendario es incorrecto.');
      console.error('');
      console.error('📋 SOLUCIÓN:');
      console.error('1. Ve a https://calendar.google.com');
      console.error('2. Configuración del calendario → "Integrar calendario"');
      console.error('3. Copia el "ID de calendario"');
      console.error('4. Actualiza GOOGLE_CALENDAR_ID en .env.local');
    } else {
      console.error('Detalles del error:');
      console.error(error.message);
    }
    
    process.exit(1);
  }
}

testCalendarConnection();
