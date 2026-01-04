import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { EncryptionService } from '@/common/services/encryption.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PatientsService {
    // Fields that should be encrypted
    private readonly sensitiveFields: string[] = ['documentNumber'];

    constructor(
        private prisma: PrismaService,
        private encryption: EncryptionService,
    ) { }

    async create(clinicId: string, data: Prisma.PatientCreateInput & { clinicId?: never }) {
        // Encrypt sensitive data
        const encryptedData = this.encryption.encryptFields(
            { ...data, clinicId },
            this.sensitiveFields,
        );

        return this.prisma.patient.create({
            data: encryptedData as any,
        });
    }

    async findAll(clinicId: string, search?: string) {
        const where: Prisma.PatientWhereInput = { clinicId, isActive: true };

        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        const patients = await this.prisma.patient.findMany({
            where,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
                birthDate: true,
                insuranceProvider: true,
                createdAt: true,
            },
            orderBy: { lastName: 'asc' },
            take: 100,
        });

        return patients;
    }

    async findOne(clinicId: string, id: string) {
        const patient = await this.prisma.patient.findFirst({
            where: { id, clinicId },
            include: {
                appointments: {
                    orderBy: { scheduledAt: 'desc' },
                    take: 10,
                    include: {
                        doctor: { select: { firstName: true, lastName: true } },
                        area: { select: { name: true } },
                    },
                },
                _count: {
                    select: { appointments: true, medicalRecords: true },
                },
            },
        });

        if (!patient) throw new NotFoundException('Paciente no encontrado');

        // Decrypt sensitive fields
        return this.encryption.decryptFields(patient, this.sensitiveFields);
    }

    async update(clinicId: string, id: string, data: Prisma.PatientUpdateInput) {
        await this.findOne(clinicId, id);

        // Encrypt if updating sensitive fields
        const encryptedData = this.encryption.encryptFields(data as any, this.sensitiveFields);

        return this.prisma.patient.update({
            where: { id },
            data: encryptedData,
        });
    }

    /** Get patients for a specific doctor (those with appointments) */
    async findByDoctor(clinicId: string, doctorId: string) {
        return this.prisma.patient.findMany({
            where: {
                clinicId,
                isActive: true,
                appointments: {
                    some: { doctorId },
                },
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                birthDate: true,
                appointments: {
                    where: { doctorId },
                    orderBy: { scheduledAt: 'desc' },
                    take: 1,
                    select: { scheduledAt: true, status: true },
                },
            },
        });
    }

    /** Soft delete a patient (mark as inactive) */
    async softDelete(clinicId: string, id: string) {
        await this.findOne(clinicId, id); // Verify exists
        return this.prisma.patient.update({
            where: { id },
            data: { isActive: false },
        });
    }
}
