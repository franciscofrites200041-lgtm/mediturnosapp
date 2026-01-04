# 🚀 Guía de Despliegue VPS (Hostinger) - MediTurnos SaaS

Esta guía está diseñada para desplegar MediTurnos en un VPS con Docker existente **sin afectar otros servicios** (como tu N8N o Postgres actuales).

## 1. Arquitectura de Despliegue
MediTurnos correrá en su propio stack aislado:
*   **Red Docker:** `mediturnos_net` (Aislada).
*   **Base de Datos:** Contenedor Postgres 15 dedicado (Puerto interno 5432, NO expuesto al host).
*   **Puertos Host:**
    *   Frontend: `3010` (Cloudflare apuntará aquí).
    *   Backend API: `3011` (Cloudflare apuntará aquí).

---

## 2. Paso a Paso en el VPS

### Paso A: Subir/Actualizar Código
Navega a la carpeta donde alojarás el proyecto (junto a tus otros proyectos):

```bash
cd /ruta/a/tus/proyectos
git clone <tu-repo> mediturnos-saas
# O si ya existe:
cd mediturnos-saas
git pull origin main
```

### Paso B: Crear Archivo de Entorno Production
Crea un archivo llamado `.env` en la raíz de `mediturnos-saas`.

```bash
nano .env
```

**Copia y pega este contenido EXACTO (Ya incluye tus claves):**

```env
# --- SEGURIDAD (Genera nuevos valores random para prod) ---
JWT_SECRET="prod_secret_f8a9s8d7f9a8s7d9f8a7s"
JWT_REFRESH_SECRET="prod_refresh_d8f7s9d8f7s9d8f7"
ENCRYPTION_KEY="12345678901234567890123456789012" # MANTENER 32 CARACTERES EXACTOS

# --- DOMINIOS ---
FRONTEND_URL="https://mediturnosapp.com"
NEXT_PUBLIC_API_URL="https://api.mediturnosapp.com"

# --- EMAIL (Resend Verificado) ---
RESEND_API_KEY="re_HsKrx9gw_7xhK15nZ5C6CY37RkXSkactS"
EMAIL_FROM="notificaciones@mediturnosapp.com"

# --- MERCADO PAGO ---
# (Pon aquí tus credenciales reales de producción si las tienes, o usa las de prueba)
MP_ACCESS_TOKEN="APP_USR-..."
MP_PUBLIC_KEY="APP_USR-..."
```

*(Guarda con Ctrl+O, Enter, Ctrl+X)*

---

## 3. Comandos de Lanzamiento

Ejecuta este comando. Docker descargará las imágenes, construirá la App y levantará todo aislado.

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### Verificar que todo está corriendo
```bash
docker ps
```
Deberías ver 4 contenedores nuevos: `mediturnos_web`, `mediturnos_api`, `mediturnos_db`, `mediturnos_redis`.

---

## 4. Configurar Base de Datos (Solo primera vez)

Como es una base de datos nueva y vacía, debemos crear las tablas:

```bash
docker exec -it mediturnos_api npx prisma migrate deploy
```

*(Opcional) Si quieres crear un usuario admin por defecto o datos semilla:*
```bash
docker exec -it mediturnos_api npx prisma db seed
```

---

## 5. Configurar Cloudflare Tunnel

En tu configuración de `cloudflared` (en el VPS host), agrega estas reglas para conectar los dominios a los puertos Docker que abrimos:

```yaml
ingress:
  # Frontend
  - hostname: mediturnosapp.com
    service: http://localhost:3010
    
  # Backend API
  - hostname: api.mediturnosapp.com
    service: http://localhost:3011
    
  # ... tus otros servicios (n8n, etc) ...
  - service: http_status:404
```

Reinicia el túnel si es necesario.

---

## 6. Configuración Final del Bot WhatsApp (Ya en Producción)

1.  Entra a `https://mediturnosapp.com/dashboard/settings` -> **WhatsApp Bot**.
2.  Ingresa el **Token Permanente** y **Phone ID** de la clínica.
3.  Guarda. (Esto activará la suscripción automática a Webhooks).
4.  Asegúrate que tu **N8N** (que corre en el mismo VPS) tenga la URL del Webhook apuntando a `https://api.mediturnosapp.com`.

¡Listo! Tu sistema estará operativo en `mediturnosapp.com`.
