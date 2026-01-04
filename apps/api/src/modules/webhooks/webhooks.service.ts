import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/common/prisma/prisma.service';
import * as crypto from 'crypto';

export enum WebhookEventType {
    PRESCRIPTION_SENT = 'PRESCRIPTION_SENT',
    APPOINTMENT_CREATED = 'APPOINTMENT_CREATED',
    APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
    APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER',
    CONSULTATION_COMPLETED = 'CONSULTATION_COMPLETED',
}

export interface WebhookPayload {
    event: WebhookEventType;
    timestamp: string;
    clinicId: string;
    data: Record<string, any>;
}

@Injectable()
export class WebhooksService {
    private readonly logger = new Logger(WebhooksService.name);

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) { }

    /**
     * Sends a webhook event to the clinic's configured n8n webhook URL
     * This is called when:
     * - A doctor sends a prescription (PRESCRIPTION_SENT)
     * - A consultation is completed (CONSULTATION_COMPLETED)
     * - An appointment is created/cancelled
     */
    async sendWebhook(clinicId: string, eventType: WebhookEventType, data: Record<string, any>) {
        // Get clinic webhook config
        const clinic = await this.prisma.clinic.findUnique({
            where: { id: clinicId },
            select: { webhookUrl: true, webhookSecret: true, name: true },
        });

        if (!clinic?.webhookUrl) {
            this.logger.log(`No webhook URL configured for clinic ${clinicId}`);
            return null;
        }

        const payload: WebhookPayload = {
            event: eventType,
            timestamp: new Date().toISOString(),
            clinicId,
            data,
        };

        // Create signature for verification
        const signature = this.createSignature(payload, clinic.webhookSecret || '');

        // Save event to database
        const webhookEvent = await this.prisma.webhookEvent.create({
            data: {
                clinicId,
                eventType,
                payload: payload as any,
                status: 'PENDING',
            },
        });

        // Send webhook asynchronously
        this.deliverWebhook(webhookEvent.id, clinic.webhookUrl, payload, signature);

        return webhookEvent;
    }

    /**
     * Specific method for prescription sent event (used by doctor's "Finalizar Consulta" action)
     */
    async notifyPrescriptionSent(
        clinicId: string,
        prescription: {
            id: string;
            patientName: string;
            patientPhone: string;
            patientEmail?: string;
            doctorName: string;
            medications: any[];
            instructions?: string;
            diagnosis?: string;
        },
    ) {
        return this.sendWebhook(clinicId, WebhookEventType.PRESCRIPTION_SENT, {
            prescriptionId: prescription.id,
            patient: {
                name: prescription.patientName,
                phone: prescription.patientPhone,
                email: prescription.patientEmail,
            },
            doctor: prescription.doctorName,
            medications: prescription.medications,
            instructions: prescription.instructions,
            diagnosis: prescription.diagnosis,
            // Format prescription as text for WhatsApp
            prescriptionText: this.formatPrescriptionForWhatsApp(prescription),
        });
    }

    /**
     * Notify when consultation is completed
     */
    async notifyConsultationCompleted(
        clinicId: string,
        appointment: {
            id: string;
            patientName: string;
            patientPhone: string;
            doctorName: string;
            followUpDate?: Date;
            followUpNotes?: string;
        },
    ) {
        return this.sendWebhook(clinicId, WebhookEventType.CONSULTATION_COMPLETED, {
            appointmentId: appointment.id,
            patient: {
                name: appointment.patientName,
                phone: appointment.patientPhone,
            },
            doctor: appointment.doctorName,
            followUp: appointment.followUpDate
                ? {
                    date: appointment.followUpDate.toISOString(),
                    notes: appointment.followUpNotes,
                }
                : null,
        });
    }

    /**
     * Notify appointment reminder (can be triggered by a cron job)
     */
    async notifyAppointmentReminder(
        clinicId: string,
        appointment: {
            id: string;
            patientName: string;
            patientPhone: string;
            doctorName: string;
            scheduledAt: Date;
            specialty: string;
        },
    ) {
        return this.sendWebhook(clinicId, WebhookEventType.APPOINTMENT_REMINDER, {
            appointmentId: appointment.id,
            patient: {
                name: appointment.patientName,
                phone: appointment.patientPhone,
            },
            doctor: appointment.doctorName,
            specialty: appointment.specialty,
            dateTime: appointment.scheduledAt.toISOString(),
            formattedDate: appointment.scheduledAt.toLocaleDateString('es-AR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
            }),
            formattedTime: appointment.scheduledAt.toLocaleTimeString('es-AR', {
                hour: '2-digit',
                minute: '2-digit',
            }),
        });
    }

    /**
     * Retry failed webhooks
     */
    async retryFailedWebhooks() {
        const failedEvents = await this.prisma.webhookEvent.findMany({
            where: {
                status: { in: ['FAILED', 'RETRYING'] },
                attempts: { lt: 3 },
            },
        });

        for (const event of failedEvents) {
            const clinic = await this.prisma.clinic.findUnique({
                where: { id: event.clinicId },
                select: { webhookUrl: true, webhookSecret: true },
            });

            if (clinic?.webhookUrl) {
                await this.prisma.webhookEvent.update({
                    where: { id: event.id },
                    data: { status: 'RETRYING' },
                });

                const signature = this.createSignature(event.payload as unknown as WebhookPayload, clinic.webhookSecret || '');
                this.deliverWebhook(event.id, clinic.webhookUrl, event.payload as unknown as WebhookPayload, signature);
            }
        }
    }

    // Private methods

    private async deliverWebhook(eventId: string, url: string, payload: WebhookPayload, signature: string) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-MediTurnos-Signature': signature,
                    'X-MediTurnos-Event': payload.event,
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                await this.prisma.webhookEvent.update({
                    where: { id: eventId },
                    data: {
                        status: 'DELIVERED',
                        deliveredAt: new Date(),
                        attempts: { increment: 1 },
                        lastAttempt: new Date(),
                    },
                });
                this.logger.log(`Webhook delivered successfully: ${eventId}`);
            } else {
                throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }
        } catch (error: any) {
            this.logger.error(`Failed to deliver webhook ${eventId}: ${error.message}`);

            await this.prisma.webhookEvent.update({
                where: { id: eventId },
                data: {
                    status: 'FAILED',
                    attempts: { increment: 1 },
                    lastAttempt: new Date(),
                    lastError: error.message,
                },
            });
        }
    }

    private createSignature(payload: WebhookPayload, secret: string): string {
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(JSON.stringify(payload));
        return `sha256=${hmac.digest('hex')}`;
    }

    private formatPrescriptionForWhatsApp(prescription: {
        doctorName: string;
        medications: any[];
        instructions?: string;
        diagnosis?: string;
    }): string {
        let text = `📋 *RECETA MÉDICA*\n\n`;
        text += `👨‍⚕️ Doctor: ${prescription.doctorName}\n\n`;

        if (prescription.diagnosis) {
            text += `📌 Diagnóstico: ${prescription.diagnosis}\n\n`;
        }

        text += `💊 *Medicamentos:*\n`;
        prescription.medications.forEach((med: any, index: number) => {
            text += `${index + 1}. ${med.name}`;
            if (med.dosage) text += ` - ${med.dosage}`;
            if (med.frequency) text += ` - ${med.frequency}`;
            if (med.duration) text += ` (${med.duration})`;
            text += '\n';
        });

        if (prescription.instructions) {
            text += `\n📝 *Indicaciones:*\n${prescription.instructions}\n`;
        }

        text += `\n⚠️ Esta receta es solo para uso del paciente indicado.`;

        return text;
    }
}
