import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { QueryAppointmentsDto } from './dto/query-appointments.dto';
import { AppointmentStatus, Prisma } from '@prisma/client';
import { EncryptionService } from '@/common/services/encryption.service';

export class BotAppointmentDto {
    doctorId: string;
    date: string;
    time: string;
    dni: string;
    patientPhone: string;
    apiKey: string;
}

@Injectable()
export class AppointmentsService {
    constructor(
        private prisma: PrismaService,
        private encryption: EncryptionService,
    ) { }

    /**
     * Create a new appointment
     */
    async create(clinicId: string, dto: CreateAppointmentDto, createdById?: string) {
        // Validate doctor belongs to clinic
        const doctor = await this.prisma.user.findFirst({
            where: { id: dto.doctorId, clinicId, role: 'DOCTOR', isActive: true },
        });

        if (!doctor) {
            throw new BadRequestException('Doctor no encontrado o no pertenece a esta clínica');
        }

        // Validate patient belongs to clinic
        const patient = await this.prisma.patient.findFirst({
            where: { id: dto.patientId, clinicId, isActive: true },
        });

        if (!patient) {
            throw new BadRequestException('Paciente no encontrado');
        }

        // Check for conflicts
        const conflict = await this.checkConflict(
            dto.doctorId,
            new Date(dto.scheduledAt),
            dto.duration || 30,
        );

        if (conflict) {
            throw new BadRequestException('El doctor ya tiene un turno en ese horario');
        }

        return this.prisma.appointment.create({
            data: {
                patientId: dto.patientId,
                doctorId: dto.doctorId,
                areaId: dto.areaId,
                clinicId,
                scheduledAt: new Date(dto.scheduledAt),
                duration: dto.duration || 30,
                type: dto.type || 'IN_PERSON',
                reason: dto.reason,
                notes: dto.notes,
                source: dto.source || 'WALK_IN',
                createdById,
            },
            include: {
                patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
                doctor: { select: { id: true, firstName: true, lastName: true } },
                area: { select: { id: true, name: true, color: true } },
            },
        });
    }

    /**
     * Find all appointments with filters
     */
    async findAll(clinicId: string, query: QueryAppointmentsDto) {
        const where: Prisma.AppointmentWhereInput = {
            clinicId,
        };

        // Date range filter
        if (query.startDate || query.endDate) {
            where.scheduledAt = {};
            if (query.startDate) {
                where.scheduledAt.gte = new Date(query.startDate);
            }
            if (query.endDate) {
                where.scheduledAt.lte = new Date(query.endDate);
            }
        }

        // Doctor filter
        if (query.doctorId) {
            where.doctorId = query.doctorId;
        }

        // Area filter
        if (query.areaId) {
            where.areaId = query.areaId;
        }

        // Status filter
        if (query.status) {
            where.status = query.status;
        }

        // Patient filter
        if (query.patientId) {
            where.patientId = query.patientId;
        }

        const [appointments, total] = await Promise.all([
            this.prisma.appointment.findMany({
                where,
                include: {
                    patient: {
                        select: { id: true, firstName: true, lastName: true, phone: true, email: true },
                    },
                    doctor: {
                        select: { id: true, firstName: true, lastName: true },
                    },
                    area: {
                        select: { id: true, name: true, color: true },
                    },
                },
                orderBy: { scheduledAt: 'asc' },
                skip: query.skip || 0,
                take: query.take || 50,
            }),
            this.prisma.appointment.count({ where }),
        ]);

        return {
            data: appointments,
            total,
            page: Math.floor((query.skip || 0) / (query.take || 50)) + 1,
            pageSize: query.take || 50,
        };
    }

    /**
     * Find appointments for calendar view (optimized)
     */
    async findForCalendar(clinicId: string, startDate: Date, endDate: Date, doctorId?: string, areaId?: string) {
        const where: Prisma.AppointmentWhereInput = {
            clinicId,
            scheduledAt: {
                gte: startDate,
                lte: endDate,
            },
            status: {
                notIn: ['CANCELLED'],
            },
        };

        if (doctorId) {
            where.doctorId = doctorId;
        }

        if (areaId) {
            where.areaId = areaId;
        }

        return this.prisma.appointment.findMany({
            where,
            select: {
                id: true,
                scheduledAt: true,
                duration: true,
                status: true,
                type: true,
                reason: true,
                patient: {
                    select: { id: true, firstName: true, lastName: true },
                },
                doctor: {
                    select: { id: true, firstName: true, lastName: true },
                },
                area: {
                    select: { id: true, name: true, color: true },
                },
            },
            orderBy: { scheduledAt: 'asc' },
        });
    }

    /**
     * Get doctor's agenda for today
     */
    async getDoctorAgenda(clinicId: string, doctorId: string, date?: Date) {
        const targetDate = date || new Date();
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        return this.prisma.appointment.findMany({
            where: {
                clinicId,
                doctorId,
                scheduledAt: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            include: {
                patient: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        birthDate: true,
                        insuranceProvider: true,
                    },
                },
                area: { select: { name: true, color: true } },
                medicalRecord: { select: { id: true, status: true } },
            },
            orderBy: { scheduledAt: 'asc' },
        });
    }

    /**
     * Find one appointment by ID
     */
    async findOne(clinicId: string, id: string) {
        const appointment = await this.prisma.appointment.findFirst({
            where: { id, clinicId },
            include: {
                patient: true,
                doctor: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                area: true,
                medicalRecord: true,
                prescription: true,
            },
        });

        if (!appointment) {
            throw new NotFoundException('Turno no encontrado');
        }

        return appointment;
    }

    /**
     * Update appointment
     */
    async update(clinicId: string, id: string, dto: UpdateAppointmentDto) {
        const appointment = await this.findOne(clinicId, id);

        // If rescheduling, check for conflicts
        if (dto.scheduledAt && dto.scheduledAt !== appointment.scheduledAt.toISOString()) {
            const conflict = await this.checkConflict(
                dto.doctorId || appointment.doctorId,
                new Date(dto.scheduledAt),
                dto.duration || appointment.duration,
                id,
            );

            if (conflict) {
                throw new BadRequestException('Conflicto de horario con otro turno');
            }
        }

        return this.prisma.appointment.update({
            where: { id },
            data: {
                ...dto,
                scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
            },
            include: {
                patient: { select: { id: true, firstName: true, lastName: true } },
                doctor: { select: { id: true, firstName: true, lastName: true } },
                area: { select: { id: true, name: true, color: true } },
            },
        });
    }

    /**
     * Update appointment status
     */
    async updateStatus(clinicId: string, id: string, status: AppointmentStatus, cancelReason?: string) {
        const appointment = await this.findOne(clinicId, id);

        const updateData: any = { status };

        if (status === 'CANCELLED') {
            updateData.cancelledAt = new Date();
            updateData.cancelReason = cancelReason;
        }

        return this.prisma.appointment.update({
            where: { id },
            data: updateData,
        });
    }

    /**
     * Cancel appointment
     */
    async cancel(clinicId: string, id: string, reason?: string) {
        return this.updateStatus(clinicId, id, 'CANCELLED', reason);
    }

    /**
     * Check for scheduling conflicts
     */
    private async checkConflict(
        doctorId: string,
        scheduledAt: Date,
        duration: number,
        excludeId?: string,
    ): Promise<boolean> {
        const endTime = new Date(scheduledAt.getTime() + duration * 60000);

        const conflict = await this.prisma.appointment.findFirst({
            where: {
                doctorId,
                status: { notIn: ['CANCELLED', 'NO_SHOW'] },
                id: excludeId ? { not: excludeId } : undefined,
                OR: [
                    {
                        // New appointment starts during existing
                        scheduledAt: {
                            lte: scheduledAt,
                        },
                        AND: {
                            scheduledAt: {
                                gt: new Date(scheduledAt.getTime() - duration * 60000),
                            },
                        },
                    },
                    {
                        // Existing appointment starts during new
                        scheduledAt: {
                            gte: scheduledAt,
                            lt: endTime,
                        },
                    },
                ],
            },
        });

        return !!conflict;
    }

    /**
     * Get available slots for a doctor on a specific date
     */
    async getAvailableSlots(clinicId: string, doctorId: string, date: Date) {
        // Get doctor's schedule for the day
        const dayOfWeek = date.getDay();

        const schedules = await this.prisma.doctorSchedule.findMany({
            where: {
                doctorId,
                clinicId,
                dayOfWeek,
                isActive: true,
            },
        });

        if (schedules.length === 0) {
            return [];
        }

        // Get existing appointments for the day
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const existingAppointments = await this.prisma.appointment.findMany({
            where: {
                doctorId,
                clinicId,
                scheduledAt: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
                status: { notIn: ['CANCELLED', 'NO_SHOW'] },
            },
            select: {
                scheduledAt: true,
                duration: true,
            },
        });

        // Generate available slots
        const slots: { start: Date; end: Date }[] = [];

        for (const schedule of schedules) {
            const [startHour, startMin] = schedule.startTime.split(':').map(Number);
            const [endHour, endMin] = schedule.endTime.split(':').map(Number);
            const slotDuration = schedule.slotDuration;

            const scheduleStart = new Date(date);
            scheduleStart.setHours(startHour, startMin, 0, 0);

            const scheduleEnd = new Date(date);
            scheduleEnd.setHours(endHour, endMin, 0, 0);

            let currentSlot = new Date(scheduleStart);

            while (currentSlot < scheduleEnd) {
                const slotEnd = new Date(currentSlot.getTime() + slotDuration * 60000);

                // Check if slot conflicts with existing appointments
                const isOccupied = existingAppointments.some((appt) => {
                    const apptEnd = new Date(appt.scheduledAt.getTime() + appt.duration * 60000);
                    return (
                        (currentSlot >= appt.scheduledAt && currentSlot < apptEnd) ||
                        (slotEnd > appt.scheduledAt && slotEnd <= apptEnd)
                    );
                });

                // Only add future slots
                if (!isOccupied && currentSlot > new Date()) {
                    slots.push({
                        start: new Date(currentSlot),
                        end: new Date(slotEnd),
                    });
                }

                currentSlot = new Date(currentSlot.getTime() + slotDuration * 60000);
            }
        }

        return slots;
    }

    async createFromBot(dto: BotAppointmentDto) {
        // Simple API Key Protection
        if (dto.apiKey !== 'mediturnos_secret_bot_key') {
            throw new ForbiddenException('Invalid Bot API Key');
        }

        // 1. Get Doctor to know clinic
        const doctor = await this.prisma.user.findUnique({
            where: { id: dto.doctorId },
            include: { clinic: true }
        });

        if (!doctor || !doctor.clinicId) throw new NotFoundException('Doctor no encontrado o sin clínica');

        const clinicId = doctor.clinicId;

        // 2. Find or Create Patient
        // Try searching by phone first (WhatsApp number is reliable/verified by Meta)
        let patient = await this.prisma.patient.findFirst({
            where: {
                phone: dto.patientPhone,
                clinicId
            }
        });

        if (!patient) {
            const encryptedDni = this.encryption.encrypt(dto.dni);

            patient = await this.prisma.patient.create({
                data: {
                    firstName: "Paciente",
                    lastName: `(DNI: ${dto.dni})`,
                    phone: dto.patientPhone,
                    email: `bot_${dto.dni}@temp.com`, // Dummy email
                    documentNumber: encryptedDni,
                    clinicId,
                    isActive: true,
                    // Default insurance
                }
            });
        }

        // 3. Create Appointment
        const scheduledAt = new Date(`${dto.date}T${dto.time}:00`);

        // Use doctor's primary specialty
        const areaId = doctor.specialtyId;
        if (!areaId) {
            // Fallback: Try to find first specialty if relation exists, or error
            throw new BadRequestException('El doctor no tiene especialidad asignada para el turno');
        }

        // Call generic create method
        return this.create(clinicId, {
            doctorId: dto.doctorId,
            patientId: patient.id,
            areaId: areaId,
            scheduledAt: scheduledAt.toISOString(),
            duration: 30, // Default duration
            type: 'IN_PERSON',
            reason: 'Reserva vía WhatsApp Bot',
            source: 'WHATSAPP'
        }, 'BOT');
    }
}
