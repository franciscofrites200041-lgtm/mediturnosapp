import { Controller, Get, Post, Patch, Body, Query, Res, HttpStatus, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { WhatsAppService } from './whatsapp.service';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { CurrentUser, CurrentClinic } from '@/common/decorators/user.decorator';
import { SendMessageDto } from './dto/send-message.dto';
import { UserRole } from '@prisma/client';

@ApiTags('whatsapp')
@Controller('whatsapp')
export class WhatsAppController {
    constructor(private readonly whatsappService: WhatsAppService) { }

    // Public Webhook Verification (for Meta)
    @Get('webhook')
    @ApiOperation({ summary: 'Webhook verification challenge from Meta' })
    verifyWebhook(@Query() query: any, @Res() res: any) {
        const mode = query['hub.mode'];
        const token = query['hub.verify_token'];
        const challenge = query['hub.challenge'];

        if (mode && token) {
            try {
                const response = this.whatsappService.verifyWebhook(mode, token, challenge);
                return res.status(HttpStatus.OK).send(response);
            } catch (error) {
                return res.status(HttpStatus.FORBIDDEN).send();
            }
        }
        return res.status(HttpStatus.BAD_REQUEST).send();
    }

    // Public Webhook Event Receiver (for Meta)
    @Post('webhook')
    @ApiOperation({ summary: 'Receive webhook events from Meta' })
    async handleWebhook(@Body() body: any) {
        await this.whatsappService.handleWebhook(body);
        return { status: 'ok' };
    }

    // Protected: Send Message
    @Post('send')
    @UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
    @ApiBearerAuth()
    @Roles(UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.SECRETARY)
    @ApiOperation({ summary: 'Send a WhatsApp message' })
    async sendMessage(
        @CurrentClinic() clinicId: string,
        @Body() data: SendMessageDto,
    ) {
        return this.whatsappService.sendMessage(clinicId, data);
    }

    // Protected: Configure WhatsApp API credentials
    @Post('config')
    @UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
    @ApiBearerAuth()
    @Roles(UserRole.CLINIC_ADMIN)
    @ApiOperation({ summary: 'Update WhatsApp API configuration (Meta Cloud API credentials)' })
    async configure(
        @CurrentClinic() clinicId: string,
        @Body() config: { phoneNumberId: string; wabaId: string; accessToken: string; phoneNumber: string },
    ) {
        return this.whatsappService.updateConfig(clinicId, config);
    }

    // Protected: Get Config
    @Get('config')
    @UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
    @ApiBearerAuth()
    @Roles(UserRole.CLINIC_ADMIN)
    @ApiOperation({ summary: 'Get WhatsApp API configuration' })
    async getConfig(@CurrentClinic() clinicId: string) {
        return this.whatsappService.getConfig(clinicId);
    }

    // Protected: Update Bot Settings (welcome message, enable/disable)
    @Patch('bot-settings')
    @UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
    @ApiBearerAuth()
    @Roles(UserRole.CLINIC_ADMIN)
    @ApiOperation({ summary: 'Update WhatsApp bot settings (welcome message, enable/disable)' })
    async updateBotSettings(
        @CurrentClinic() clinicId: string,
        @Body() settings: { welcomeMessage?: string; isBotEnabled?: boolean },
    ) {
        return this.whatsappService.updateBotSettings(clinicId, settings);
    }

    // =====================================================
    // INBOX ENDPOINTS - For secretary/admin to handle conversations
    // =====================================================

    // Get all conversations (with filters)
    @Get('inbox')
    @UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
    @ApiBearerAuth()
    @Roles(UserRole.CLINIC_ADMIN, UserRole.SECRETARY)
    @ApiOperation({ summary: 'Get WhatsApp inbox - conversations needing attention' })
    async getInbox(
        @CurrentClinic() clinicId: string,
        @Query('status') status?: string,
        @Query('needsHuman') needsHuman?: string,
    ) {
        return this.whatsappService.getConversations(clinicId, {
            status: status as any,
            needsHumanAttention: needsHuman === 'true',
        });
    }

    // Get single conversation with messages
    @Get('inbox/:conversationId')
    @UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
    @ApiBearerAuth()
    @Roles(UserRole.CLINIC_ADMIN, UserRole.SECRETARY)
    @ApiOperation({ summary: 'Get conversation with messages' })
    async getConversation(
        @CurrentClinic() clinicId: string,
        @Param('conversationId') conversationId: string,
    ) {
        return this.whatsappService.getConversationWithMessages(clinicId, conversationId);
    }

    // Assign conversation to current user (take over)
    @Post('inbox/:conversationId/assign')
    @UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
    @ApiBearerAuth()
    @Roles(UserRole.CLINIC_ADMIN, UserRole.SECRETARY)
    @ApiOperation({ summary: 'Assign conversation to yourself' })
    async assignConversation(
        @CurrentClinic() clinicId: string,
        @CurrentUser('sub') userId: string,
        @Param('conversationId') conversationId: string,
    ) {
        return this.whatsappService.assignConversation(clinicId, conversationId, userId);
    }

    // Send reply to conversation
    @Post('inbox/:conversationId/reply')
    @UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
    @ApiBearerAuth()
    @Roles(UserRole.CLINIC_ADMIN, UserRole.SECRETARY)
    @ApiOperation({ summary: 'Send reply to a conversation' })
    async replyToConversation(
        @CurrentClinic() clinicId: string,
        @Param('conversationId') conversationId: string,
        @Body() body: { message: string },
    ) {
        return this.whatsappService.replyToConversation(clinicId, conversationId, body.message);
    }

    // Close conversation
    @Post('inbox/:conversationId/close')
    @UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
    @ApiBearerAuth()
    @Roles(UserRole.CLINIC_ADMIN, UserRole.SECRETARY)
    @ApiOperation({ summary: 'Close a conversation' })
    async closeConversation(
        @CurrentClinic() clinicId: string,
        @Param('conversationId') conversationId: string,
    ) {
        return this.whatsappService.closeConversation(clinicId, conversationId);
    }
}
