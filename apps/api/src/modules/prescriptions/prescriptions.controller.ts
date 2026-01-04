import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PrescriptionsService } from './prescriptions.service';
import { CurrentClinic, CurrentUser } from '@/common/decorators/user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { UserRole } from '@prisma/client';

@ApiTags('prescriptions')
@Controller('prescriptions')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class PrescriptionsController {
    constructor(private readonly prescriptionsService: PrescriptionsService) { }

    @Get('patient/:patientId')
    @Roles(UserRole.DOCTOR, UserRole.CLINIC_ADMIN)
    @ApiOperation({ summary: 'Recetas de un paciente' })
    findByPatient(@CurrentClinic() clinicId: string, @Param('patientId') patientId: string) {
        return this.prescriptionsService.findByPatient(clinicId, patientId);
    }

    @Get(':id')
    @Roles(UserRole.DOCTOR, UserRole.CLINIC_ADMIN)
    @ApiOperation({ summary: 'Detalle de receta' })
    findOne(@CurrentClinic() clinicId: string, @Param('id') id: string) {
        return this.prescriptionsService.findOne(clinicId, id);
    }

    @Post()
    @Roles(UserRole.DOCTOR)
    @ApiOperation({ summary: 'Crear receta' })
    create(
        @CurrentClinic() clinicId: string,
        @CurrentUser('id') doctorId: string,
        @Body() data: any,
    ) {
        return this.prescriptionsService.create(clinicId, doctorId, data);
    }

    @Post(':id/send')
    @Roles(UserRole.DOCTOR)
    @ApiOperation({ summary: 'Firmar y enviar receta al paciente' })
    send(
        @CurrentClinic() clinicId: string,
        @Param('id') id: string,
        @CurrentUser('id') doctorId: string,
    ) {
        return this.prescriptionsService.sendPrescription(clinicId, id, doctorId);
    }
}
