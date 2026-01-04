import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { PrismaService } from '@/common/prisma/prisma.service';

// Plans that include WhatsApp bot access
const WHATSAPP_ENABLED_PLANS = ['PROFESSIONAL', 'ENTERPRISE'];

/**
 * API Key strategy for n8n integration
 * Validates requests using X-API-Key header
 * Also checks if the clinic's plan includes WhatsApp access
 */
@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
    constructor(private prisma: PrismaService) {
        super();
    }

    async validate(req: Request): Promise<any> {
        const apiKey = req.headers['x-api-key'] as string;

        if (!apiKey) {
            throw new UnauthorizedException('API Key no proporcionada');
        }

        // Find clinic by API key with WhatsApp config
        const clinic = await this.prisma.clinic.findUnique({
            where: { apiKey },
            select: {
                id: true,
                name: true,
                slug: true,
                isActive: true,
                subscriptionStatus: true,
                subscriptionPlan: true,
                apiKeyExpiresAt: true,
                whatsappConfig: {
                    select: {
                        isBotEnabled: true,
                        phoneNumber: true,
                    },
                },
            },
        });

        if (!clinic) {
            throw new UnauthorizedException('API Key inválida');
        }

        if (!clinic.isActive) {
            throw new UnauthorizedException('Clínica desactivada');
        }

        if (clinic.subscriptionStatus === 'CANCELLED' || clinic.subscriptionStatus === 'SUSPENDED') {
            throw new UnauthorizedException('Suscripción inactiva');
        }

        if (clinic.apiKeyExpiresAt && clinic.apiKeyExpiresAt < new Date()) {
            throw new UnauthorizedException('API Key expirada');
        }

        // Check if subscription plan includes WhatsApp
        if (!WHATSAPP_ENABLED_PLANS.includes(clinic.subscriptionPlan)) {
            throw new ForbiddenException(
                'Tu plan actual no incluye acceso al bot de WhatsApp. Actualiza a Professional o Enterprise.'
            );
        }

        // Check if WhatsApp is configured and enabled
        if (!clinic.whatsappConfig) {
            throw new ForbiddenException(
                'WhatsApp no está configurado para esta clínica. Configúralo desde el panel de administración.'
            );
        }

        if (!clinic.whatsappConfig.isBotEnabled) {
            throw new ForbiddenException('El bot de WhatsApp está desactivado para esta clínica.');
        }

        // Return clinic context for multi-tenant queries
        return {
            type: 'api-key',
            clinicId: clinic.id,
            clinicName: clinic.name,
            whatsappNumber: clinic.whatsappConfig.phoneNumber,
        };
    }
}
