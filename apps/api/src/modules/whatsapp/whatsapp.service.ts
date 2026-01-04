
import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '@/common/prisma/prisma.service';
import axios from 'axios';
import { lastValueFrom } from 'rxjs';
import { SendMessageDto, WhatsAppMessageType } from './dto/send-message.dto';

@Injectable()
export class WhatsAppService {
    private readonly logger = new Logger(WhatsAppService.name);
    private readonly GRAPH_API_URL = 'https://graph.facebook.com/v18.0';

    constructor(
        private prisma: PrismaService,
        private httpService: HttpService,
        private configService: ConfigService,
    ) { }

    /**
     * Send a WhatsApp message using a specific clinic's configuration
     */
    async sendMessage(clinicId: string, data: SendMessageDto) {
        // 1. Get Clinic Config
        const config = await this.prisma.whatsAppConfig.findUnique({
            where: { clinicId },
        });

        if (!config) {
            throw new BadRequestException('WhatsApp not configured for this clinic');
        }

        // 2. Send request to Meta
        try {
            const url = `${this.GRAPH_API_URL} /${config.phoneNumberId}/messages`;
            const payload = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: data.to,
                type: data.type,
                text: data.text,
                template: data.template,
            };

            const response = await lastValueFrom(
                this.httpService.post(url, payload, {
                    headers: {
                        Authorization: `Bearer ${config.accessToken} `,
                        'Content-Type': 'application/json',
                    },
                })
            );

            // 3. Log outgoing message in DB
            await this.logMessage(clinicId, config.id, data.to, 'OUTBOUND', data.type.toUpperCase() as any, data.text?.body || 'TEMPLATE', response.data.messages?.[0]?.id);

            return response.data;
        } catch (error: any) {
            this.logger.error(`Error sending WhatsApp message: ${error.response?.data?.error?.message || error.message} `);
            throw new BadRequestException(`Failed to send message: ${error.response?.data?.error?.message || error.message} `);
        }
    }

    /**
     * Send a template message (Shortcut)
     */
    async sendTemplate(clinicId: string, to: string, templateName: string, languageCode = 'es_AR', components: any[] = []) {
        return this.sendMessage(clinicId, {
            to,
            type: WhatsAppMessageType.TEMPLATE,
            template: {
                name: templateName,
                language: { code: languageCode },
                components,
            },
        });
    }

    /**
     * Verify Webhook Token (GET request from Meta)
     */
    verifyWebhook(mode: string, token: string, challenge: string): string {
        const verifyToken = this.configService.get('WHATSAPP_VERIFY_TOKEN') || 'mediturnos_verify_token';

        if (mode === 'subscribe' && token === verifyToken) {
            return challenge;
        }

        throw new BadRequestException('Invalid verification token');
    }

    /**
     * Handle incoming webhook events (POST request from Meta)
     */
    async handleWebhook(body: any) {
        // Meta sends a batch of entries
        for (const entry of body.entry || []) {
            for (const change of entry.changes || []) {
                if (change.value && change.value.messages) {
                    await this.processMessages(change.value);
                } else if (change.value && change.value.statuses) {
                    await this.processStatuses(change.value);
                }
            }
        }
    }

    private async processMessages(value: any) {
        const phoneNumberId = value.metadata.phone_number_id; // Identity of the clinic's number

        // Find which clinic owns this phone number
        const config = await this.prisma.whatsAppConfig.findUnique({
            where: { phoneNumberId },
            include: { clinic: true },
        });

        if (!config) {
            this.logger.warn(`Received message for unknown phone number ID: ${phoneNumberId} `);
            return;
        }

        for (const message of value.messages || []) {
            const from = message.from; // Sender phone number
            const type = message.type;
            const wamid = message.id;

            // Extract body based on type
            let body = '';
            if (type === 'text') body = message.text.body;
            else if (type === 'button') body = message.button.text;
            else body = `[Media: ${type}]`;

            // Log INBOUND message
            await this.logMessage(config.clinicId, config.id, from, 'INBOUND', type.toUpperCase() as any, body, wamid, message.timestamp);
        }
    }

    private async processStatuses(value: any) {
        // Handle message status updates (sent, delivered, read)
        for (const status of value.statuses || []) {
            const wamid = status.id;
            const statusState = status.status; // sent, delivered, read, failed

            await this.prisma.whatsAppMessage.updateMany({
                where: { wamid },
                data: { status: statusState.toUpperCase() as any },
            });
        }
    }

    /**
     * Log message to database (both inbound and outbound)
     * Handles creating/updating conversation and linking to patient if possible
     */
    private async logMessage(
        clinicId: string,
        waConfigId: string,
        contactPhone: string,
        direction: 'INBOUND' | 'OUTBOUND',
        type: 'TEXT' | 'TEMPLATE' | 'IMAGE',
        body: string,
        wamid?: string,
        timestamp?: string
    ) {
        // 1. Find or Create Conversation
        let conversation = await this.prisma.whatsAppConversation.findUnique({
            where: {
                waConfigId_contactPhone: { waConfigId, contactPhone },
            },
        });

        if (!conversation) {
            // Try to link to a patient
            const patient = await this.prisma.patient.findFirst({
                where: { clinicId, phone: { contains: contactPhone.slice(-8) } } // Simple fuzzy match on last 8 digits
            });

            conversation = await this.prisma.whatsAppConversation.create({
                data: {
                    clinicId,
                    waConfigId,
                    contactPhone,
                    patientId: patient?.id,
                },
            });
        }

        // 2. Create Message
        await this.prisma.whatsAppMessage.create({
            data: {
                conversationId: conversation.id,
                direction,
                type: type as any, // Cast to enum
                body,
                wamid,
                status: direction === 'INBOUND' ? 'READ' : 'SENT', // Inbound messages are treated as read/delivered instantly by us
                createdAt: timestamp ? new Date(parseInt(timestamp) * 1000) : new Date(),
            },
        });

        // 3. Update conversation timestamp
        await this.prisma.whatsAppConversation.update({
            where: { id: conversation.id },
            data: { lastMessageAt: new Date() },
        });
    }

    /**
     * Update WhatsApp Configuration for a clinic
     */
    async updateConfig(clinicId: string, data: { phoneNumberId: string; wabaId: string; accessToken: string; phoneNumber: string }) {
        // 1. Intentar suscribir nuestra App a los webhooks de la WABA del cliente
        // Esto evita tener que configurar manualmente los webhooks en el panel de Meta del cliente.
        try {
            await axios.post(
                `https://graph.facebook.com/v21.0/${data.wabaId}/subscribed_apps`,
                {
                    override_callback_uri: this.configService.get('WHATSAPP_WEBHOOK_URL'), // Opcional: Si quieres forzar tu URL
                    verify_token: this.configService.get('WHATSAPP_VERIFY_TOKEN') || 'mediturnos_verify_token'
                },
                {
                    headers: { Authorization: `Bearer ${data.accessToken}` }
                }
            );
            this.logger.log(`App subscribed to WABA ${data.wabaId} successfully`);
        } catch (error) {
            this.logger.error('Failed to subscribe app to WABA', error.response?.data || error.message);
            // No bloqueamos el guardado, pero avisamos.
            // O podemos lanzar error si queremos ser estrictos.
            // throw new BadRequestException('Credenciales inválidas o falta de permisos para suscribir webhooks.');
        }

        return this.prisma.whatsAppConfig.upsert({
            where: { clinicId },
            create: {
                clinicId,
                ...data,
            },
            update: data,
        });
    }

    /**
     * Get WhatsApp Configuration for a clinic
     */
    async getConfig(clinicId: string) {
        return this.prisma.whatsAppConfig.findUnique({
            where: { clinicId },
        });
    }

    /**
     * Update Bot Settings (welcome message, enable/disable)
     * This is for clinic admins to customize their bot behavior
     */
    async updateBotSettings(clinicId: string, settings: { welcomeMessage?: string; isBotEnabled?: boolean }) {
        const existing = await this.prisma.whatsAppConfig.findUnique({
            where: { clinicId },
        });

        if (!existing) {
            throw new NotFoundException('WhatsApp configuration not found. Please configure WhatsApp API credentials first.');
        }

        const updated = await this.prisma.whatsAppConfig.update({
            where: { clinicId },
            data: {
                ...(settings.welcomeMessage !== undefined && { welcomeMessage: settings.welcomeMessage }),
                ...(settings.isBotEnabled !== undefined && { isBotEnabled: settings.isBotEnabled }),
            },
        });

        return {
            success: true,
            message: 'Bot settings updated successfully',
            config: {
                isBotEnabled: updated.isBotEnabled,
                welcomeMessage: updated.welcomeMessage,
            },
        };
    }

    // =====================================================
    // INBOX METHODS - For human handoff feature
    // =====================================================

    /**
     * Get conversations for inbox view
     */
    async getConversations(clinicId: string, filters?: { status?: string; needsHumanAttention?: boolean }) {
        const where: any = { clinicId };

        if (filters?.status) {
            where.status = filters.status;
        }

        if (filters?.needsHumanAttention) {
            where.needsHumanAttention = true;
        }

        const conversations = await this.prisma.whatsAppConversation.findMany({
            where,
            include: {
                patient: {
                    select: { id: true, firstName: true, lastName: true },
                },
                assignedToUser: {
                    select: { id: true, firstName: true, lastName: true },
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1, // Only last message for preview
                },
            },
            orderBy: [
                { needsHumanAttention: 'desc' }, // Prioritize those needing attention
                { lastMessageAt: 'desc' },
            ],
        });

        return conversations.map(conv => ({
            id: conv.id,
            contactPhone: conv.contactPhone,
            contactName: conv.contactName,
            patient: conv.patient,
            status: conv.status,
            needsHumanAttention: conv.needsHumanAttention,
            humanRequestedAt: conv.humanRequestedAt,
            assignedTo: conv.assignedToUser,
            lastMessage: conv.messages[0] || null,
            lastMessageAt: conv.lastMessageAt,
        }));
    }

    /**
     * Get single conversation with all messages
     */
    async getConversationWithMessages(clinicId: string, conversationId: string) {
        const conversation = await this.prisma.whatsAppConversation.findFirst({
            where: { id: conversationId, clinicId },
            include: {
                patient: true,
                assignedToUser: {
                    select: { id: true, firstName: true, lastName: true },
                },
                messages: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        if (!conversation) {
            throw new NotFoundException('Conversación no encontrada');
        }

        return conversation;
    }

    /**
     * Assign conversation to a user (take over from bot)
     */
    async assignConversation(clinicId: string, conversationId: string, userId: string) {
        const conversation = await this.prisma.whatsAppConversation.findFirst({
            where: { id: conversationId, clinicId },
        });

        if (!conversation) {
            throw new NotFoundException('Conversación no encontrada');
        }

        const updated = await this.prisma.whatsAppConversation.update({
            where: { id: conversationId },
            data: {
                assignedToUserId: userId,
                assignedAt: new Date(),
                status: 'HUMAN_HANDLING',
                needsHumanAttention: false, // Already being handled
            },
            include: {
                assignedToUser: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
        });

        return {
            success: true,
            message: 'Conversación asignada',
            conversation: updated,
        };
    }

    /**
     * Reply to a conversation (human sends message)
     */
    async replyToConversation(clinicId: string, conversationId: string, messageText: string) {
        const conversation = await this.prisma.whatsAppConversation.findFirst({
            where: { id: conversationId, clinicId },
            include: { waConfig: true },
        });

        if (!conversation) {
            throw new NotFoundException('Conversación no encontrada');
        }

        // Send via WhatsApp
        await this.sendMessage(clinicId, {
            to: conversation.contactPhone,
            type: 'text' as any,
            text: { body: messageText },
        });

        return {
            success: true,
            message: 'Mensaje enviado',
        };
    }

    /**
     * Close a conversation
     */
    async closeConversation(clinicId: string, conversationId: string) {
        const conversation = await this.prisma.whatsAppConversation.findFirst({
            where: { id: conversationId, clinicId },
        });

        if (!conversation) {
            throw new NotFoundException('Conversación no encontrada');
        }

        await this.prisma.whatsAppConversation.update({
            where: { id: conversationId },
            data: {
                status: 'CLOSED',
                closedAt: new Date(),
                needsHumanAttention: false,
            },
        });

        return {
            success: true,
            message: 'Conversación cerrada',
        };
    }
}
