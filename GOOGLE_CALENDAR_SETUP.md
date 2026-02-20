# Sistema de Reservas con Google Calendar

## 📋 Configuración Implementada

### ✅ Google Calendar API
- Service Account configurado
- API de Calendar habilitada
- Credenciales almacenadas en `.env.local`

### ✅ Endpoints Creados
- `GET /api/booking/availability?date=YYYY-MM-DD` - Obtener franjas horarias disponibles
- `POST /api/booking/reserve` - Crear una nueva reserva

### ✅ Páginas
- `/booking` - Página pública para que clientes reserven citas
- `/admin` - Panel incluye gestor de reservas

## 🔧 Pasos Pendientes de Configuración

### 1. Compartir el Calendario con la Service Account

Para que la Service Account pueda gestionar eventos, necesitas compartir tu Google Calendar:

1. Abre [Google Calendar](https://calendar.google.com)
2. En la barra lateral izquierda, selecciona el calendario que quieres usar
3. Haz clic en los 3 puntos → **"Configuración y uso compartido"**
4. En **"Compartir con determinadas personas"**, click en **"Añadir personas"**
5. Agrega el email de la service account:
   ```
   calendar-sat@burnished-inn-488010-i7.iam.gserviceaccount.com
   ```
6. Selecciona permisos: **"Hacer cambios en los eventos"**
7. Click en **"Enviar"**

### 2. Obtener el ID del Calendario

Si estás usando un calendario diferente a "primary":

1. En la configuración del calendario, busca **"Integrar calendario"**
2. Copia el **"ID de calendario"** (algo como: `xxxxx@group.calendar.google.com`)
3. Actualiza `.env.local`:
   ```env
   GOOGLE_CALENDAR_ID=tu-calendario-id@group.calendar.google.com
   ```

### 3. Actualizar Reglas de Firestore

Ve a [Firebase Console](https://console.firebase.google.com/project/portal-sat-alfred/firestore/rules) y despliega las reglas del archivo `firestore.rules`.

## 🎯 Flujo de Uso

### Para Clientes (Usuario Público)

1. **Acceder**: Usuario visita `https://tu-dominio.com/booking`
2. **Seleccionar Fecha**: Elige un día del calendario
3. **Ver Disponibilidad**: El sistema consulta Google Calendar en tiempo real
4. **Seleccionar Hora**: Elige una franja horaria disponible
5. **Llenar Datos**: Nombre, email, teléfono, descripción del problema
6. **Confirmar**: El sistema:
   - Verifica disponibilidad nuevamente
   - Crea evento en Google Calendar
   - Guarda datos sensibles en Firestore
   - Envía confirmación por email (Google Calendar)

### Para Administradores

1. **Ver Reservas**: En `/admin` → Sección "Reservas de Clientes"
2. **Filtrar**: Próximas / Pasadas / Todas
3. **Ver Detalles**: Nombre, email, teléfono, descripción
4. **Gestionar en Google Calendar**: Click en "Ver en Google Calendar"

## 📊 Datos Almacenados

### En Google Calendar
- Resumen del evento
- Fecha y hora
- Descripción básica (nombre + descripción del problema)
- Email del cliente (para notificaciones)

### En Firestore (Colección `bookings`)
```typescript
{
  googleEventId: string,      // ID del evento en Google Calendar
  clientName: string,          // Nombre completo
  clientEmail: string,         // Email
  clientPhone: string,         // Teléfono
  description: string,         // Descripción del problema
  startDateTime: Timestamp,    // Fecha/hora inicio
  endDateTime: Timestamp,      // Fecha/hora fin
  status: 'confirmed',         // Estado
  createdAt: Timestamp         // Fecha de creación
}
```

## ⚙️ Personalización

### Horario Laboral
Edita en `/api/booking/availability/route.ts`:
```typescript
const slots = await getAvailableSlots(
  date, 
  { start: 9, end: 18 },  // Cambiar horario aquí
  60                       // Duración de franjas en minutos
);
```

### Zona Horaria
Edita en `/api/booking/reserve/route.ts`:
```typescript
timeZone: 'Europe/Madrid'  // Cambiar zona horaria
```

### Rango de Días Disponibles
Edita en `/app/booking/page.tsx`:
```typescript
const maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)  // 30 días
```

## 🚀 Testing

### 1. Probar Disponibilidad
```bash
curl "http://localhost:3000/api/booking/availability?date=2026-02-21"
```

### 2. Crear Reserva de Prueba
```bash
curl -X POST http://localhost:3000/api/booking/reserve \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "phone": "+34 600 000 000",
    "description": "Problema con instalación",
    "startDateTime": "2026-02-21T10:00:00.000Z",
    "endDateTime": "2026-02-21T11:00:00.000Z"
  }'
```

## 📱 Próximos Pasos Opcionales

- [ ] Enviar emails de confirmación personalizados (usando SendGrid, etc.)
- [ ] Agregar recordatorios automáticos
- [ ] Permitir cancelaciones desde un link único
- [ ] Agregar campo para tipo de servicio
- [ ] Integrar con WhatsApp para notificaciones
- [ ] Agregar calendario de técnicos específicos

## 🔐 Seguridad

- ✅ Validación de disponibilidad en tiempo real
- ✅ Datos sensibles solo en Firestore  
- ✅ Service Account sin acceso de usuarios
- ✅ Reglas de Firestore configuradas
- ✅ Validación en backend

## 📞 Soporte

Para problemas con Google Calendar API:
1. Verifica que la API esté habilitada en [Google Cloud Console](https://console.cloud.google.com/apis/dashboard?project=burnished-inn-488010-i7)
2. Verifica permisos de la Service Account
3. Revisa logs en `/api/booking/*`
