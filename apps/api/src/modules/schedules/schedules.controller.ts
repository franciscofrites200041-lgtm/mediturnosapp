import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SchedulesService } from './schedules.service';
import { CurrentClinic } from '@/common/decorators/user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { UserRole } from '@prisma/client';

@ApiTags('schedules')
@Controller('schedules')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class SchedulesController {
    constructor(private readonly schedulesService: SchedulesService) { }

    @Get('doctor/:doctorId')
    @Roles(UserRole.CLINIC_ADMIN, UserRole.SECRETARY)
    @ApiOperation({ summary: 'Horarios de un doctor' })
    findByDoctor(@CurrentClinic() clinicId: string, @Param('doctorId') doctorId: string) {
        return this.schedulesService.findByDoctor(clinicId, doctorId);
    }

    @Post('doctor/:doctorId')
    @Roles(UserRole.CLINIC_ADMIN)
    @ApiOperation({ summary: 'Agregar horario a doctor' })
    create(
        @CurrentClinic() clinicId: string,
        @Param('doctorId') doctorId: string,
        @Body() data: any,
    ) {
        return this.schedulesService.create(clinicId, doctorId, data);
    }

    @Put('doctor/:doctorId/bulk')
    @Roles(UserRole.CLINIC_ADMIN)
    @ApiOperation({ summary: 'Actualizar todos los horarios de un doctor' })
    bulkUpdate(
        @CurrentClinic() clinicId: string,
        @Param('doctorId') doctorId: string,
        @Body() schedules: any[],
    ) {
        return this.schedulesService.bulkUpdate(clinicId, doctorId, schedules);
    }

    @Delete(':id')
    @Roles(UserRole.CLINIC_ADMIN)
    @ApiOperation({ summary: 'Eliminar horario' })
    delete(@CurrentClinic() clinicId: string, @Param('id') id: string) {
        return this.schedulesService.delete(clinicId, id);
    }
}
