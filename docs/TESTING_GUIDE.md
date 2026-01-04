# Guía de Pruebas - MediTurnos SaaS

Esta guía te ayudará a levantar el entorno local y probar los flujos principales de la aplicación: Registro, Facturación y WhatsApp.

## 1. Prerrequisitos de Infraestructura

Antes de iniciar la aplicación, necesitas tener la base de datos y Redis corriendo.

1.  **Asegúrate de tener Docker Desktop abierto y corriendo.**
2.  Levanta los servicios de base de datos:
    ```bash
    docker-compose up -d postgres redis
    ```
3.  Verifica que las tablas de la base de datos estén creadas:
    ```bash
    # Desde la carpeta apps/api
    cd apps/api
    npx prisma db push
    ```

## 2. Configuración de Entorno

Asegúrate de tener un archivo `.env` en la raíz (o `.env.local` en `apps/api` y `apps/web`).
Para pruebas locales, las variables críticas son:

```env
# Base de Datos
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mediturnos?schema=public"

# Frontend (Para redirecciones)
FRONTEND_URL="http://localhost:3000"

# Mercado Pago (Opcional para ver la UI, Requerido para probar pagos reales)
# Obtén tu Access Token de prueba en: https://www.mercadopago.com.ar/developers/panel
MP_ACCESS_TOKEN="TEST-..."

# Email (Si no configuras esto, revisa la consola del backend para ver los links de verificación)
SMTP_HOST="smtp.mailtrap.io" # Opcional
```

## 3. Iniciar la Aplicación

Si no lo has hecho aún:
```bash
npm run dev
```
Esto iniciará:
*   **Web (Frontend):** http://localhost:3000
*   **API (Backend):** http://localhost:3001

## 4. Flujo de Prueba Paso a Paso

### A. Registro de Nueva Clínica (Signup)
1.  Abre http://localhost:3000/auth/register
2.  Completa el formulario:
    *   Nombre Clínica: "Clínica Demo"
    *   Email: "admin@demo.com"
    *   Password: "Password123!"
3.  Al enviar, verás una pantalla pidiendo verificar el email.

### B. Verificación de Email
*   **Si configuraste SMTP:** Revisa tu bandeja de entrada (o Mailtrap).
*   **Si NO configuraste SMTP:** Mira la **terminal donde corre `npm run dev`**. Busca un log que dice:
    `[EmailService] 📧 Email sent to admin@demo.com...`
    Copia el link que aparece ahí (algo como `http://localhost:3000/auth/verify-email?token=...`) y pégalo en tu navegador.

### C. Login y Dashboard
1.  Una vez verificado, inicia sesión en http://localhost:3000/auth/login
2.  Deberías ver el Dashboard principal.

### D. Prueba de Facturación (Mercado Pago)
1.  Ve a **Configuración** (icono de engranaje en sidebar).
2.  Selecciona la pestaña **"Facturación"**.
3.  Verás que estás en un "Período de Prueba" o sin plan.
4.  Haz clic en **"Suscribirse"** en el Plan Profesional.
5.  Si configuraste `MP_ACCESS_TOKEN`, serás redirigido al Checkout de Mercado Pago (Sandbox).
    *   Usa tarjetas de prueba de MP (ej: `...`) para simular un pago exitoso.

### E. Prueba de WhatsApp
1.  En **Configuración**, ve a la pestaña **"Integraciones"**.
2.  Ingresa credenciales ficticias o reales de Meta Cloud API para guardar la configuración.
3.  (Para probar recepción real necesitarías `ngrok` apuntando al puerto 3001).

## 5. Solución de Problemas Comunes

*   **Error de conexión a DB:** Verifica que Docker esté corriendo (`docker ps`).
*   **CORS Error:** Asegúrate que `FRONTEND_URL` en el .env del backend coincida con la URL del frontend.
*   **Login falla:** Revisa la consola del navegador (F12) y la terminal del backend para ver el error específico.
