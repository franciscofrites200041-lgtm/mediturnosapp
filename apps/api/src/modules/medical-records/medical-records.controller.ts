import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MedicalRecordsService } from './medical-records.service';
import { CurrentClinic, CurrentUser } from '@/common/decorators/user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { UserRole } from '@prisma/client';

@ApiTags('medical-records')
@Controller('medical-records')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class MedicalRecordsController {
    constructor(private readonly medicalRecordsService: MedicalRecordsService) { }

    @Get('patient/:patientId')
    @Roles(UserRole.DOCTOR, UserRole.CLINIC_ADMIN)
    @ApiOperation({ summary: 'Historial clínico de un paciente' })
    findByPatient(@CurrentClinic() clinicId: string, @Param('patientId') patientId: string) {
        return this.medicalRecordsService.findByPatient(clinicId, patientId);
    }

    @Get(':id')
    @Roles(UserRole.DOCTOR, UserRole.CLINIC_ADMIN)
    @ApiOperation({ summary: 'Detalle de registro médico' })
    findOne(
        @CurrentClinic() clinicId: string,
        @Param('id') id: string,
        @CurrentUser('id') userId: string,
    ) {
        return this.medicalRecordsService.findOne(clinicId, id, userId);
    }

    @Post()
    @Roles(UserRole.DOCTOR)
    @ApiOperation({ summary: 'Crear registro médico' })
    create(
        @CurrentClinic() clinicId: string,
        @CurrentUser('id') doctorId: string,
        @Body() data: any,
    ) {
        return this.medicalRecordsService.create(clinicId, doctorId, data);
    }

    @Patch(':id')
    @Roles(UserRole.DOCTOR)
    @ApiOperation({ summary: 'Actualizar registro médico (borrador)' })
    update(
        @CurrentClinic() clinicId: string,
        @Param('id') id: string,
        @CurrentUser('id') doctorId: string,
        @Body() data: any,
    ) {
        return this.medicalRecordsService.update(clinicId, id, doctorId, data);
    }

    @Post(':id/complete')
    @Roles(UserRole.DOCTOR)
    @ApiOperation({ summary: 'Finalizar consulta' })
    complete(
        @CurrentClinic() clinicId: string,
        @Param('id') id: string,
        @CurrentUser('id') doctorId: string,
        @Body() data: any,
    ) {
        return this.medicalRecordsService.completeConsultation(clinicId, id, doctorId, data);
    }
}
