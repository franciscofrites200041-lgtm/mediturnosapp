import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ClinicsService } from './clinics.service';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('clinics')
@Controller('clinics')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class ClinicsController {
    constructor(private readonly clinicsService: ClinicsService) { }

    @Get()
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Listar todas las clínicas (Super Admin)' })
    findAll() {
        return this.clinicsService.findAll();
    }

    @Get(':id')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Detalle de clínica (Super Admin)' })
    findOne(@Param('id') id: string) {
        return this.clinicsService.findOne(id);
    }

    @Post()
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Crear nueva clínica (Super Admin)' })
    create(@Body() data: { name: string; slug: string; email: string }) {
        return this.clinicsService.create(data);
    }

    @Patch(':id/subscription')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Actualizar suscripción (Super Admin)' })
    updateSubscription(
        @Param('id') id: string,
        @Body() data: { status: any; plan?: any },
    ) {
        return this.clinicsService.updateSubscription(id, data.status, data.plan);
    }

    @Patch(':id/deactivate')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Desactivar clínica (Super Admin)' })
    deactivate(@Param('id') id: string) {
        return this.clinicsService.deactivate(id);
    }

    @Post(':id/api-key')
    @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN)
    @ApiOperation({ summary: 'Regenerar API Key' })
    regenerateApiKey(@Param('id') id: string) {
        return this.clinicsService.regenerateApiKey(id);
    }
}
