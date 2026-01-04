import { Body, Controller, Get, Post, Query, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppointmentsService, BotAppointmentDto } from './appointments.service';
import { PrismaService } from '@/common/prisma/prisma.service';

@ApiTags('bot')
@Controller('bot')
export class BotAppointmentsController {
    constructor(
        private readonly appointmentsService: AppointmentsService,
        private readonly prisma: PrismaService
    ) { }

    private validateKey(key: string) {
        // En producción, esto debería venir de una variable de entorno
        if (key !== 'mediturnos_secret_bot_key') {
            throw new UnauthorizedException('Invalid Bot API Key');
        }
    }

    @Post('appointment')
    @ApiOperation({ summary: 'Crear turno desde Bot' })
    create(@Body() dto: BotAppointmentDto) {
        // La validación de API Key ya se hace dentro del servicio createFromBot también, 
        // pero podemos hacer doble check o confiar en el servicio.
        return this.appointmentsService.createFromBot(dto);
    }

    @Get('clinic')
    @ApiOperation({ summary: 'Identificar clínica por WhatsApp ID' })
    async getClinic(@Query('waId') waId: string, @Query('apiKey') apiKey: string) {
        this.validateKey(apiKey);

        if (!waId) throw new NotFoundException('WhatsApp ID requerido');

        // Buscar configuración por whatsappId (phoneNumberId)
        const config = await this.prisma.whatsAppConfig.findUnique({
            where: { phoneNumberId: waId },
            include: { clinic: true }
        });

        if (!config) {
            // FALLBACK DEV (Solo para pruebas si no hay configuración)
            // Buscamos si hay alguna config, si no, devolvemos error
            const firstConfig = await this.prisma.whatsAppConfig.findFirst({ include: { clinic: true } });

            if (firstConfig) {
                return {
                    id: firstConfig.clinic.id,
                    name: firstConfig.clinic.name,
                    whatsappToken: firstConfig.accessToken,
                    warning: 'Using fallback clinic config'
                };
            }
            throw new NotFoundException('Clínica no encontrada para este WhatsApp ID');
        }

        return {
            id: config.clinic.id,
            name: config.clinic.name,
            whatsappToken: config.accessToken
        };
    }

    @Get('doctors')
    @ApiOperation({ summary: 'Listar doctores de una clínica (opcional: filtrar por área)' })
    async getDoctors(
        @Query('clinicId') clinicId: string,
        @Query('areaId') areaId: string, // Nuevo parámetro requerido por el Bot
        @Query('apiKey') apiKey: string
    ) {
        this.validateKey(apiKey);

        if (!clinicId) throw new NotFoundException('Clinic ID requerido');

        const doctors = await this.prisma.user.findMany({
            where: {
                clinicId,
                role: 'DOCTOR',
                isActive: true,
                ...(areaId ? { specialtyId: areaId } : {}) // Filtro dinámico
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                specialty: {
                    select: { name: true }
                }
            }
        });

        // Mapeo para cumplir contrato "Flat JSON" de la IA: { id, name, specialty }
        return doctors.map(doc => ({
            id: doc.id,
            name: `${doc.firstName} ${doc.lastName}`, // Concatenamos nombre
            specialty: doc.specialty?.name || 'General' // Aplanamos objeto
        }));
    }

    @Get('areas')
    @ApiOperation({ summary: 'Listar especialidades de una clínica' })
    async getAreas(@Query('clinicId') clinicId: string, @Query('apiKey') apiKey: string) {
        this.validateKey(apiKey);

        if (!clinicId) throw new NotFoundException('Clinic ID requerido');

        return this.prisma.area.findMany({
            where: {
                clinicId,
                isActive: true
            },
            select: { id: true, name: true }
        });
    }
}
