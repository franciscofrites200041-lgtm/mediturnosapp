import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, PreApproval, Payment } from 'mercadopago';

@Injectable()
export class MercadoPagoService implements OnModuleInit {
    private readonly logger = new Logger(MercadoPagoService.name);
    private client: MercadoPagoConfig;
    private preApproval: PreApproval;
    private payment: Payment;

    constructor(private configService: ConfigService) { }

    onModuleInit() {
        const accessToken = this.configService.get<string>('MP_ACCESS_TOKEN');

        if (!accessToken) {
            this.logger.warn('MP_ACCESS_TOKEN not found. Mercado Pago integration disabled.');
            return;
        }

        this.client = new MercadoPagoConfig({
            accessToken: accessToken,
            options: { timeout: 5000 },
        });

        this.preApproval = new PreApproval(this.client);
        this.payment = new Payment(this.client);

        this.logger.log('Mercado Pago SDK initialized');
    }

    /**
     * Crea una suscripción recurrente (Preapproval)
     * @param data Datos para crear la suscripción
     */
    async createSubscription(data: {
        reason: string;
        payerLimit: number; // 0 para infinito
        autoRecurring: {
            frequency: number;
            frequencyType: 'months';
            transactionAmount: number;
            currencyId: 'ARS';
        };
        backUrl: string;
        payerEmail: string;
        externalReference: string; // ID de la clínica
    }) {
        if (!this.client) throw new Error('Mercado Pago not configured');

        try {
            const response = await this.preApproval.create({
                body: {
                    reason: data.reason,
                    external_reference: data.externalReference,
                    payer_email: data.payerEmail,
                    auto_recurring: {
                        frequency: data.autoRecurring.frequency,
                        frequency_type: data.autoRecurring.frequencyType,
                        transaction_amount: data.autoRecurring.transactionAmount,
                        currency_id: data.autoRecurring.currencyId,
                    },
                    back_url: data.backUrl,
                    status: 'pending',
                },
            });

            return response;
        } catch (error) {
            this.logger.error('Error creating MP subscription', error);
            throw error;
        }
    }

    /**
     * Obtiene una suscripción por ID
     */
    async getSubscription(id: string) {
        if (!this.client) throw new Error('Mercado Pago not configured');
        return this.preApproval.get({ id });
    }

    /**
     * Cancela una suscripción
     */
    async cancelSubscription(id: string) {
        if (!this.client) throw new Error('Mercado Pago not configured');
        return this.preApproval.update({
            id,
            body: { status: 'cancelled' },
        });
    }

    /**
     * Pausa una suscripción
     */
    async pauseSubscription(id: string) {
        if (!this.client) throw new Error('Mercado Pago not configured');
        return this.preApproval.update({
            id,
            body: { status: 'paused' },
        });
    }

    /**
     * Reactiva una suscripción
     */
    async activateSubscription(id: string) {
        if (!this.client) throw new Error('Mercado Pago not configured');
        return this.preApproval.update({
            id,
            body: { status: 'authorized' },
        }); // 'authorized' mean active in MP
    }
}
