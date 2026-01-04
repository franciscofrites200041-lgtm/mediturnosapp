import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SubscriptionPlan } from '@prisma/client';
import { BillingService } from './billing.service';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/user.decorator';

@ApiTags('billing')
@Controller('billing')
export class BillingController {
    constructor(private readonly billingService: BillingService) { }

    @Get('plans')
    @ApiOperation({ summary: 'Obtener planes de suscripción disponibles' })
    getPlans() {
        return this.billingService.getPlans();
    }

    @Get('current')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Obtener estado de suscripción actual de la clínica' })
    async getCurrentSubscription(@CurrentUser('clinicId') clinicId: string) {
        return this.billingService.getClinicSubscription(clinicId);
    }

    @Post('subscribe')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @Roles('CLINIC_ADMIN', 'SUPER_ADMIN')
    @ApiOperation({ summary: 'Crear preferencia de suscripción (checkout link)' })
    async createSubscription(
        @CurrentUser('clinicId') clinicId: string,
        @CurrentUser('email') email: string,
        @Body('plan') plan: SubscriptionPlan,
    ) {
        return this.billingService.createSubscriptionLink(clinicId, plan, email);
    }

    @Post('webhook')
    @ApiOperation({ summary: 'Webhook para Mercado Pago' })
    async handleWebhook(@Body() body: any) {
        return this.billingService.handleWebhook(body);
    }
}
