import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { BookAppointmentDto } from './dto/book-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';

@Injectable()
export class N8nService {
    constructor(private prisma: PrismaService) { }

    /**
     * Endpoint 1: Check availability for a doctor/specialty on a date
     * Called by n8n when user asks for available slots via WhatsApp
     */
    async checkAvailability(clinicId: string, dto: CheckAvailabilityDto) {
        let doctorId = dto.doctorId;

        // If specialty provided instead of doctor, find doctors in that specialty
        if (!doctorId && dto.specialty) {
            const area = await this.prisma.area.findFirst({
                where: {
                    clinicId,
                    name: { contains: dto.specialty, mode: 'insensitive' },
                    isActive: true,
                },
                include: {
                    doctors: {
                        where: { isActive: true },
                        select: { id: true, firstName: true, lastName: true },
                    },
                },
            });

            if (!area || area.doctors.length === 0) {
                return {
                    success: false,
                    message: `No se encontraron doctores en la especialidad ${dto.specialty}`,
                    slots: [],
                };
            }

            // Return availability for all doctors in the specialty
            const allSlots = [];
            for (const doctor of area.doctors) {
                const slots = await this.getSlotsForDoctor(clinicId, doctor.id, new Date(dto.date));
                allSlots.push({
                    doctor: {
                        id: doctor.id,
                        name: `${doctor.firstName} ${doctor.lastName}`,
                    },
                    specialty: area.name,
                    slots: slots.map((s) => ({
                        start: s.start.toISOString(),
                        end: s.end.toISOString(),
                        formatted: this.formatTime(s.start),
                    })),
                });
            }

            return {
                success: true,
                date: dto.date,
                availability: allSlots.filter((d) => d.slots.length > 0),
            };
        }

        // Get slots for specific doctor
        if (doctorId) {
            const doctor = await this.prisma.user.findFirst({
                where: { id: doctorId, clinicId, role: 'DOCTOR', isActive: true },
                select: { id: true, firstName: true, lastName: true, specialty: true },
            });

            if (!doctor) {
                return {
                    success: false,
                    message: 'Doctor no encontrado',
                    slots: [],
                };
            }

            const slots = await this.getSlotsForDoctor(clinicId, doctorId, new Date(dto.date));

            return {
                success: true,
                date: dto.date,
                doctor: {
                    id: doctor.id,
                    name: `${doctor.firstName} ${doctor.lastName}`,
                    specialty: doctor.specialty?.name,
                },
                slots: slots.map((s) => ({
                    start: s.start.toISOString(),
                    end: s.end.toISOString(),
                    formatted: this.formatTime(s.start),
                })),
            };
        }

        return {
            success: false,
            message: 'Debe especificar un doctor o especialidad',
            slots: [],
        };
    }

    /**
     * Endpoint 2: Book an appointment
     * Called by n8n when user confirms a slot via WhatsApp
     */
    async bookAppointment(clinicId: string, dto: BookAppointmentDto) {
        // Validate doctor
        const doctor = await this.prisma.user.findFirst({
            where: { id: dto.doctorId, clinicId, role: 'DOCTOR', isActive: true },
        });

        if (!doctor) {
            throw new BadRequestException('Doctor no encontrado');
        }

        // Find or create patient by phone
        let patient = await this.prisma.patient.findFirst({
            where: { clinicId, phone: dto.patientPhone },
        });

        if (!patient) {
            // Create new patient from WhatsApp data
            patient = await this.prisma.patient.create({
                data: {
                    clinicId,
                    firstName: dto.patientName.split(' ')[0],
                    lastName: dto.patientName.split(' ').slice(1).join(' ') || dto.patientName,
                    phone: dto.patientPhone,
                    email: dto.patientEmail,
                    documentNumber: dto.patientDocumentNumber || 'PENDIENTE',
                    source: 'WHATSAPP',
                },
            });
        }

        // Check if slot is still available
        const scheduledAt = new Date(dto.slotStart);
        const conflict = await this.prisma.appointment.findFirst({
            where: {
                doctorId: dto.doctorId,
                scheduledAt,
                status: { notIn: ['CANCELLED', 'NO_SHOW'] },
            },
        });

        if (conflict) {
            return {
                success: false,
                message: 'Lo sentimos, el turno ya no está disponible. Por favor seleccione otro horario.',
            };
        }

        // Get doctor's specialty/area
        const area = doctor.specialtyId
            ? await this.prisma.area.findUnique({ where: { id: doctor.specialtyId } })
            : await this.prisma.area.findFirst({ where: { clinicId, isActive: true } });

        if (!area) {
            throw new BadRequestException('No se encontró área para el doctor');
        }

        // Create appointment
        const appointment = await this.prisma.appointment.create({
            data: {
                patientId: patient.id,
                doctorId: dto.doctorId,
                areaId: area.id,
                clinicId,
                scheduledAt,
                duration: dto.duration || 30,
                reason: dto.reason,
                source: 'WHATSAPP',
                status: 'CONFIRMED',
            },
            include: {
                doctor: { select: { firstName: true, lastName: true } },
                patient: { select: { firstName: true, lastName: true, phone: true } },
                area: { select: { name: true } },
            },
        });

        return {
            success: true,
            message: 'Turno reservado exitosamente',
            appointment: {
                id: appointment.id,
                date: this.formatDate(appointment.scheduledAt),
                time: this.formatTime(appointment.scheduledAt),
                doctor: `${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
                specialty: appointment.area.name,
                patient: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
                confirmationCode: appointment.id.slice(-6).toUpperCase(),
            },
        };
    }

    /**
     * Endpoint 3: Cancel an appointment
     * Called by n8n when user wants to cancel via WhatsApp
     */
    async cancelAppointment(clinicId: string, dto: CancelAppointmentDto) {
        // Find appointment by ID or confirmation code
        let appointment;

        if (dto.appointmentId) {
            appointment = await this.prisma.appointment.findFirst({
                where: { id: dto.appointmentId, clinicId },
                include: {
                    patient: { select: { phone: true } },
                },
            });
        } else if (dto.patientPhone && dto.confirmationCode) {
            // Find by phone and last 6 chars of ID
            appointment = await this.prisma.appointment.findFirst({
                where: {
                    clinicId,
                    id: { endsWith: dto.confirmationCode.toLowerCase() },
                    patient: { phone: dto.patientPhone },
                    status: { notIn: ['CANCELLED', 'COMPLETED'] },
                },
                include: {
                    patient: { select: { phone: true } },
                },
            });
        }

        if (!appointment) {
            return {
                success: false,
                message: 'No se encontró el turno. Verifique el código de confirmación.',
            };
        }

        // Check if appointment is in the past
        if (appointment.scheduledAt < new Date()) {
            return {
                success: false,
                message: 'No se puede cancelar un turno pasado.',
            };
        }

        // Cancel the appointment
        await this.prisma.appointment.update({
            where: { id: appointment.id },
            data: {
                status: 'CANCELLED',
                cancelledAt: new Date(),
                cancelReason: dto.reason || 'Cancelado por el paciente vía WhatsApp',
            },
        });

        return {
            success: true,
            message: 'El turno ha sido cancelado exitosamente.',
            cancelledAppointmentId: appointment.id,
        };
    }

    /**
     * Get doctors list for n8n to show options
     */
    async getDoctors(clinicId: string, specialty?: string) {
        const where: any = {
            clinicId,
            role: 'DOCTOR',
            isActive: true,
        };

        if (specialty) {
            where.specialty = {
                name: { contains: specialty, mode: 'insensitive' },
            };
        }

        const doctors = await this.prisma.user.findMany({
            where,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                specialty: { select: { id: true, name: true } },
            },
        });

        return doctors.map((d) => ({
            id: d.id,
            name: `${d.firstName} ${d.lastName}`,
            specialty: d.specialty?.name,
        }));
    }

    /**
     * Get specialties list
     */
    async getSpecialties(clinicId: string) {
        return this.prisma.area.findMany({
            where: { clinicId, isActive: true },
            select: { id: true, name: true },
        });
    }

    // Helper methods
    private async getSlotsForDoctor(clinicId: string, doctorId: string, date: Date) {
        const dayOfWeek = date.getDay();

        const schedules = await this.prisma.doctorSchedule.findMany({
            where: { doctorId, clinicId, dayOfWeek, isActive: true },
        });

        if (schedules.length === 0) return [];

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const existingAppointments = await this.prisma.appointment.findMany({
            where: {
                doctorId,
                clinicId,
                scheduledAt: { gte: startOfDay, lte: endOfDay },
                status: { notIn: ['CANCELLED', 'NO_SHOW'] },
            },
            select: { scheduledAt: true, duration: true },
        });

        const slots: { start: Date; end: Date }[] = [];

        for (const schedule of schedules) {
            const [startHour, startMin] = schedule.startTime.split(':').map(Number);
            const [endHour, endMin] = schedule.endTime.split(':').map(Number);

            const scheduleStart = new Date(date);
            scheduleStart.setHours(startHour, startMin, 0, 0);

            const scheduleEnd = new Date(date);
            scheduleEnd.setHours(endHour, endMin, 0, 0);

            let currentSlot = new Date(scheduleStart);

            while (currentSlot < scheduleEnd) {
                const slotEnd = new Date(currentSlot.getTime() + schedule.slotDuration * 60000);

                const isOccupied = existingAppointments.some((appt) => {
                    const apptEnd = new Date(appt.scheduledAt.getTime() + appt.duration * 60000);
                    return currentSlot >= appt.scheduledAt && currentSlot < apptEnd;
                });

                if (!isOccupied && currentSlot > new Date()) {
                    slots.push({ start: new Date(currentSlot), end: new Date(slotEnd) });
                }

                currentSlot = new Date(currentSlot.getTime() + schedule.slotDuration * 60000);
            }
        }

        return slots;
    }

    private formatTime(date: Date): string {
        return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    }

    private formatDate(date: Date): string {
        return date.toLocaleDateString('es-AR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }

    /**
     * Get clinic configuration for n8n
     * This replaces the need for Google Sheets - n8n can query this directly
     */
    async getClinicConfig(clinicId: string) {
        const clinic = await this.prisma.clinic.findUnique({
            where: { id: clinicId },
            select: {
                id: true,
                name: true,
                slug: true,
                timezone: true,
                whatsappConfig: {
                    select: {
                        phoneNumber: true,
                        isBotEnabled: true,
                        welcomeMessage: true,
                    },
                },
            },
        });

        if (!clinic) {
            return { success: false, message: 'Clínica no encontrada' };
        }

        return {
            success: true,
            clinic: {
                id: clinic.id,
                name: clinic.name,
                slug: clinic.slug,
                timezone: clinic.timezone,
            },
            whatsapp: clinic.whatsappConfig
                ? {
                    phoneNumber: clinic.whatsappConfig.phoneNumber,
                    isBotEnabled: clinic.whatsappConfig.isBotEnabled,
                    welcomeMessage: clinic.whatsappConfig.welcomeMessage,
                }
                : null,
        };
    }
}
