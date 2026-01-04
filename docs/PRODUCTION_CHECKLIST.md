# 🚀 Checklist de Producción - MediTurnos SaaS

Este documento lista todo lo necesario para que la aplicación esté lista para uso público.

---

## 📊 Resumen de Estado

| Categoría | Estado | Prioridad |
|-----------|--------|-----------|
| Autenticación Pública | ⚠️ Parcial | 🔴 CRÍTICA |
| Páginas Legales | ❌ Falta | 🔴 CRÍTICA |
| Verificación de Email | ❌ Falta | 🔴 CRÍTICA |
| Recuperación de Contraseña | ⚠️ Incompleto | 🔴 CRÍTICA |
| Registro de Clínicas | ⚠️ Parcial | 🔴 CRÍTICA |
| Validación de Datos | ⚠️ Parcial | 🟡 ALTA |
| Manejo de Errores Global | ⚠️ Básico | 🟡 ALTA |
| Configuración SSL/HTTPS | ❌ Falta | 🔴 CRÍTICA |
| Métricas/Monitoreo | ❌ Falta | 🟡 ALTA |
| Backups automáticos | ❌ Falta | 🟡 ALTA |
| Testing | ❌ Falta | 🟢 MEDIA |
| SEO Optimizado | ⚠️ Básico | 🟢 MEDIA |

---

## 🔴 PRIORIDAD CRÍTICA (Bloqueantes para lanzamiento)

### 1. Registro Público de Clínicas
**Estado:** El endpoint `/auth/register` requiere autenticación JWT
**Necesario:**
- [ ] Crear endpoint `/auth/signup` público para registro de nuevas clínicas
- [ ] Crear clínica automáticamente al registrar el primer admin
- [ ] Agregar validación de datos de clínica (nombre, etc.)
- [ ] Implementar período de prueba (trial de 14 días)

### 2. Verificación de Email
**Estado:** No implementado
**Necesario:**
- [ ] Enviar email de verificación al registrarse
- [ ] Endpoint para verificar email con token
- [ ] Bloquear login si email no verificado
- [ ] Opción de reenviar email de verificación

### 3. Recuperación de Contraseña
**Estado:** El frontend tiene la página pero el backend no implementa el endpoint
**Necesario:**
- [ ] Implementar `/auth/forgot-password` - envío de email con token
- [ ] Implementar `/auth/reset-password` - cambiar contraseña con token
- [ ] Validar expiración de tokens (1 hora máximo)

### 4. Servicio de Email (SMTP)
**Estado:** Variables configuradas pero no hay implementación
**Necesario:**
- [ ] Crear módulo de email con Nodemailer
- [ ] Templates HTML para emails (verificación, reset password, recordatorios)
- [ ] Configurar proveedor SMTP (SendGrid, SES, etc.)

### 5. Páginas Legales
**Estado:** No existen
**Necesario:**
- [ ] Página de Términos y Condiciones (`/terms`)
- [ ] Página de Política de Privacidad (`/privacy`)
- [ ] Política de cookies (banner de consentimiento)
- [ ] Checkbox de aceptación en registro

### 6. Configuración SSL/HTTPS
**Estado:** Nginx configurado pero sin certificados
**Necesario:**
- [ ] Configurar Certbot/Let's Encrypt en Docker
- [ ] Renovación automática de certificados
- [ ] Forzar redirección HTTP → HTTPS

---

## 🟡 PRIORIDAD ALTA (Importantes para experiencia)

### 7. Manejo de Errores Global
**Estado:** Básico
**Necesario:**
- [ ] Exception filter global en NestJS
- [ ] Páginas de error personalizadas (404, 500, 403)
- [ ] Logging centralizado (Winston/Pino)
- [ ] Error boundary en React para errores de UI

### 8. Validación de Datos Mejorada
**Estado:** Parcial
**Necesario:**
- [ ] Validar formato de teléfono argentino
- [ ] Validar DNI/CUIL/CUIT con algoritmo
- [ ] Validar emails con dominios reales
- [ ] Sanitizar inputs HTML para prevenir XSS

### 9. Sistema de Notificaciones
**Estado:** No implementado
**Necesario:**
- [ ] Recordatorios de turnos por email (24h antes)
- [ ] Confirmación de turno creado
- [ ] Notificación de cancelación
- [ ] Cola de jobs para emails (BullMQ/Redis)

### 10. Backups Automáticos
**Estado:** No implementado
**Necesario:**
- [ ] Script de backup diario de PostgreSQL
- [ ] Almacenamiento en S3/Cloud Storage
- [ ] Retención de últimos 30 días
- [ ] Documentar proceso de restauración

### 11. Monitoreo y Métricas
**Estado:** No implementado
**Necesario:**
- [ ] Health check endpoints
- [ ] Métricas básicas (response time, error rate)
- [ ] Alertas por downtime (UptimeRobot, Pingdom)
- [ ] Considerar: Sentry para errores, Prometheus/Grafana

### 12. Endpoint /auth/me Completo
**Estado:** Parcial - falta devolver datos de clínica
**Necesario:**
- [ ] Retornar información completa del usuario logueado
- [ ] Incluir datos de la clínica (para el store del frontend)

---

## 🟢 PRIORIDAD MEDIA (Nice to have para MVP)

### 13. Testing
**Estado:** No hay tests
**Necesario:**
- [ ] Tests unitarios para servicios críticos (auth, appointments)
- [ ] Tests e2e para flujos principales
- [ ] Coverage mínimo 60%

### 14. SEO y Meta Tags
**Estado:** Básico
**Necesario:**
- [ ] Meta tags dinámicos por página
- [ ] Open Graph para redes sociales
- [ ] Sitemap.xml
- [ ] robots.txt

### 15. PWA (Progressive Web App)
**Estado:** No implementado
**Necesario:**
- [ ] manifest.json
- [ ] Service worker básico
- [ ] Iconos para instalación

### 16. Internacionalización (i18n)
**Estado:** Hardcoded en español
**Necesario (futuro):**
- [ ] Archivos de traducción
- [ ] Selector de idioma

### 17. Encriptación de Datos Médicos
**Estado:** Mencionado pero no implementado
**Necesario:**
- [ ] Encriptar campos sensibles en BD (documentNumber, medicalRecords content)
- [ ] Usar ENCRYPTION_KEY del .env

---

## 📁 Archivos a Crear

```
apps/
├── api/src/
│   ├── modules/
│   │   ├── email/                # Módulo de email
│   │   │   ├── email.module.ts
│   │   │   ├── email.service.ts
│   │   │   └── templates/        # Templates HTML
│   │   └── auth/
│   │       ├── dto/
│   │       │   ├── signup.dto.ts     # DTO para registro público
│   │       │   └── verify-email.dto.ts
│   │       └── auth.controller.ts    # Agregar endpoints
│   └── common/
│       └── filters/
│           └── http-exception.filter.ts
└── web/src/app/
    ├── terms/page.tsx            # Términos y condiciones
    ├── privacy/page.tsx          # Política de privacidad
    └── error.tsx                 # Error boundary
```

---

## 🔧 Variables de Entorno Requeridas

Verificar que estas estén configuradas en producción:

```bash
# Requeridas
DATABASE_URL=postgresql://...
JWT_SECRET=<32+ chars>
JWT_REFRESH_SECRET=<32+ chars>
ENCRYPTION_KEY=<32 chars>
CORS_ORIGINS=https://tudominio.com

# Para emails (obligatorias para verificación)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<sendgrid_api_key>
SMTP_FROM=noreply@tudominio.com

# Producción
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.tudominio.com/api/v1
```

---

## ⏱️ Estimación de Tiempo

| Tarea | Tiempo Estimado |
|-------|-----------------|
| Registro público + trial | 2-3 horas |
| Módulo de email + templates | 3-4 horas |
| Verificación de email | 2 horas |
| Recuperación de contraseña | 2 horas |
| Páginas legales | 1-2 horas |
| SSL/Certbot | 1 hora |
| Manejo de errores | 2 horas |
| Backups + scripts | 2 horas |
| **TOTAL MVP** | **~15-20 horas** |

---

## 🚦 Orden Recomendado de Implementación

1. **Módulo de Email** (base para todo lo demás)
2. **Registro público de clínicas** (permite que nuevos usuarios lleguen)
3. **Verificación de email** (seguridad básica)
4. **Recuperación de contraseña** (usuarios olvidando passwords)
5. **Páginas legales** (requisito legal)
6. **SSL/HTTPS** (seguridad en producción)
7. **Manejo de errores** (mejor UX)
8. **Backups** (protección de datos)
9. **Monitoreo** (estabilidad)

---

## ✅ Cuando Todo Esté Listo

La aplicación estará lista para lanzamiento público cuando:

- [ ] Un usuario nuevo puede registrar su clínica desde cero
- [ ] Recibe email de verificación y puede verificar
- [ ] Puede recuperar su contraseña si la olvida
- [ ] Las páginas legales están accesibles
- [ ] El sitio funciona sobre HTTPS
- [ ] Hay backups automáticos funcionando
- [ ] Hay alertas de monitoreo configuradas
