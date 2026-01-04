import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class SchedulesService {
    constructor(private prisma: PrismaService) { }

    async findByDoctor(clinicId: string, doctorId: string) {
        return this.prisma.doctorSchedule.findMany({
            where: { clinicId, doctorId },
            orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        });
    }

    async create(
        clinicId: string,
        doctorId: string,
        data: {
            dayOfWeek: number;
            startTime: string;
            endTime: string;
            slotDuration?: number;
            maxPatients?: number;
        },
    ) {
        return this.prisma.doctorSchedule.create({
            data: {
                clinicId,
                doctorId,
                ...data,
            },
        });
    }

    async update(clinicId: string, id: string, data: any) {
        const schedule = await this.prisma.doctorSchedule.findFirst({
            where: { id, clinicId },
        });

        if (!schedule) throw new NotFoundException('Horario no encontrado');

        return this.prisma.doctorSchedule.update({
            where: { id },
            data,
        });
    }

    async delete(clinicId: string, id: string) {
        const schedule = await this.prisma.doctorSchedule.findFirst({
            where: { id, clinicId },
        });

        if (!schedule) throw new NotFoundException('Horario no encontrado');

        return this.prisma.doctorSchedule.delete({ where: { id } });
    }

    /** Bulk update doctor's schedule */
    async bulkUpdate(
        clinicId: string,
        doctorId: string,
        schedules: Array<{
            dayOfWeek: number;
            startTime: string;
            endTime: string;
            slotDuration?: number;
        }>,
    ) {
        // Delete existing schedules
        await this.prisma.doctorSchedule.deleteMany({
            where: { clinicId, doctorId },
        });

        // Create new ones
        await this.prisma.doctorSchedule.createMany({
            data: schedules.map((s) => ({
                clinicId,
                doctorId,
                ...s,
            })),
        });

        return this.findByDoctor(clinicId, doctorId);
    }
}
