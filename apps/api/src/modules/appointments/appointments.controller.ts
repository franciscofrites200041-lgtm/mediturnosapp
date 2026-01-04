import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { QueryAppointmentsDto } from './dto/query-appointments.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { CurrentUser, CurrentClinic } from '@/common/decorators/user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { UserRole } from '@prisma/client';

@ApiTags('appointments')
@Controller('appointments')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class AppointmentsController {
    constructor(private readonly appointmentsService: AppointmentsService) { }

    @Post()
    @Roles(UserRole.CLINIC_ADMIN, UserRole.SECRETARY)
    @ApiOperation({ summary: 'Crear nuevo turno' })
    @ApiResponse({ status: 201, description: 'Turno creado exitosamente' })
    create(
        @CurrentClinic() clinicId: string,
        @CurrentUser('id') userId: string,
        @Body() dto: CreateAppointmentDto,
    ) {
        return this.appointmentsService.create(clinicId, dto, userId);
    }

    @Get()
    @Roles(UserRole.CLINIC_ADMIN, UserRole.SECRETARY, UserRole.DOCTOR)
    @ApiOperation({ summary: 'Listar turnos con filtros' })
    findAll(
        @CurrentClinic() clinicId: string,
        @Query() query: QueryAppointmentsDto,
    ) {
        return this.appointmentsService.findAll(clinicId, query);
    }

    @Get('calendar')
    @Roles(UserRole.CLINIC_ADMIN, UserRole.SECRETARY, UserRole.DOCTOR)
    @ApiOperation({ summary: 'Obtener turnos para vista de calendario' })
    findForCalendar(
        @CurrentClinic() clinicId: string,
        @CurrentUser('id') userId: string,
        @CurrentUser('role') userRole: UserRole,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @Query('doctorId') doctorId?: string,
        @Query('areaId') areaId?: string,
    ) {
        // For DOCTOR role, force filtering by their own ID
        const effectiveDoctorId = userRole === UserRole.DOCTOR ? userId : doctorId;

        return this.appointmentsService.findForCalendar(
            clinicId,
            new Date(startDate),
            new Date(endDate),
            effectiveDoctorId,
            areaId,
        );
    }

    @Get('my-agenda')
    @Roles(UserRole.DOCTOR)
    @ApiOperation({ summary: 'Obtener agenda del día del doctor actual' })
    getMyAgenda(
        @CurrentClinic() clinicId: string,
        @CurrentUser('id') doctorId: string,
        @Query('date') date?: string,
    ) {
        return this.appointmentsService.getDoctorAgenda(
            clinicId,
            doctorId,
            date ? new Date(date) : undefined,
        );
    }

    @Get('availability/:doctorId')
    @Roles(UserRole.CLINIC_ADMIN, UserRole.SECRETARY)
    @ApiOperation({ summary: 'Obtener slots disponibles de un doctor' })
    getAvailability(
        @CurrentClinic() clinicId: string,
        @Param('doctorId') doctorId: string,
        @Query('date') date: string,
    ) {
        return this.appointmentsService.getAvailableSlots(clinicId, doctorId, new Date(date));
    }

    @Get(':id')
    @Roles(UserRole.CLINIC_ADMIN, UserRole.SECRETARY, UserRole.DOCTOR)
    @ApiOperation({ summary: 'Obtener detalle de un turno' })
    findOne(@CurrentClinic() clinicId: string, @Param('id') id: string) {
        return this.appointmentsService.findOne(clinicId, id);
    }

    @Patch(':id')
    @Roles(UserRole.CLINIC_ADMIN, UserRole.SECRETARY)
    @ApiOperation({ summary: 'Actualizar turno' })
    update(
        @CurrentClinic() clinicId: string,
        @Param('id') id: string,
        @Body() dto: UpdateAppointmentDto,
    ) {
        return this.appointmentsService.update(clinicId, id, dto);
    }

    @Patch(':id/status')
    @Roles(UserRole.CLINIC_ADMIN, UserRole.SECRETARY, UserRole.DOCTOR)
    @ApiOperation({ summary: 'Cambiar estado del turno' })
    updateStatus(
        @CurrentClinic() clinicId: string,
        @Param('id') id: string,
        @Body() dto: UpdateStatusDto,
    ) {
        return this.appointmentsService.updateStatus(clinicId, id, dto.status, dto.cancelReason);
    }

    @Delete(':id')
    @Roles(UserRole.CLINIC_ADMIN, UserRole.SECRETARY)
    @ApiOperation({ summary: 'Cancelar turno' })
    cancel(
        @CurrentClinic() clinicId: string,
        @Param('id') id: string,
        @Body('reason') reason?: string,
    ) {
        return this.appointmentsService.cancel(clinicId, id, reason);
    }
}
