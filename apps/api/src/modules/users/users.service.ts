import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { UserRole, Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { CreateUserDto } from './dto/create-user.dto';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findAll(clinicId: string, role?: UserRole) {
        const where: Prisma.UserWhereInput = { clinicId, isActive: true };
        if (role) where.role = role;

        return this.prisma.user.findMany({
            where,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                specialty: { select: { id: true, name: true } },
                isActive: true,
                createdAt: true,
            },
            orderBy: { lastName: 'asc' },
        });
    }

    async findOne(id: string, clinicId: string) {
        const user = await this.prisma.user.findFirst({
            where: { id, clinicId },
            include: { specialty: true },
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        const { passwordHash, refreshToken, resetToken, ...result } = user;
        return result;
    }

    async findDoctors(clinicId: string, areaId?: string) {
        return this.prisma.user.findMany({
            where: {
                clinicId,
                role: 'DOCTOR',
                isActive: true,
                specialtyId: areaId || undefined,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                specialty: { select: { id: true, name: true, color: true } },
            },
        });
    }

    async update(id: string, clinicId: string, data: Prisma.UserUpdateInput) {
        await this.findOne(id, clinicId);

        return this.prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
            },
        });
    }

    async deactivate(id: string, clinicId: string) {
        await this.findOne(id, clinicId);

        return this.prisma.user.update({
            where: { id },
            data: { isActive: false },
        });
    }
    async create(clinicId: string, data: CreateUserDto) {
        const existingUser = await this.prisma.user.findFirst({
            where: { email: data.email },
        });

        if (existingUser) {
            throw new BadRequestException('El email ya está registrado');
        }

        const passwordHash = await argon2.hash(data.password);

        return this.prisma.user.create({
            data: {
                email: data.email,
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                passwordHash,
                role: data.role,
                clinicId,
                specialtyId: data.role === 'DOCTOR' ? data.specialtyId : undefined,
                licenseNumber: data.role === 'DOCTOR' ? data.licenseNumber : undefined,
                emailVerified: true, // Auto-verify staff created by admin
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true,
            },
        });
    }

    async remove(id: string, clinicId: string) {
        await this.findOne(id, clinicId);
        // Soft delete
        return this.prisma.user.update({
            where: { id },
            data: { isActive: false },
        });
    }
}
