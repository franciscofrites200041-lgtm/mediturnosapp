# 🤖 Bot de WhatsApp Multi-Tenant con n8n

## 📋 Resumen

Este documento explica cómo configurar un **único bot de WhatsApp** usando n8n que funcione con **todas las clínicas** del sistema MediTurnos SaaS sin conflictos.

## 🏗️ Arquitectura Multi-Tenant

```
┌─────────────────────────────────────────────────────────────────────┐
│                         WHATSAPP BUSINESS API                        │
│                    (Evolution API / Cloud API)                       │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                            n8n WORKFLOW                              │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────────┐    │
│  │  Webhook    │───▶│ Identificar  │───▶│ Llamar API con      │    │
│  │  Receptor   │    │    Clínica   │    │ X-API-Key correcto  │    │
│  └─────────────┘    └──────────────┘    └─────────────────────┘    │
│                                                   │                  │
│         ┌─────────────────────────────────────────┘                  │
│         ▼                                                            │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │              ENDPOINTS MEDITURNOS API                            ││
│  │  • GET /n8n/config         → Obtener config de la clínica       ││
│  │  • GET /n8n/availability   → Consultar disponibilidad           ││
│  │  • GET /n8n/doctors        → Listar doctores                    ││
│  │  • GET /n8n/specialties    → Listar especialidades              ││
│  │  • POST /n8n/appointments  → Reservar turno                     ││
│  │  • DELETE /n8n/appointments → Cancelar turno                    ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    POSTGRESQL (Multi-Tenant)                         │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐        │
│  │ Clínica A      │  │ Clínica B      │  │ Clínica C      │        │
│  │ apiKey: mt_aaa │  │ apiKey: mt_bbb │  │ apiKey: mt_ccc │        │
│  │ WhatsAppConfig │  │ WhatsAppConfig │  │ WhatsAppConfig │        │
│  │ Pacientes A    │  │ Pacientes B    │  │ Pacientes C    │        │
│  └────────────────┘  └────────────────┘  └────────────────┘        │
└─────────────────────────────────────────────────────────────────────┘
```

## ✅ Protección por Plan de Suscripción

La API automáticamente verifica:

| Verificación | Resultado |
|--------------|-----------|
| Plan BASIC | ❌ Error 403: "Tu plan no incluye acceso al bot de WhatsApp" |
| Plan PROFESSIONAL | ✅ Acceso permitido |
| Plan ENTERPRISE | ✅ Acceso permitido |
| WhatsApp no configurado | ❌ Error 403: "WhatsApp no está configurado" |
| Bot desactivado | ❌ Error 403: "El bot está desactivado" |

## 🔑 Cómo Funciona el Aislamiento

### 1. Cada Clínica tiene su API Key única

Cuando una clínica se registra y paga un plan con WhatsApp, se genera un `apiKey` único:
```
Clínica San Martín: mt_clinica-san-martin_a1b2c3d4e5
Clínica del Norte:  mt_clinica-del-norte_f6g7h8i9j0
Centro Médico Sur:  mt_centro-medico-sur_k1l2m3n4o5
```

### 2. La configuración se almacena en la base de datos

**NO necesitas Google Sheets**. Cada clínica configura su WhatsApp desde el panel de administración y los datos se guardan en la tabla `whatsapp_configs`:

```sql
-- Tabla whatsapp_configs
| clinic_id | phone_number     | is_bot_enabled | welcome_message              |
|-----------|------------------|----------------|------------------------------|
| clinic_a  | +5491155551234   | true           | ¡Bienvenido a Clínica San... |
| clinic_b  | +5491155554321   | true           | ¡Hola! Soy el asistente...   |
```

### 3. n8n consulta la config directamente de la API

```javascript
// En n8n, al inicio del flujo
const config = await fetch('https://api.mediturnos.com/api/v1/n8n/config', {
  headers: { 'X-API-Key': apiKey }
});

// Respuesta:
{
  "success": true,
  "clinic": {
    "name": "Clínica San Martín",
    "timezone": "America/Argentina/Buenos_Aires"
  },
  "whatsapp": {
    "phoneNumber": "+5491155551234",
    "welcomeMessage": "¡Bienvenido a Clínica San Martín!"
  }
}
```


---

## 📱 Opción 2: Un solo número de WhatsApp (Centralizado)

Si prefieres usar un único número para todas las clínicas.

### Configuración

El paciente debe identificar la clínica al inicio de la conversación:

```
Bot: ¡Hola! Soy el asistente de MediTurnos.
     ¿Con qué clínica deseas comunicarte?
     
     1️⃣ Clínica San Martín
     2️⃣ Clínica del Norte  
     3️⃣ Centro Médico Sur
     
     Responde con el número o nombre de la clínica.

Usuario: 1

Bot: ✅ Conectado con *Clínica San Martín*
     ¿Qué deseas hacer?
     
     1️⃣ Agendar un turno
     2️⃣ Cancelar turno existente
     3️⃣ Consultar mis turnos
```

### Flujo en n8n con selección de clínica

```
1. [WEBHOOK] Mensaje entrante
      │
      ▼
2. [GET CONTEXT] Obtener contexto de la conversación (Redis/DB)
      │
      ├── Si ya tiene clínica seleccionada → Usar ese API Key
      │
      └── Si no tiene clínica → Pedir selección
      │
      ▼
3. [PROCESS] Continuar con el flujo normal
```

---

## 🛠️ Implementación Paso a Paso

### Paso 1: Configurar Evolution API (WhatsApp)

```bash
# Docker compose para Evolution API
docker run -d \
  --name evolution-api \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=tu-secreto-evolution \
  -e WEBHOOK_GLOBAL_URL=https://n8n.tudominio.com/webhook/whatsapp \
  atendai/evolution-api:latest
```

### Paso 2: Configurar Webhook en n8n

Crear un nuevo workflow con:

1. **Webhook Trigger** - Recibe mensajes de Evolution API
2. **Set Node** - Extrae datos del mensaje
3. **HTTP Request** - Consulta/Modifica datos en MediTurnos API

### Paso 3: Crear tabla de clínicas en n8n

Opción A: **Variables de entorno**
```
CLINICS_CONFIG=[{"number":"+5491111","apiKey":"mt_xxx"},{"number":"+5492222","apiKey":"mt_yyy"}]
```

Opción B: **Google Sheets** (más fácil de mantener)
| WhatsApp Number | Clinic Name | API Key | Active |
|-----------------|-------------|---------|--------|
| +5491111111111  | Clínica San Martín | mt_xxx | true |
| +5492222222222  | Clínica del Norte | mt_yyy | true |

### Paso 4: Flujo de Reserva de Turnos

```javascript
// Nodo: HTTP Request para consultar disponibilidad
{
  method: "GET",
  url: "{{$json.api_url}}/availability",
  headers: {
    "X-API-Key": "{{$json.api_key}}"
  },
  qs: {
    specialty: "{{$json.specialty}}",
    date: "{{$json.date}}"
  }
}
```

```javascript
// Nodo: HTTP Request para reservar turno
{
  method: "POST",
  url: "{{$json.api_url}}/appointments",
  headers: {
    "X-API-Key": "{{$json.api_key}}",
    "Content-Type": "application/json"
  },
  body: {
    doctorId: "{{$json.selected_doctor_id}}",
    slotStart: "{{$json.selected_slot}}",
    patientName: "{{$json.patient_name}}",
    patientPhone: "{{$json.patient_phone}}",
    reason: "{{$json.reason}}"
  }
}
```

---

## 💬 Ejemplo de Conversación

```
📱 Usuario: Hola

🤖 Bot: ¡Hola! 👋 Bienvenido a *Clínica San Martín*
        
        ¿Qué deseas hacer hoy?
        
        1️⃣ Agendar un turno
        2️⃣ Cancelar un turno
        3️⃣ Consultar mis turnos
        4️⃣ Hablar con recepción

📱 Usuario: 1

🤖 Bot: Perfecto, vamos a agendar un turno. 📅
        
        ¿Qué especialidad necesitas?
        
        1️⃣ Cardiología
        2️⃣ Medicina General
        3️⃣ Pediatría
        4️⃣ Traumatología

📱 Usuario: 1

🤖 Bot: Entendido, *Cardiología*. 
        
        ¿Qué día te queda mejor?
        
        📅 Lunes 6 de Enero
        📅 Martes 7 de Enero  
        📅 Miércoles 8 de Enero
        
        Responde con la fecha (ej: 6/1)

📱 Usuario: 6/1

🤖 Bot: Estos son los turnos disponibles para el *Lunes 6 de Enero* con *Cardiología*:
        
        🩺 *Dr. Carlos López*
        ├ 09:00
        ├ 09:30
        ├ 10:00
        └ 10:30
        
        🩺 *Dra. Ana Martínez*
        ├ 14:00
        ├ 14:30
        └ 15:00
        
        Responde con el horario que prefieras (ej: Dr. López 09:00)

📱 Usuario: Dr. Lopez 09:00

🤖 Bot: Excelente elección. Para confirmar necesito algunos datos:
        
        ¿Cuál es tu nombre completo?

📱 Usuario: Juan Pérez

🤖 Bot: Gracias Juan. ¿Cuál es tu DNI?

📱 Usuario: 35123456

🤖 Bot: ✅ *¡Turno confirmado!*
        
        📋 *Resumen de tu turno:*
        ├ 📅 Lunes 6 de Enero 2026
        ├ 🕐 09:00 hs
        ├ 🩺 Dr. Carlos López
        ├ 🏥 Cardiología
        └ 📍 Clínica San Martín
        
        🔑 Código de confirmación: *ABC123*
        
        Te enviaremos un recordatorio 24hs antes.
        
        ¿Necesitas algo más?
```

---

## 🔒 Seguridad

### 1. API Keys seguras
- Cada clínica tiene su propia API Key
- Las keys tienen fecha de expiración
- Se pueden regenerar desde el panel de administración

### 2. Rate Limiting
- Máximo 30 requests por minuto por API Key
- Protege contra abusos

### 3. Validación de teléfonos
- El paciente se identifica por su número de teléfono
- Solo puede ver/cancelar sus propios turnos

---

## 📊 Monitoreo

### Logs recomendados en n8n

```javascript
// Al inicio de cada flujo
console.log({
  timestamp: new Date().toISOString(),
  clinic: clinicName,
  action: "appointment_request",
  patient_phone: patientPhone,
});
```

### Métricas a trackear
- Turnos agendados por WhatsApp por clínica
- Turnos cancelados
- Tasa de conversación (mensajes → reservas)
- Errores de API

---

## 🚀 Próximos Pasos

1. [ ] Configurar Evolution API o WhatsApp Cloud API
2. [ ] Importar el workflow de n8n (archivo adjunto)
3. [ ] Configurar la tabla de clínicas
4. [ ] Probar con una clínica de prueba
5. [ ] Activar para todas las clínicas

---

## 📎 Archivos Adjuntos

- `mediturnos_whatsapp_bot.json` - Workflow exportado de n8n
- `evolution_api_setup.md` - Guía de configuración de Evolution API
