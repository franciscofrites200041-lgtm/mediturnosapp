# MediTurnos SaaS

Sistema de gestión de turnos médicos multi-tenant para clínicas privadas.

## 🚀 Características

- **Multi-tenancy**: Soporte para múltiples clínicas con aislamiento de datos
- **Roles y Permisos (RBAC)**:
  - Super Admin: Gestión de clínicas y suscripciones
  - Clinic Admin: Gestión de doctores, secretarias y configuración
  - Secretary: Vista de calendario, gestión de turnos y pacientes
  - Doctor: Agenda personal, historia clínica y recetas
- **Gestión de Turnos**: Calendario con vistas día/semana/mes, disponibilidad en tiempo real
- **Historia Clínica Digital (EMR)**: Registro completo de consultas y signos vitales
- **Recetas Digitales**: Generación y envío por WhatsApp
- **Integración n8n/WhatsApp**: Automatización de recordatorios y notificaciones

## 📁 Estructura del Proyecto

```
mediturnos-saas/
├── apps/
│   ├── api/           # Backend NestJS
│   └── web/           # Frontend Next.js
├── docker-compose.yml
└── docs/
    └── ARCHITECTURE.md
```

## 🛠️ Stack Tecnológico

### Backend
- **NestJS** - Framework Node.js
- **Prisma** - ORM y migraciones
- **PostgreSQL** - Base de datos
- **JWT** - Autenticación con refresh tokens
- **Swagger** - Documentación API

### Frontend
- **Next.js 14** - React framework con App Router
- **Tailwind CSS** - Estilos
- **React Query** - Estado del servidor
- **Zustand** - Estado global
- **React Hook Form** - Formularios
- **Headless UI** - Componentes accesibles

## 🏃‍♂️ Inicio Rápido

### Prerequisitos
- Node.js 18+
- pnpm (o npm/yarn)
- Docker y Docker Compose
- PostgreSQL (o usar Docker)

### 1. Clonar e instalar dependencias

```bash
# Instalar dependencias
cd apps/api && npm install
cd ../web && npm install
```

### 2. Configurar variables de entorno

Backend (`apps/api/.env`):
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mediturnos"
JWT_SECRET="tu-secreto-super-seguro-cambiar-en-produccion"
JWT_REFRESH_SECRET="otro-secreto-seguro-para-refresh-tokens"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
ENCRYPTION_KEY="clave-de-32-caracteres-para-encriptar"
```

Frontend (`apps/web/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### 3. Iniciar base de datos (Docker)

```bash
docker-compose up -d postgres
```

### 4. Ejecutar migraciones y seed

```bash
cd apps/api
npm run prisma:migrate
npm run prisma:seed
```

### 5. Iniciar los servidores

```bash
# Terminal 1 - Backend
cd apps/api
npm run dev

# Terminal 2 - Frontend  
cd apps/web
npm run dev
```

### 6. Acceder a la aplicación

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Swagger Docs**: http://localhost:3001/api/docs

### Credenciales de Prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Super Admin | admin@mediturnos.com | demo1234 |
| Admin Clínica | admin@clinicasanmartin.com | demo1234 |
| Secretaria | maria@clinicasanmartin.com | demo1234 |
| Doctor | dr.lopez@clinicasanmartin.com | demo1234 |

## 📚 Documentación

- [Arquitectura](docs/ARCHITECTURE.md) - Documentación técnica detallada
- [API Docs](http://localhost:3001/api/docs) - Swagger (disponible con el servidor corriendo)

## 🐳 Docker

Para ejecutar todo con Docker:

```bash
# Desarrollo
docker-compose up

# Producción
docker-compose -f docker-compose.prod.yml up -d
```

## 📋 Scripts Disponibles

### Backend (`apps/api`)
- `npm run dev` - Servidor de desarrollo con hot-reload
- `npm run build` - Compilar para producción
- `npm run start:prod` - Iniciar en producción
- `npm run prisma:generate` - Generar cliente Prisma
- `npm run prisma:migrate` - Ejecutar migraciones
- `npm run prisma:studio` - UI visual para la base de datos
- `npm run prisma:seed` - Cargar datos de prueba

### Frontend (`apps/web`)
- `npm run dev` - Servidor de desarrollo
- `npm run build` - Compilar para producción
- `npm run start` - Iniciar en producción
- `npm run lint` - Verificar código

## 🔧 Características Implementadas

### Frontend
- [x] Páginas de Autenticación (Login, Register, Recuperar contraseña)
- [x] Dashboard con estadísticas y turnos del día
- [x] Calendario de Turnos (día/semana/mes)
- [x] Gestión de Pacientes (CRUD completo)
- [x] Gestión de Doctores
- [x] Gestión de Especialidades/Áreas
- [x] Configuración de Horarios
- [x] Mi Agenda (vista para doctores)
- [x] Historia Clínica
- [x] Recetas Digitales
- [x] Configuración de Clínica
- [x] Sidebar adaptativo por rol
- [x] Modo oscuro

### Backend
- [x] API REST completa con NestJS
- [x] Autenticación JWT con refresh tokens
- [x] Multi-tenancy con guards
- [x] RBAC (Control de acceso basado en roles)
- [x] Módulos: Auth, Users, Patients, Appointments, Areas, Schedules, Medical Records, Prescriptions
- [x] Webhooks para n8n
- [x] Rate limiting
- [x] Swagger Documentation
- [x] Seed de datos de prueba

### Pendiente
- [ ] Tests E2E
- [ ] Generación de PDF para recetas
- [ ] Integración real con WhatsApp Business API
- [ ] Notificaciones por email
- [ ] Pipeline CI/CD
- [ ] Encriptación de datos sensibles (campos específicos)

## 📄 Licencia

Propietario.
