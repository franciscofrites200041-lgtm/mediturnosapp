# MediTurnos SaaS - Documentación de Arquitectura

## 📋 Índice

1. [Visión General](#visión-general)
2. [Estructura del Proyecto](#estructura-del-proyecto)
3. [Modelo de Datos](#modelo-de-datos)
4. [Backend API](#backend-api)
5. [Frontend Web](#frontend-web)
6. [Integración n8n/WhatsApp](#integración-n8nwhatsapp)
7. [Seguridad](#seguridad)
8. [Despliegue](#despliegue)

---

## 🎯 Visión General

**MediTurnos SaaS** es una plataforma multi-tenant para la gestión integral de clínicas médicas privadas. Permite:

- Gestión de turnos con calendario visual
- Historia clínica digital (EMR) con datos encriptados
- Recetas médicas digitales
- Integración con WhatsApp via n8n
- Sistema de roles y permisos (RBAC)
- Facturación SaaS para múltiples clínicas

### Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| Backend | NestJS (Node.js + TypeScript) |
| Frontend | Next.js 14 (React + App Router) |
| Base de Datos | PostgreSQL 16 |
| ORM | Prisma |
| Cache | Redis |
| Estilos | Tailwind CSS |
| Contenedores | Docker + Docker Compose |
| Reverse Proxy | Nginx |

---

## 📁 Estructura del Proyecto

```
mediturnos-saas/
├── apps/
│   ├── api/                          # Backend NestJS
│   │   ├── prisma/
│   │   │   └── schema.prisma         # Esquema de base de datos
│   │   ├── src/
│   │   │   ├── common/               # Utilidades compartidas
│   │   │   │   ├── decorators/       # @Roles, @CurrentUser
│   │   │   │   ├── guards/           # RolesGuard, TenantGuard
│   │   │   │   ├── prisma/           # PrismaService
│   │   │   │   └── services/         # EncryptionService
│   │   │   ├── modules/
│   │   │   │   ├── auth/             # Autenticación JWT
│   │   │   │   ├── users/            # Gestión de usuarios
│   │   │   │   ├── clinics/          # Gestión de clínicas
│   │   │   │   ├── patients/         # Gestión de pacientes
│   │   │   │   ├── appointments/     # Gestión de turnos
│   │   │   │   ├── areas/            # Especialidades
│   │   │   │   ├── schedules/        # Horarios de doctores
│   │   │   │   ├── medical-records/  # Historia clínica
│   │   │   │   ├── prescriptions/    # Recetas
│   │   │   │   ├── invoices/         # Facturación SaaS
│   │   │   │   ├── n8n/              # Endpoints para n8n
│   │   │   │   └── webhooks/         # Webhooks de salida
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── web/                          # Frontend Next.js
│       ├── src/
│       │   ├── app/
│       │   │   ├── page.tsx          # Landing page
│       │   │   ├── dashboard/        # Dashboard (secretaria/doctor)
│       │   │   │   ├── page.tsx
│       │   │   │   └── appointments/
│       │   │   └── auth/             # Login/Register
│       │   ├── components/
│       │   │   ├── calendar/         # Calendario de turnos
│       │   │   └── layout/           # Layouts
│       │   └── lib/                  # Utilidades
│       ├── Dockerfile
│       └── package.json
│
├── docker/
│   └── nginx/
│       └── nginx.conf                # Configuración Nginx
│
├── docker-compose.yml                # Desarrollo
├── docker-compose.prod.yml           # Producción
├── .env.example
└── README.md
```

---

## 🗃️ Modelo de Datos

### Entidades Principales

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Clinic    │────<│    User     │────<│ Appointment │
│  (Tenant)   │     │   (RBAC)    │     │   (Turno)   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Patient   │     │    Area     │     │MedicalRecord│
│ (Paciente)  │     │(Especialidad)│    │(Hist.Clínica)│
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       └─────────────────────────────────────>│
                                              ▼
                                        ┌─────────────┐
                                        │Prescription │
                                        │  (Receta)   │
                                        └─────────────┘
```

### Multi-Tenancy

Todas las tablas críticas incluyen `clinic_id` para aislamiento de datos:

```sql
-- Ejemplo: un paciente siempre pertenece a una clínica
CREATE TABLE patients (
  id UUID PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  first_name VARCHAR(100),
  -- ...
  UNIQUE(clinic_id, document_number)  -- DNI único por clínica
);
```

### Roles (RBAC)

| Rol | Permisos |
|-----|----------|
| `SUPER_ADMIN` | Gestiona todas las clínicas, suscripciones, facturación |
| `CLINIC_ADMIN` | Gestiona usuarios, áreas, configuración de su clínica |
| `SECRETARY` | Gestiona turnos, pacientes, calendario |
| `DOCTOR` | Ve su agenda, pacientes, crea historias clínicas y recetas |

---

## 🔌 Backend API

### Endpoints Principales

#### Autenticación (`/api/v1/auth`)
```
POST /login          - Iniciar sesión
POST /register       - Registrar usuario (admin only)
POST /refresh        - Refrescar tokens
POST /logout         - Cerrar sesión
```

#### Turnos (`/api/v1/appointments`)
```
GET  /               - Listar turnos con filtros
GET  /calendar       - Vista calendario
GET  /my-agenda      - Agenda del doctor (día actual)
GET  /availability/:doctorId  - Slots disponibles
POST /               - Crear turno
PATCH /:id           - Actualizar turno
PATCH /:id/status    - Cambiar estado
DELETE /:id          - Cancelar turno
```

#### Historia Clínica (`/api/v1/medical-records`)
```
GET  /patient/:patientId  - Historial del paciente
GET  /:id                 - Detalle de registro
POST /                    - Crear registro
PATCH /:id                - Actualizar (borrador)
POST /:id/complete        - Finalizar consulta
```

#### Recetas (`/api/v1/prescriptions`)
```
GET  /patient/:patientId  - Recetas del paciente
POST /                    - Crear receta
POST /:id/send            - Firmar y enviar (webhook a n8n)
```

### Seguridad de Endpoints

```typescript
@Controller('appointments')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)  // Triple guard
@ApiBearerAuth()
export class AppointmentsController {
  
  @Post()
  @Roles(UserRole.CLINIC_ADMIN, UserRole.SECRETARY)  // Solo admin o secretaria
  create(@CurrentClinic() clinicId: string, @Body() dto: CreateAppointmentDto) {
    return this.service.create(clinicId, dto);
  }
}
```

---

## 🌐 Integración n8n/WhatsApp

### Endpoints para n8n (`/api/v1/n8n`)

Estos endpoints están protegidos por **API Key** (header `X-API-Key`):

```
GET  /availability     - Consultar disponibilidad
POST /appointments     - Reservar turno
DELETE /appointments   - Cancelar turno
GET  /doctors          - Listar doctores
GET  /specialties      - Listar especialidades
```

### Ejemplo de Uso con n8n

**Consultar disponibilidad:**
```bash
curl -X GET "https://api.mediturnos.com/api/v1/n8n/availability?specialty=Cardiología&date=2024-01-15" \
  -H "X-API-Key: mt_abc123..."
```

**Respuesta:**
```json
{
  "success": true,
  "date": "2024-01-15",
  "availability": [
    {
      "doctor": { "id": "xxx", "name": "Dr. Carlos López" },
      "specialty": "Cardiología",
      "slots": [
        { "start": "2024-01-15T09:00:00Z", "formatted": "09:00" },
        { "start": "2024-01-15T09:30:00Z", "formatted": "09:30" }
      ]
    }
  ]
}
```

### Webhook de Salida (Recetas)

Cuando el doctor envía una receta, se dispara un webhook a n8n:

```json
{
  "event": "PRESCRIPTION_SENT",
  "timestamp": "2024-01-15T14:30:00Z",
  "clinicId": "clinic_xxx",
  "data": {
    "prescriptionId": "rx_xxx",
    "patient": {
      "name": "María García",
      "phone": "+5491155554444"
    },
    "doctor": "Dr. Carlos López",
    "medications": [
      { "name": "Losartán", "dosage": "50mg", "frequency": "1 por día" }
    ],
    "prescriptionText": "📋 *RECETA MÉDICA*..."
  }
}
```

**Verificación de firma:**
```
X-MediTurnos-Signature: sha256=abc123...
```

---

## 🔐 Seguridad

### Autenticación
- **JWT** para usuarios web (access + refresh tokens)
- **API Key** para integraciones externas (n8n)

### Autorización
- **RBAC** con 4 roles definidos
- **TenantGuard** asegura aislamiento multi-tenant
- Los doctores solo ven sus propios pacientes

### Encriptación de Datos Médicos
```typescript
// Los campos sensibles se encriptan con AES-256
const sensitiveFields = ['documentNumber', 'diagnosis', 'medicalHistory'];

// Antes de guardar
const encrypted = this.encryptionService.encryptFields(data, sensitiveFields);

// Al recuperar
const decrypted = this.encryptionService.decryptFields(record, sensitiveFields);
```

### Protección de Contraseñas
```typescript
// Argon2 para hashing (más seguro que bcrypt)
const hash = await argon2.hash(password);
const isValid = await argon2.verify(hash, password);
```

### Rate Limiting
- API general: 100 requests/minuto
- Endpoints n8n: 30 requests/minuto
- Login: 5 intentos, bloqueo de 15 min

---

## 🚀 Despliegue

### Desarrollo Local

```bash
# 1. Clonar y entrar al proyecto
cd mediturnos-saas

# 2. Copiar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 3. Levantar servicios base
docker-compose up -d postgres redis

# 4. Instalar dependencias y migrar DB
cd apps/api
npm install
npx prisma migrate dev
npx prisma db seed  # Datos de prueba

# 5. Desarrollo
npm run dev  # API en :3001

cd ../web
npm install
npm run dev  # Web en :3000
```

### Producción (VPS + Docker)

```bash
# 1. En el servidor, clonar el repo
git clone https://github.com/tu-usuario/mediturnos-saas.git
cd mediturnos-saas

# 2. Configurar variables de producción
cp .env.example .env
nano .env  # Usar contraseñas seguras!

# 3. Construir y levantar
docker-compose -f docker-compose.prod.yml up -d --build

# 4. Ejecutar migraciones
docker-compose exec api npx prisma migrate deploy

# 5. Verificar logs
docker-compose logs -f
```

### SSL con Let's Encrypt

```bash
# Instalar certbot
apt install certbot python3-certbot-nginx

# Obtener certificado
certbot certonly --webroot -w /var/www/certbot -d tudominio.com

# Los certificados se guardan en:
# /etc/letsencrypt/live/tudominio.com/fullchain.pem
# /etc/letsencrypt/live/tudominio.com/privkey.pem

# Habilitar HTTPS en nginx.conf y reiniciar
docker-compose restart nginx
```

---

## 📞 Soporte

Para dudas o problemas, revisar:
- Swagger API Docs: `http://localhost:3001/docs`
- Logs: `docker-compose logs -f api`
- Issues: GitHub Issues del repositorio
