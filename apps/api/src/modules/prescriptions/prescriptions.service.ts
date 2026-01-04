import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import * as crypto from 'crypto';

@Injectable()
export class PrescriptionsService {
    constructor(
        private prisma: PrismaService,
        private webhooksService: WebhooksService,
    ) { }

    async create(
        clinicId: string,
        doctorId: string,
        data: {
            patientId: string;
            appointmentId?: string;
            medications: Array<{
                name: string;
                dosage?: string;
                frequency?: string;
                duration?: string;
                notes?: string;
            }>;
            instructions?: string;
            diagnosis?: string;
            validUntil?: Date;
        },
    ) {
        const doctor = await this.prisma.user.findUnique({
            where: { id: doctorId },
            select: { firstName: true, lastName: true, signature: true, licenseNumber: true },
        });

        if (!doctor) throw new ForbiddenException('Doctor no encontrado');

        return this.prisma.prescription.create({
            data: {
                clinicId,
                doctorId,
                patientId: data.patientId,
                appointmentId: data.appointmentId,
                medications: data.medications,
                instructions: data.instructions,
                diagnosis: data.diagnosis,
                validUntil: data.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            },
            include: {
                patient: { select: { firstName: true, lastName: true } },
                doctor: { select: { firstName: true, lastName: true } },
            },
        });
    }

    async findByPatient(clinicId: string, patientId: string) {
        return this.prisma.prescription.findMany({
            where: { clinicId, patientId },
            include: {
                doctor: { select: { firstName: true, lastName: true } },
                appointment: { select: { scheduledAt: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(clinicId: string, id: string) {
        const prescription = await this.prisma.prescription.findFirst({
            where: { id, clinicId },
            include: {
                patient: true,
                doctor: { select: { firstName: true, lastName: true, licenseNumber: true, signature: true } },
            },
        });

        if (!prescription) throw new NotFoundException('Receta no encontrada');
        return prescription;
    }

    /**
     * Sign and send prescription to patient
     * This triggers the webhook to n8n for WhatsApp delivery
     */
    async sendPrescription(clinicId: string, id: string, doctorId: string) {
        const prescription = await this.findOne(clinicId, id);

        if (prescription.doctorId !== doctorId) {
            throw new ForbiddenException('Solo el doctor que creó la receta puede enviarla');
        }

        // Create digital signature hash
        const signatureData = JSON.stringify({
            prescriptionId: id,
            doctorId,
            patientId: prescription.patientId,
            medications: prescription.medications,
            timestamp: new Date().toISOString(),
        });
        const signatureHash = crypto.createHash('sha256').update(signatureData).digest('hex');

        // Update prescription as signed and sent
        const updated = await this.prisma.prescription.update({
            where: { id },
            data: {
                signedAt: new Date(),
                signatureHash,
                sentAt: new Date(),
                sentVia: 'whatsapp',
            },
            include: {
                patient: { select: { firstName: true, lastName: true, phone: true, email: true } },
                doctor: { select: { firstName: true, lastName: true } },
            },
        });

        // Send webhook to n8n for WhatsApp delivery
        await this.webhooksService.notifyPrescriptionSent(clinicId, {
            id: updated.id,
            patientName: `${updated.patient.firstName} ${updated.patient.lastName}`,
            patientPhone: updated.patient.phone,
            patientEmail: updated.patient.email || undefined,
            doctorName: `Dr. ${updated.doctor.firstName} ${updated.doctor.lastName}`,
            medications: updated.medications as any[],
            instructions: updated.instructions || undefined,
            diagnosis: updated.diagnosis || undefined,
        });

        return {
            success: true,
            message: 'Receta enviada exitosamente',
            prescriptionId: id,
        };
    }
}
