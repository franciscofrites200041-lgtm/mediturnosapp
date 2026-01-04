import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ClinicsService {
    constructor(private prisma: PrismaService) { }

    /** Super Admin: List all clinics */
    async findAll() {
        return this.prisma.clinic.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
                email: true,
                subscriptionStatus: true,
                subscriptionPlan: true,
                isActive: true,
                createdAt: true,
                _count: { select: { users: true, patients: true, appointments: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /** Super Admin: Get clinic detail */
    async findOne(id: string) {
        const clinic = await this.prisma.clinic.findUnique({
            where: { id },
            include: {
                _count: { select: { users: true, patients: true, appointments: true } },
            },
        });

        if (!clinic) throw new NotFoundException('Clínica no encontrada');
        return clinic;
    }

    /** Super Admin: Create new clinic */
    async create(data: {
        name: string;
        slug: string;
        email: string;
        phone?: string;
        subscriptionPlan?: any;
    }) {
        // Generate API key for n8n integration
        const apiKey = `mt_${uuidv4().replace(/-/g, '')}`;

        return this.prisma.clinic.create({
            data: {
                ...data,
                apiKey,
                trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
            },
        });
    }

    /** Super Admin: Update clinic subscription */
    async updateSubscription(id: string, status: any, plan?: any) {
        return this.prisma.clinic.update({
            where: { id },
            data: {
                subscriptionStatus: status,
                subscriptionPlan: plan,
                subscriptionEndsAt: status === 'ACTIVE'
                    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    : undefined,
            },
        });
    }

    /** Super Admin: Deactivate clinic */
    async deactivate(id: string) {
        return this.prisma.clinic.update({
            where: { id },
            data: { isActive: false, subscriptionStatus: 'SUSPENDED' },
        });
    }

    /** Regenerate API Key */
    async regenerateApiKey(id: string) {
        const newApiKey = `mt_${uuidv4().replace(/-/g, '')}`;

        return this.prisma.clinic.update({
            where: { id },
            data: {
                apiKey: newApiKey,
                apiKeyExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
            },
            select: { apiKey: true },
        });
    }

    /** Update webhook URL */
    async updateWebhook(id: string, webhookUrl: string, webhookSecret: string) {
        return this.prisma.clinic.update({
            where: { id },
            data: { webhookUrl, webhookSecret },
        });
    }
}
