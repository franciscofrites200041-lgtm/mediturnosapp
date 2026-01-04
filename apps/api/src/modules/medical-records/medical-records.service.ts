import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { EncryptionService } from '@/common/services/encryption.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { RecordStatus } from '@prisma/client';

@Injectable()
export class MedicalRecordsService {
    // Fields that are encrypted for HIPAA compliance
    private readonly sensitiveFields: string[] = [
        'chiefComplaint',
        'presentIllness',
        'physicalExam',
        'diagnosis',
        'treatmentPlan',
        'notes',
    ];

    constructor(
        private prisma: PrismaService,
        private encryption: EncryptionService,
        private webhooksService: WebhooksService,
    ) { }

    async create(
        clinicId: string,
        doctorId: string,
        data: {
            patientId: string;
            appointmentId?: string;
            chiefComplaint?: string;
            presentIllness?: string;
            physicalExam?: string;
            diagnosis?: string;
            diagnosisCode?: string;
            treatmentPlan?: string;
            notes?: string;
            vitalSigns?: any;
            labOrders?: string;
            imagingOrders?: string;
        },
    ) {
        // Encrypt sensitive medical data
        const encryptedData = this.encryption.encryptFields(data, this.sensitiveFields);

        return this.prisma.medicalRecord.create({
            data: {
                ...encryptedData,
                clinicId,
                doctorId,
                status: 'DRAFT',
            },
        });
    }

    async findByPatient(clinicId: string, patientId: string) {
        const records = await this.prisma.medicalRecord.findMany({
            where: { clinicId, patientId, status: { not: 'DRAFT' } },
            include: {
                doctor: { select: { firstName: true, lastName: true } },
                appointment: { select: { scheduledAt: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Decrypt for viewing
        return records.map((r) => this.encryption.decryptFields(r, this.sensitiveFields));
    }

    async findOne(clinicId: string, id: string, doctorId?: string) {
        const record = await this.prisma.medicalRecord.findFirst({
            where: { id, clinicId },
            include: {
                patient: {
                    select: { id: true, firstName: true, lastName: true, birthDate: true },
                },
                doctor: { select: { id: true, firstName: true, lastName: true } },
                appointment: true,
            },
        });

        if (!record) throw new NotFoundException('Historia clínica no encontrada');

        // Only the creating doctor or admin can view drafts
        if (record.status === 'DRAFT' && record.doctorId !== doctorId) {
            throw new ForbiddenException('No tiene acceso a este registro');
        }

        return this.encryption.decryptFields(record, this.sensitiveFields);
    }

    async update(clinicId: string, id: string, doctorId: string, data: any) {
        const record = await this.findOne(clinicId, id, doctorId);

        // Only allow edits on drafts or creating amendments
        if (record.status === 'COMPLETED') {
            // Create amendment instead of modifying
            return this.prisma.medicalRecord.update({
                where: { id },
                data: {
                    status: 'AMENDED',
                    notes: this.encryption.encrypt(
                        `[ENMIENDA ${new Date().toISOString()}]: ${data.notes || ''}`,
                    ),
                },
            });
        }

        const encryptedData = this.encryption.encryptFields(data, this.sensitiveFields);

        return this.prisma.medicalRecord.update({
            where: { id },
            data: encryptedData,
        });
    }

    /**
     * Complete consultation - called when doctor clicks "Finalizar Consulta"
     * This also triggers webhooks for prescription delivery
     */
    async completeConsultation(
        clinicId: string,
        id: string,
        doctorId: string,
        data: {
            diagnosis?: string;
            treatmentPlan?: string;
            notes?: string;
            followUpDate?: Date;
            followUpNotes?: string;
        },
    ) {
        const record = await this.findOne(clinicId, id, doctorId);

        if (record.doctorId !== doctorId) {
            throw new ForbiddenException('Solo el doctor tratante puede finalizar la consulta');
        }

        const encryptedData = this.encryption.encryptFields(data, this.sensitiveFields);

        const completed = await this.prisma.medicalRecord.update({
            where: { id },
            data: {
                ...encryptedData,
                status: 'COMPLETED',
                completedAt: new Date(),
                followUpDate: data.followUpDate,
                followUpNotes: data.followUpNotes,
            },
            include: {
                patient: { select: { firstName: true, lastName: true, phone: true } },
                doctor: { select: { firstName: true, lastName: true } },
                appointment: true,
            },
        });

        // Update appointment status
        if (record.appointmentId) {
            await this.prisma.appointment.update({
                where: { id: record.appointmentId },
                data: { status: 'COMPLETED' },
            });
        }

        // Send webhook notification for follow-up
        if (data.followUpDate) {
            await this.webhooksService.notifyConsultationCompleted(clinicId, {
                id: record.id,
                patientName: `${completed.patient.firstName} ${completed.patient.lastName}`,
                patientPhone: completed.patient.phone,
                doctorName: `Dr. ${completed.doctor.firstName} ${completed.doctor.lastName}`,
                followUpDate: data.followUpDate,
                followUpNotes: data.followUpNotes,
            });
        }

        return { success: true, message: 'Consulta finalizada exitosamente' };
    }
}
