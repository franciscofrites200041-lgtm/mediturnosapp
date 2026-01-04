import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CancelAppointmentDto {
    @ApiPropertyOptional({ description: 'ID del turno a cancelar' })
    @IsOptional()
    @IsString()
    appointmentId?: string;

    @ApiPropertyOptional({ description: 'Código de confirmación (últimos 6 caracteres del ID)' })
    @IsOptional()
    @IsString()
    confirmationCode?: string;

    @ApiPropertyOptional({ description: 'Teléfono del paciente (para verificación)' })
    @IsOptional()
    @IsString()
    patientPhone?: string;

    @ApiPropertyOptional({ description: 'Motivo de la cancelación' })
    @IsOptional()
    @IsString()
    reason?: string;
}
