import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

// Core modules
import { PrismaModule } from './common/prisma/prisma.module';
import { CommonServicesModule } from './common/services/common-services.module';
import { EmailModule } from './common/email/email.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ClinicsModule } from './modules/clinics/clinics.module';
import { PatientsModule } from './modules/patients/patients.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { AreasModule } from './modules/areas/areas.module';
import { MedicalRecordsModule } from './modules/medical-records/medical-records.module';
import { PrescriptionsModule } from './modules/prescriptions/prescriptions.module';
import { N8nModule } from './modules/n8n/n8n.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { BillingModule } from './modules/billing/billing.module';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';

@Module({
    imports: [
        // Configuration
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env.local', '.env'],
        }),

        // Rate limiting
        ThrottlerModule.forRoot([{
            ttl: parseInt(process.env.THROTTLE_TTL || '60') * 1000,
            limit: parseInt(process.env.THROTTLE_LIMIT || '100'),
        }]),

        // Database
        PrismaModule,

        // Common services (encryption, etc.)
        CommonServicesModule,

        // Email service
        EmailModule,

        // Feature modules
        AuthModule,
        UsersModule,
        ClinicsModule,
        PatientsModule,
        AppointmentsModule,
        AreasModule,
        MedicalRecordsModule,
        PrescriptionsModule,
        SchedulesModule,
        InvoicesModule,
        BillingModule,
        WhatsAppModule,

        // Integration modules
        N8nModule,
        WebhooksModule,
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule { }
