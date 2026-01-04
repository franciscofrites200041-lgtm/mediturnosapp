import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/common/prisma/prisma.service';
import { MercadoPagoService } from './mercado-pago.service';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

export const PLANS = {
    BASIC: {
        id: SubscriptionPlan.BASIC,
        name: 'Plan Básico (Hasta 3 médicos)',
        price: 15000,
        currency: 'ARS' as const,
        description: 'Ideal para consultorios pequeños',
    },
    PROFESSIONAL: {
        id: SubscriptionPlan.PROFESSIONAL,
        name: 'Plan Profesional (Hasta 10 médicos + WhatsApp)',
        price: 35000,
        currency: 'ARS' as const,
        description: 'Para clínicas en crecimiento',
    },
    ENTERPRISE: {
        id: SubscriptionPlan.ENTERPRISE,
        name: 'Plan Empresarial (Ilimitado + Full WhatsApp)',
        price: 75000,
        currency: 'ARS' as const,
        description: 'Solución completa sin límites',
    },
};

@Injectable()
export class BillingService {
    private readonly logger = new Logger(BillingService.name);

    constructor(
        private prisma: PrismaService,
        private mpService: MercadoPagoService,
        private configService: ConfigService,
    ) { }

    async getPlans() {
        return Object.values(PLANS);
    }

    async createSubscriptionLink(clinicId: string, planId: SubscriptionPlan, userEmail: string) {
        const clinic = await this.prisma.clinic.findUnique({
            where: { id: clinicId },
        });

        if (!clinic) throw new NotFoundException('Clínica no encontrada');

        const plan = PLANS[planId];
        if (!plan) throw new BadRequestException('Plan inválido');

        // Check if there is already an active subscription
        const activeSub = await this.prisma.subscription.findFirst({
            where: {
                clinicId,
                isActive: true,
                mpStatus: { in: ['authorized', 'pending'] },
            },
        });

        if (activeSub) {
            // In a real app we might want to allow upgrades via a different flow
            // but for now, we block creating a new one if one exists
            // Or maybe we just return the existing link if it's pending?
        }

        // TODO: In production, use the real domain. MP requires HTTPS.
        // For local development, we use a placeholder to pass validation.
        const backUrl = "https://google.com"; // `${this.configService.get('FRONTEND_URL')}/dashboard/settings?tab=billing&status=success`;

        try {
            const mpSubscription = await this.mpService.createSubscription({
                reason: `Suscripción MediTurnos - ${plan.name}`,
                payerLimit: 0, // Infinite occurrences
                autoRecurring: {
                    frequency: 1,
                    frequencyType: 'months',
                    transactionAmount: plan.price,
                    currencyId: 'ARS',
                },
                backUrl,
                payerEmail: userEmail,
                externalReference: clinicId, // We link the subscription to the clinic ID
            });

            // Create pending subscription record in DB
            await this.prisma.subscription.create({
                data: {
                    clinicId,
                    mpPreapprovalId: mpSubscription.id,
                    plan: planId,
                    price: plan.price,
                    currency: plan.currency,
                    mpStatus: mpSubscription.status,
                    mpPayerEmail: userEmail,
                    isActive: false, // Will be activated via webhook
                },
            });

            return {
                initPoint: mpSubscription.init_point, // The URL to redirect the user to
                preapprovalId: mpSubscription.id,
            };
        } catch (error) {
            this.logger.error('Failed to create subscription link', error);
            throw new BadRequestException('Error al crear la suscripción en Mercado Pago');
        }
    }

    // Handles webhook notifications from Mercado Pago
    async handleWebhook(body: any) {
        // We are interested in 'subscription_preapproval' and 'payment' events
        // Note: MP webhooks can be tricky, often we just get an ID and "topic"

        const { type, data } = body;
        this.logger.log(`Received webhook: ${type} - ID: ${data?.id}`);

        if (type === 'subscription_preapproval') {
            await this.syncSubscriptionStatus(data.id);
        } else if (type === 'payment') {
            // Payment created/updated
            // Usually we don't strictly need this to activate functionality if relying on subscription status
            // but it's good for records
        }

        return { status: 'ok' };
    }

    async syncSubscriptionStatus(preapprovalId: string) {
        try {
            const mpSub = await this.mpService.getSubscription(preapprovalId);

            const subscription = await this.prisma.subscription.findUnique({
                where: { mpPreapprovalId: preapprovalId },
                include: { clinic: true },
            });

            if (!subscription) {
                this.logger.warn(`Subscription ${preapprovalId} not found in DB`);
                return;
            }

            // Map MP status to our internal status
            const status = mpSub.status; // authorized, paused, cancelled
            const isActive = status === 'authorized';

            await this.prisma.$transaction(async (tx) => {
                // Update subscription record
                await tx.subscription.update({
                    where: { id: subscription.id },
                    data: {
                        mpStatus: status,
                        isActive,
                        // Update billing dates if available
                        nextPaymentDate: mpSub.next_payment_date ? new Date(mpSub.next_payment_date) : undefined,
                        cancelledAt: status === 'cancelled' && !subscription.cancelledAt ? new Date() : undefined,
                    },
                });

                // Update clinic status
                let clinicStatus: SubscriptionStatus = subscription.clinic.subscriptionStatus;

                if (status === 'authorized') {
                    clinicStatus = SubscriptionStatus.ACTIVE;
                } else if (status === 'paused') {
                    clinicStatus = SubscriptionStatus.SUSPENDED;
                } else if (status === 'cancelled') {
                    clinicStatus = SubscriptionStatus.CANCELLED;
                }

                // If clinic was in trial and now paid, we update
                if (subscription.clinic.subscriptionStatus === SubscriptionStatus.TRIAL && isActive) {
                    clinicStatus = SubscriptionStatus.ACTIVE;
                }

                await tx.clinic.update({
                    where: { id: subscription.clinicId },
                    data: {
                        subscriptionStatus: clinicStatus,
                        subscriptionPlan: subscription.plan,
                    },
                });
            });

            this.logger.log(`Synced subscription ${preapprovalId} - Status: ${status}`);

        } catch (error) {
            this.logger.error(`Error syncing subscription ${preapprovalId}`, error);
        }
    }

    async getClinicSubscription(clinicId: string) {
        const sub = await this.prisma.subscription.findFirst({
            where: { clinicId },
            orderBy: { createdAt: 'desc' },
        });

        const clinic = await this.prisma.clinic.findUnique({
            where: { id: clinicId },
            select: { subscriptionStatus: true, subscriptionPlan: true, trialEndsAt: true }
        });

        return {
            subscription: sub,
            status: clinic?.subscriptionStatus,
            plan: clinic?.subscriptionPlan,
            trialEndsAt: clinic?.trialEndsAt,
        };
    }
}
