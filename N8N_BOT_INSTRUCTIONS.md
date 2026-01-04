# 🤖 Instrucciones para Crear el Bot Multi-Tenant en N8N

## 1. Credenciales Necesarias
Para configurar el bot, necesitarás estas claves:

*   **API Key del Bot (Backend):** `mediturnos_secret_bot_key` (Configurada en Header `X-API-Key` o parámetro `apiKey`)

**NOTA:** Las credenciales de WhatsApp (Token y ID) son **dinámicas**. El Bot las obtiene del endpoint `/bot/clinic`.

---

## 2. Endpoints del Backend (Contrato API Bot)
El bot interactúa con estos endpoints públicos (protegidos por API Key).

**Base URL:** `https://api.mediturnosapp.com`

### A. Identificar Clínica (Paso Inicial - CRÍTICO)
*   **GET** `/bot/clinic?waId={{phoneNumberId}}&apiKey=mediturnos_secret_bot_key`
*   **Response:** 
    ```json
    { 
      "id": "clin_123...", 
      "name": "Clínica Demo",
      "whatsappToken": "EAA..." // Token dinámico para usar en respuestas a Meta
    }
    ```
*   **Acción N8N:** Si falla (404), detener flujo. Si éxito, guardar `id` y `whatsappToken`.

### B. Listar Especialidades
*   **GET** `/bot/areas?clinicId={{clinicId}}&apiKey=mediturnos_secret_bot_key`
*   **Response:** `[{ "id": "uuid", "name": "Cardiología" }, ...]`

### C. Listar Doctores (Filtrado por Área)
*   **GET** `/bot/doctors?clinicId={{clinicId}}&areaId={{areaId}}&apiKey=mediturnos_secret_bot_key`
*   **Query Params:** `areaId` es opcional pero recomendado tras selección de menú.
*   **Response (Flat JSON):**
    ```json
    [
      { "id": "uuid", "name": "Dr. Juan Perez", "specialty": "Cardiología" }
    ]
    ```

### D. Crear Turno
*   **POST** `/bot/appointment`
*   **Body:**
    ```json
    {
      "clinicId": "{{clinicId}}",
      "doctorId": "{{doctorId}}",
      "date": "2024-01-01",
      "time": "10:00",
      "dni": "12345678",
      "patientPhone": "{{senderPhone}}",
      "apiKey": "mediturnos_secret_bot_key"
    }
    ```
*   **Response:** `{ "status": "success", "appointmentId": "..." }`

---

## 3. Arquitectura del Flujo N8N (Resumen para Implementación)

1.  **Trigger Webhook:** Recibe mensaje.
2.  **Auth Resolution:** Llama a `/bot/clinic` con el `phone_number_id` entrante. Obtiene Token.
3.  **Router:**
    *   **Menú/Hola:** Llama a `/bot/areas`. Muestra lista. ID Botón: `area_{id}`.
    *   **Selección Área:** Detecta prefix `area_`. Llama a `/bot/doctors` con ese ID. Muestra lista. ID Botón: `doc_{id}`.
    *   **Selección Doctor:** Detecta prefix `doc_`. Pide DNI y Fecha (Flujo Conversacional).
    *   **Confirmación:** Llama a `/bot/appointment`.

4.  **Respuestas WhatsApp:**
    *   SIEMPRE usa expresión para el Access Token: `{{ $json.whatsappToken }}` (o variable guardada).
