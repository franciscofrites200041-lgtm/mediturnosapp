# 🏗️ Arquitectura SaaS - Sistema de Cobros y WhatsApp Multi-Tenant

## Índice
1. [Sistema de Suscripciones y Cobros](#sistema-de-suscripciones-y-cobros)
2. [WhatsApp Multi-Tenant](#whatsapp-multi-tenant)
3. [Planes y Precios Sugeridos](#planes-y-precios-sugeridos)
4. [Implementación Técnica](#implementación-técnica)

---

## Sistema de Suscripciones y Cobros

### Pasarela Recomendada: Mercado Pago

**¿Por qué Mercado Pago?**
- El 90% de las clínicas en Argentina ya tienen cuenta
- Soporta suscripciones recurrentes (Checkout Pro con preapproval)
- Acepta todos los medios de pago: tarjetas, débito, Rapipago, etc.
- Webhooks para actualización automática de estados
- Comisiones razonables (~4-5%)

### Flujo de Suscripción

```
┌─────────────────────────────────────────────────────────────────┐
│                       CICLO DE VIDA DEL CLIENTE                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────┐    ┌─────────────┐    ┌──────────────┐           │
│   │ REGISTRO│───▶│ TRIAL 14d   │───▶│ELEGIR PLAN   │           │
│   └─────────┘    └─────────────┘    └──────────────┘           │
│                                            │                    │
│                                            ▼                    │
│                                    ┌──────────────┐            │
│                                    │ CHECKOUT MP  │            │
│                                    │ (Suscripción)│            │
│                                    └──────────────┘            │
│                                            │                    │
│                          ┌─────────────────┼─────────────────┐  │
│                          ▼                 ▼                 ▼  │
│                    ┌─────────┐      ┌───────────┐    ┌────────┐│
│                    │ ACTIVO  │      │ PAST_DUE  │    │CANCELAR││
│                    │ (pago ok)│      │(pago fallido)  │        ││
│                    └─────────┘      └───────────┘    └────────┘│
│                          │                 │                    │
│                          │                 ▼                    │
│                          │          ┌───────────┐              │
│                          │          │ SUSPENDED │              │
│                          │          │(3 días gracia)           │
│                          │          └───────────┘              │
│                          │                 │                    │
│                          ▼                 ▼                    │
│                    ┌─────────────────────────────┐             │
│                    │    RENOVACIÓN MENSUAL       │             │
│                    │  (automática vía webhook)   │             │
│                    └─────────────────────────────┘             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Modelo de Datos para Billing

```prisma
// Agregar al schema.prisma

model Subscription {
  id                String   @id @default(cuid())
  
  clinicId          String   @unique
  clinic            Clinic   @relation(fields: [clinicId], references: [id])
  
  // Plan
  plan              SubscriptionPlan
  
  // Mercado Pago
  mpPreapprovalId   String?  @unique  // ID de la suscripción en MP
  mpPayerId         String?            // ID del pagador en MP
  
  // Estado
  status            SubscriptionStatus
  
  // Fechas
  trialEndsAt       DateTime?
  currentPeriodStart DateTime?
  currentPeriodEnd   DateTime?
  cancelledAt       DateTime?
  
  // Precios (en centavos para evitar decimales)
  priceInCents      Int
  currency          String   @default("ARS")
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  payments          Payment[]
  
  @@map("subscriptions")
}

model Payment {
  id                String   @id @default(cuid())
  
  subscriptionId    String
  subscription      Subscription @relation(fields: [subscriptionId], references: [id])
  
  // Mercado Pago
  mpPaymentId       String   @unique
  mpStatus          String   // approved, pending, rejected
  
  // Monto
  amountInCents     Int
  currency          String   @default("ARS")
  
  // Período
  periodStart       DateTime
  periodEnd         DateTime
  
  paidAt            DateTime?
  
  createdAt         DateTime @default(now())
  
  @@map("payments")
}

// Agregar relación a Clinic
model Clinic {
  // ... campos existentes ...
  subscription      Subscription?
}
```

### Endpoints de Billing

```typescript
// billing.controller.ts

@Controller('billing')
export class BillingController {
  
  // Obtener planes disponibles
  @Get('plans')
  getPlans() {}
  
  // Crear suscripción (checkout de Mercado Pago)
  @Post('subscribe')
  @UseGuards(AuthGuard)
  createSubscription(@Body() dto: CreateSubscriptionDto) {}
  
  // Webhook de Mercado Pago
  @Post('webhook/mercadopago')
  handleMercadoPagoWebhook(@Body() payload: any) {}
  
  // Cancelar suscripción
  @Post('cancel')
  @UseGuards(AuthGuard)
  cancelSubscription() {}
  
  // Historial de pagos
  @Get('payments')
  @UseGuards(AuthGuard)
  getPayments() {}
  
  // Factura PDF
  @Get('invoices/:id/pdf')
  @UseGuards(AuthGuard)
  downloadInvoice(@Param('id') id: string) {}
}
```

---

## WhatsApp Multi-Tenant

### Arquitectura Recomendada: Cada Clínica con su Número

Esta es la opción más profesional y escalable:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        ARQUITECTURA WHATSAPP                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────┐                                                      │
│  │   CLÍNICA A    │                                                      │
│  │ +54 11 1111... │──┐                                                   │
│  └────────────────┘  │                                                   │
│                      │      ┌──────────────────┐                         │
│  ┌────────────────┐  │      │                  │      ┌──────────────┐   │
│  │   CLÍNICA B    │  ├─────▶│  META CLOUD API  │─────▶│  TU BACKEND  │   │
│  │ +54 11 2222... │──┤      │   (Webhook)      │      │  (webhook    │   │
│  └────────────────┘  │      │                  │      │   receiver)  │   │
│                      │      └──────────────────┘      └──────────────┘   │
│  ┌────────────────┐  │                                       │           │
│  │   CLÍNICA C    │──┘                                       │           │
│  │ +54 11 3333... │                                          ▼           │
│  └────────────────┘                               ┌──────────────────┐   │
│                                                   │                  │   │
│                                                   │   N8N + BOT      │   │
│                                                   │   (por clínica   │   │
│                                                   │   o compartido)  │   │
│                                                   │                  │   │
│                                                   └──────────────────┘   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Proceso de Onboarding de WhatsApp por Clínica

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   ONBOARDING WHATSAPP DE CLÍNICA                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PASO 1: Clínica va a Configuración → Integraciones → WhatsApp         │
│                              ↓                                          │
│  PASO 2: Ve botón "Conectar WhatsApp Business"                         │
│                              ↓                                          │
│  PASO 3: Se abre Facebook Embedded Signup (OAuth)                      │
│          - Login con cuenta de Facebook Business                        │
│          - Seleccionar/crear WhatsApp Business Account                 │
│          - Verificar número de teléfono                                │
│                              ↓                                          │
│  PASO 4: Facebook devuelve token de acceso a tu app                    │
│                              ↓                                          │
│  PASO 5: Guardas en BD:                                                │
│          - whatsapp_phone_number_id                                    │
│          - whatsapp_business_account_id                                │
│          - whatsapp_access_token (encriptado)                          │
│                              ↓                                          │
│  PASO 6: Configuras webhook en Meta apuntando a tu backend             │
│                              ↓                                          │
│  PASO 7: ¡Clínica lista para recibir mensajes!                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Modelo de Datos para WhatsApp

```prisma
// Agregar al schema.prisma

model WhatsAppConfig {
  id                      String   @id @default(cuid())
  
  clinicId                String   @unique
  clinic                  Clinic   @relation(fields: [clinicId], references: [id])
  
  // Meta/Facebook IDs
  wabaId                  String   // WhatsApp Business Account ID
  phoneNumberId           String   @unique // Phone Number ID en Meta
  displayPhoneNumber      String   // Número visible (+54 11...)
  
  // Tokens (ENCRIPTADOS)
  accessToken             String   // Token de acceso a la API
  accessTokenExpiresAt    DateTime?
  
  // Estado
  isActive                Boolean  @default(true)
  verifiedAt              DateTime?
  
  // Configuración del bot
  welcomeMessage          String?
  businessHoursMessage    String?
  outOfHoursMessage       String?
  
  // Límites (según plan)
  monthlyMessageLimit     Int      @default(1000)
  messagesThisMonth       Int      @default(0)
  
  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt
  
  @@map("whatsapp_configs")
}

model WhatsAppConversation {
  id                String   @id @default(cuid())
  
  clinicId          String
  
  // Contacto
  waId              String   // Número del paciente (sin +)
  profileName       String?  // Nombre del perfil
  
  // Estado de la conversación
  status            ConversationStatus @default(ACTIVE)
  context           Json?    // Estado del flujo del bot
  
  // Paciente vinculado (si se identificó)
  patientId         String?
  
  lastMessageAt     DateTime
  createdAt         DateTime @default(now())
  
  messages          WhatsAppMessage[]
  
  @@unique([clinicId, waId])
  @@map("whatsapp_conversations")
}

model WhatsAppMessage {
  id                String   @id @default(cuid())
  
  conversationId    String
  conversation      WhatsAppConversation @relation(fields: [conversationId], references: [id])
  
  // Meta IDs
  waMessageId       String   @unique
  
  // Contenido
  type              MessageType // text, image, document, etc.
  content           String?
  mediaUrl          String?
  
  // Dirección
  direction         MessageDirection // INBOUND, OUTBOUND
  
  // Estado (para outbound)
  status            String?  // sent, delivered, read, failed
  
  timestamp         DateTime
  createdAt         DateTime @default(now())
  
  @@map("whatsapp_messages")
}

enum ConversationStatus {
  ACTIVE
  RESOLVED
  EXPIRED
}

enum MessageType {
  TEXT
  IMAGE
  DOCUMENT
  AUDIO
  VIDEO
  LOCATION
  CONTACTS
  INTERACTIVE
  TEMPLATE
}

enum MessageDirection {
  INBOUND
  OUTBOUND
}
```

### Webhook Handler Multi-Tenant

```typescript
// whatsapp-webhook.controller.ts

@Controller('webhooks/whatsapp')
export class WhatsAppWebhookController {
  
  // Verificación del webhook (Meta lo requiere)
  @Get()
  verifyWebhook(@Query() query: VerifyWebhookDto) {
    if (query['hub.verify_token'] === process.env.WA_VERIFY_TOKEN) {
      return query['hub.challenge'];
    }
    throw new ForbiddenException();
  }
  
  // Recibir mensajes
  @Post()
  async handleMessage(@Body() payload: WhatsAppWebhookPayload) {
    // 1. Extraer phone_number_id del mensaje
    const phoneNumberId = payload.entry[0].changes[0].value.metadata.phone_number_id;
    
    // 2. Buscar qué clínica tiene este número
    const waConfig = await this.prisma.whatsAppConfig.findUnique({
      where: { phoneNumberId },
      include: { clinic: true }
    });
    
    if (!waConfig) {
      this.logger.warn(`Mensaje de número no registrado: ${phoneNumberId}`);
      return { status: 'ignored' };
    }
    
    // 3. Procesar mensaje para esa clínica
    await this.whatsappService.processInboundMessage(
      waConfig.clinic,
      payload
    );
    
    return { status: 'ok' };
  }
}
```

---

## Planes y Precios Sugeridos

### Estructura de Planes

| Característica | BÁSICO | PROFESIONAL | EMPRESARIAL |
|----------------|--------|-------------|-------------|
| **Precio mensual** | $15.000 ARS | $35.000 ARS | $75.000 ARS |
| **Doctores** | Hasta 3 | Hasta 10 | Ilimitados |
| **Pacientes** | 500 | 2.000 | Ilimitados |
| **Turnos/mes** | 300 | 1.500 | Ilimitados |
| **WhatsApp Bot** | ❌ | ✅ 1.000 msg | ✅ 5.000 msg |
| **Recordatorios** | Email | Email + WA | Email + WA |
| **Reportes** | Básicos | Avanzados | Personalizados |
| **Soporte** | Email | Email + Chat | Prioritario |
| **Multi-sucursal** | ❌ | ❌ | ✅ |
| **API acceso** | ❌ | ❌ | ✅ |

### Lógica de Límites

```typescript
// plan-limits.service.ts

export class PlanLimitsService {
  
  private readonly limits = {
    BASIC: {
      maxDoctors: 3,
      maxPatients: 500,
      maxAppointmentsPerMonth: 300,
      whatsappEnabled: false,
      maxWhatsappMessages: 0,
    },
    PROFESSIONAL: {
      maxDoctors: 10,
      maxPatients: 2000,
      maxAppointmentsPerMonth: 1500,
      whatsappEnabled: true,
      maxWhatsappMessages: 1000,
    },
    ENTERPRISE: {
      maxDoctors: Infinity,
      maxPatients: Infinity,
      maxAppointmentsPerMonth: Infinity,
      whatsappEnabled: true,
      maxWhatsappMessages: 5000,
    },
  };
  
  async canCreateDoctor(clinicId: string): Promise<boolean> {
    const clinic = await this.prisma.clinic.findUnique({
      where: { id: clinicId },
      include: { 
        subscription: true,
        users: { where: { role: 'DOCTOR' } }
      }
    });
    
    const plan = clinic.subscription?.plan || 'BASIC';
    const limit = this.limits[plan].maxDoctors;
    
    return clinic.users.length < limit;
  }
  
  async canCreateAppointment(clinicId: string): Promise<boolean> {
    // Contar turnos del mes actual
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const count = await this.prisma.appointment.count({
      where: {
        clinicId,
        createdAt: { gte: startOfMonth }
      }
    });
    
    const clinic = await this.getClinicWithPlan(clinicId);
    const limit = this.limits[clinic.plan].maxAppointmentsPerMonth;
    
    return count < limit;
  }
}
```

---

## Implementación Técnica

### Nuevos Módulos a Crear

```
apps/api/src/modules/
├── billing/
│   ├── billing.module.ts
│   ├── billing.controller.ts
│   ├── billing.service.ts
│   ├── mercadopago.service.ts      # Integración con MP
│   ├── dto/
│   │   ├── create-subscription.dto.ts
│   │   └── webhook-payload.dto.ts
│   └── guards/
│       └── plan-limits.guard.ts     # Verificar límites por plan
│
├── whatsapp/
│   ├── whatsapp.module.ts
│   ├── whatsapp-webhook.controller.ts
│   ├── whatsapp.service.ts
│   ├── whatsapp-bot.service.ts      # Lógica del bot conversacional
│   ├── meta-cloud-api.service.ts    # Cliente de Meta API
│   └── dto/
│       └── webhook-payload.dto.ts
│
└── plans/
    ├── plans.module.ts
    ├── plans.service.ts
    └── plan-limits.guard.ts
```

### Variables de Entorno Adicionales

```bash
# Mercado Pago
MP_ACCESS_TOKEN=APP_USR-xxx
MP_PUBLIC_KEY=APP_USR-xxx
MP_WEBHOOK_SECRET=xxx

# Meta/WhatsApp
META_APP_ID=123456789
META_APP_SECRET=xxx
META_VERIFY_TOKEN=tu-token-secreto
META_API_VERSION=v18.0

# URLs de webhook
WHATSAPP_WEBHOOK_URL=https://api.tudominio.com/webhooks/whatsapp
MP_WEBHOOK_URL=https://api.tudominio.com/billing/webhook/mercadopago
```

---

## Resumen de Trabajo Pendiente

### Para Sistema de Cobros (~8-10 horas)
- [ ] Crear módulo `billing` con integración Mercado Pago
- [ ] Modelos de Subscription y Payment en Prisma
- [ ] Endpoints de suscripción y webhooks
- [ ] Página de pricing y checkout en frontend
- [ ] Guards para limitar features por plan
- [ ] Panel de facturación para clínicas

### Para WhatsApp Multi-Tenant (~12-15 horas)
- [ ] Crear módulo `whatsapp`
- [ ] Integrar Facebook Embedded Signup (OAuth)
- [ ] Webhook receiver multi-tenant
- [ ] Bot conversacional básico (reservar turno)
- [ ] Modelos en Prisma
- [ ] Panel de configuración de WhatsApp por clínica
- [ ] Templates de mensajes (recordatorios, confirmaciones)

### Total Estimado: ~20-25 horas adicionales
