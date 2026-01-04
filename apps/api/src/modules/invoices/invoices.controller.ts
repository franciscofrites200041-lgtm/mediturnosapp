import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { CurrentClinic } from '@/common/decorators/user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('invoices')
@Controller('invoices')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class InvoicesController {
    constructor(private readonly invoicesService: InvoicesService) { }

    @Get()
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Listar todas las facturas (Super Admin)' })
    findAll(@Query('status') status?: string) {
        return this.invoicesService.findAll(status);
    }

    @Get('my-clinic')
    @Roles(UserRole.CLINIC_ADMIN)
    @ApiOperation({ summary: 'Facturas de mi clínica' })
    findMyClinic(@CurrentClinic() clinicId: string) {
        return this.invoicesService.findByClinic(clinicId);
    }

    @Patch(':id/paid')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Marcar factura como pagada' })
    markAsPaid(@Param('id') id: string, @Body() data: { paymentMethod: string; paymentRef: string }) {
        return this.invoicesService.markAsPaid(id, data.paymentMethod, data.paymentRef);
    }
}
