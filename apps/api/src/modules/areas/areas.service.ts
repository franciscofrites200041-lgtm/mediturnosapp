import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class AreasService {
    constructor(private prisma: PrismaService) { }

    async findAll(clinicId: string) {
        return this.prisma.area.findMany({
            where: { clinicId, isActive: true },
            include: {
                _count: { select: { doctors: true, appointments: true } },
            },
            orderBy: { name: 'asc' },
        });
    }

    async findOne(clinicId: string, id: string) {
        const area = await this.prisma.area.findFirst({
            where: { id, clinicId },
            include: {
                doctors: {
                    where: { isActive: true },
                    select: { id: true, firstName: true, lastName: true },
                },
            },
        });

        if (!area) throw new NotFoundException('Área no encontrada');
        return area;
    }

    async create(clinicId: string, data: { name: string; description?: string; color?: string; defaultDuration?: number }) {
        // Check for duplicate name
        const existing = await this.prisma.area.findFirst({
            where: { clinicId, name: data.name },
        });

        if (existing) {
            throw new BadRequestException('Ya existe un área con ese nombre');
        }

        return this.prisma.area.create({
            data: { ...data, clinicId },
        });
    }

    async update(clinicId: string, id: string, data: any) {
        await this.findOne(clinicId, id);
        return this.prisma.area.update({ where: { id }, data });
    }

    async delete(clinicId: string, id: string) {
        await this.findOne(clinicId, id);

        // Soft delete
        return this.prisma.area.update({
            where: { id },
            data: { isActive: false },
        });
    }
}
