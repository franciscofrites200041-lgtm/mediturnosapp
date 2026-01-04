# Integración n8n - WhatsApp Bot para MediTurnos

Esta guía explica cómo configurar n8n para crear un bot de WhatsApp que se integre con MediTurnos.

## 📋 Requisitos

1. **Instancia n8n** (self-hosted o cloud)
2. **API de WhatsApp Business** o servicio como:
   - [Twilio](https://www.twilio.com/whatsapp)
   - [360dialog](https://www.360dialog.com/)
   - [Meta Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api)
3. **API Key de MediTurnos** (generada desde el panel de la clínica)

## 🔧 Configuración Inicial

### 1. Obtener API Key de MediTurnos

1. Ingresa al panel de administrador de tu clínica
2. Ve a **Configuración > Integraciones**
3. Genera una nueva API Key
4. Guarda la clave de forma segura

### 2. Configurar n8n

Crea las siguientes credenciales en n8n:

```
Nombre: MediTurnos API
Tipo: Header Auth
Header Name: X-API-Key
Header Value: mt_xxxxx (tu API Key)
```

## 🔄 Flujos de n8n

### Flujo 1: Consulta de Disponibilidad

```
WhatsApp Trigger → Procesar Mensaje → HTTP Request (MediTurnos) → Formatear Respuesta → WhatsApp Send
```

**Nodo HTTP Request:**
```
Method: GET
URL: https://tu-api.mediturnos.com/api/v1/n8n/availability
Query Parameters:
  - specialty: {{ mensaje del usuario }}
  - date: {{ fecha solicitada }}
Headers:
  - X-API-Key: {{ credentials.mediturnos }}
```

### Flujo 2: Reserva de Turno

```
WhatsApp Trigger → Verificar Confirmación → HTTP Request (Reservar) → Enviar Confirmación
```

**Nodo HTTP Request (POST):**
```json
{
  "doctorId": "{{ $json.selected_doctor }}",
  "slotStart": "{{ $json.selected_slot }}",
  "patientName": "{{ $json.patient_name }}",
  "patientPhone": "{{ $json.sender_phone }}",
  "reason": "{{ $json.reason }}"
}
```

### Flujo 3: Recibir Recetas (Webhook)

```
Webhook MediTurnos → Formatear Receta → WhatsApp Send
```

**Webhook de entrada en n8n:**
```
URL: https://tu-n8n.com/webhook/mediturnos-prescriptions
Method: POST
```

Configura esta URL en MediTurnos:
1. Panel Admin > Configuración > Webhooks
2. URL: `https://tu-n8n.com/webhook/mediturnos-prescriptions`
3. Secret: (genera una clave aleatoria)

## 📱 Ejemplo de Conversación

```
👤 Usuario: Hola, quiero un turno con un cardiólogo para mañana

🤖 Bot: ¡Hola! Encontré estos horarios disponibles para mañana con el Dr. Carlos López (Cardiología):

🕐 09:00
🕐 10:30  
🕐 14:00

¿Cuál prefieres? Responde con el horario.

👤 Usuario: 09:00

🤖 Bot: Perfecto, voy a reservar el turno para las 09:00.
¿Cuál es tu nombre completo?

👤 Usuario: María García

🤖 Bot: ✅ ¡Turno confirmado!

📅 Lunes 15 de enero, 2024
🕐 09:00 hs
👨‍⚕️ Dr. Carlos López - Cardiología
📍 Clínica San Rafael

Tu código de confirmación es: ABC123

Recibirás un recordatorio 24hs antes. 
Para cancelar, escribe "cancelar ABC123"
```

## 🔒 Verificación de Webhooks

Cuando MediTurnos envía un webhook, incluye una firma HMAC para verificar autenticidad:

```javascript
// En n8n, usar un Function Node para verificar
const crypto = require('crypto');

const signature = $input.headers['x-mediturnos-signature'];
const payload = JSON.stringify($input.body);
const secret = 'tu-webhook-secret';

const expectedSignature = 'sha256=' + crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

if (signature !== expectedSignature) {
  throw new Error('Invalid webhook signature');
}

return $input;
```

## 📝 Eventos de Webhook

MediTurnos puede enviar los siguientes eventos:

| Evento | Descripción |
|--------|-------------|
| `PRESCRIPTION_SENT` | Doctor envía una receta |
| `APPOINTMENT_CREATED` | Se crea un nuevo turno |
| `APPOINTMENT_CANCELLED` | Se cancela un turno |
| `APPOINTMENT_REMINDER` | Recordatorio de turno (24h antes) |
| `CONSULTATION_COMPLETED` | Doctor finaliza consulta |

## 🚀 Tips de Optimización

1. **Caché de doctores**: Guarda la lista de doctores en n8n para respuestas más rápidas
2. **Sesiones**: Usa Table Node para mantener el estado de la conversación
3. **Rate Limiting**: El API de MediTurnos permite 30 req/min por API Key
4. **Manejo de errores**: Siempre implementa nodos de error para informar al usuario
