import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { CurrentClinic, CurrentUser } from '@/common/decorators/user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { UserRole } from '@prisma/client';

@ApiTags('patients')
@Controller('patients')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class PatientsController {
    constructor(private readonly patientsService: PatientsService) { }

    @Get()
    @Roles(UserRole.CLINIC_ADMIN, UserRole.SECRETARY, UserRole.DOCTOR)
    @ApiOperation({ summary: 'Listar pacientes' })
    findAll(@CurrentClinic() clinicId: string, @Query('search') search?: string) {
        return this.patientsService.findAll(clinicId, search);
    }

    @Get('search')
    @Roles(UserRole.CLINIC_ADMIN, UserRole.SECRETARY, UserRole.DOCTOR)
    @ApiOperation({ summary: 'Buscar pacientes' })
    search(@CurrentClinic() clinicId: string, @Query('q') query: string) {
        return this.patientsService.findAll(clinicId, query);
    }

    @Get('my-patients')
    @Roles(UserRole.DOCTOR)
    @ApiOperation({ summary: 'Listar mis pacientes (doctor)' })
    findMyPatients(@CurrentClinic() clinicId: string, @CurrentUser('id') doctorId: string) {
        return this.patientsService.findByDoctor(clinicId, doctorId);
    }

    @Get(':id')
    @Roles(UserRole.CLINIC_ADMIN, UserRole.SECRETARY, UserRole.DOCTOR)
    @ApiOperation({ summary: 'Detalle de paciente' })
    findOne(@CurrentClinic() clinicId: string, @Param('id') id: string) {
        return this.patientsService.findOne(clinicId, id);
    }

    @Post()
    @Roles(UserRole.CLINIC_ADMIN, UserRole.SECRETARY)
    @ApiOperation({ summary: 'Crear paciente' })
    create(@CurrentClinic() clinicId: string, @Body() data: any) {
        return this.patientsService.create(clinicId, data);
    }

    @Patch(':id')
    @Roles(UserRole.CLINIC_ADMIN, UserRole.SECRETARY)
    @ApiOperation({ summary: 'Actualizar paciente' })
    update(@CurrentClinic() clinicId: string, @Param('id') id: string, @Body() data: any) {
        return this.patientsService.update(clinicId, id, data);
    }

    @Delete(':id')
    @Roles(UserRole.CLINIC_ADMIN)
    @ApiOperation({ summary: 'Eliminar paciente' })
    async delete(@CurrentClinic() clinicId: string, @Param('id') id: string) {
        await this.patientsService.softDelete(clinicId, id);
        return { success: true, message: 'Paciente eliminado' };
    }
}

