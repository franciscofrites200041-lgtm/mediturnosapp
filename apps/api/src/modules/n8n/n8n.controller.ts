import {
    Controller,
    Get,
    Post,
    Body,
    Query,
    UseGuards,
    Delete,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiSecurity, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { N8nService } from './n8n.service';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { BookAppointmentDto } from './dto/book-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { CurrentUser } from '@/common/decorators/user.decorator';

/**
 * n8n Integration Controller
 * 
 * These endpoints are secured via API Key (X-API-Key header)
 * and are designed to be consumed by n8n workflows for WhatsApp bot integration.
 * 
 * Rate limited to prevent abuse.
 */
@ApiTags('n8n')
@Controller('n8n')
@UseGuards(AuthGuard('api-key'))
@ApiSecurity('api-key')
@Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
export class N8nController {
    constructor(private readonly n8nService: N8nService) { }

    @Get('availability')
    @ApiOperation({
        summary: 'Consultar disponibilidad de turnos',
        description: 'Retorna los slots disponibles para un doctor o especialidad en una fecha específica',
    })
    @ApiResponse({
        status: 200,
        description: 'Lista de slots disponibles',
        schema: {
            example: {
                success: true,
                date: '2024-01-15',
                doctor: { id: 'xxx', name: 'Dr. Juan Pérez', specialty: 'Cardiología' },
                slots: [
                    { start: '2024-01-15T09:00:00Z', end: '2024-01-15T09:30:00Z', formatted: '09:00' },
                    { start: '2024-01-15T09:30:00Z', end: '2024-01-15T10:00:00Z', formatted: '09:30' },
                ],
            },
        },
    })
    async checkAvailability(
        @CurrentUser('clinicId') clinicId: string,
        @Query() dto: CheckAvailabilityDto,
    ) {
        return this.n8nService.checkAvailability(clinicId, dto);
    }

    @Post('appointments')
    @ApiOperation({
        summary: 'Reservar un turno',
        description: 'Crea una nueva reserva de turno. El paciente se crea automáticamente si no existe.',
    })
    @ApiResponse({
        status: 201,
        description: 'Turno reservado exitosamente',
        schema: {
            example: {
                success: true,
                message: 'Turno reservado exitosamente',
                appointment: {
                    id: 'xxx',
                    date: 'lunes, 15 de enero de 2024',
                    time: '09:00',
                    doctor: 'Dr. Juan Pérez',
                    specialty: 'Cardiología',
                    patient: 'María García',
                    confirmationCode: 'ABC123',
                },
            },
        },
    })
    async bookAppointment(
        @CurrentUser('clinicId') clinicId: string,
        @Body() dto: BookAppointmentDto,
    ) {
        return this.n8nService.bookAppointment(clinicId, dto);
    }

    @Delete('appointments')
    @ApiOperation({
        summary: 'Cancelar un turno',
        description: 'Cancela un turno existente usando el ID o código de confirmación + teléfono',
    })
    @ApiResponse({
        status: 200,
        description: 'Turno cancelado exitosamente',
        schema: {
            example: {
                success: true,
                message: 'El turno ha sido cancelado exitosamente.',
                cancelledAppointmentId: 'xxx',
            },
        },
    })
    async cancelAppointment(
        @CurrentUser('clinicId') clinicId: string,
        @Body() dto: CancelAppointmentDto,
    ) {
        return this.n8nService.cancelAppointment(clinicId, dto);
    }

    @Get('doctors')
    @ApiOperation({
        summary: 'Listar doctores',
        description: 'Retorna la lista de doctores, opcionalmente filtrada por especialidad',
    })
    async getDoctors(
        @CurrentUser('clinicId') clinicId: string,
        @Query('specialty') specialty?: string,
    ) {
        return this.n8nService.getDoctors(clinicId, specialty);
    }

    @Get('specialties')
    @ApiOperation({
        summary: 'Listar especialidades',
        description: 'Retorna todas las especialidades/áreas disponibles en la clínica',
    })
    async getSpecialties(@CurrentUser('clinicId') clinicId: string) {
        return this.n8nService.getSpecialties(clinicId);
    }

    @Get('config')
    @ApiOperation({
        summary: 'Obtener configuración de la clínica para n8n',
        description: 'Retorna la configuración de WhatsApp y datos de la clínica para usar en n8n',
    })
    @ApiResponse({
        status: 200,
        description: 'Configuración de la clínica',
        schema: {
            example: {
                clinic: {
                    id: 'xxx',
                    name: 'Clínica San Martín',
                    slug: 'clinica-san-martin',
                    timezone: 'America/Argentina/Buenos_Aires',
                },
                whatsapp: {
                    phoneNumber: '+5491155551234',
                    isBotEnabled: true,
                    welcomeMessage: '¡Bienvenido a Clínica San Martín!',
                },
            },
        },
    })
    async getConfig(@CurrentUser('clinicId') clinicId: string) {
        return this.n8nService.getClinicConfig(clinicId);
    }
}
