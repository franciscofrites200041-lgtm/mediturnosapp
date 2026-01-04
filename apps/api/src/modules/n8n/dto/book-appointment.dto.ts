import { IsString, IsOptional, IsInt, Min, IsDateString, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BookAppointmentDto {
    @ApiProperty({ description: 'ID del doctor' })
    @IsString()
    doctorId: string;

    @ApiProperty({ description: 'Inicio del slot seleccionado (ISO 8601)' })
    @IsDateString()
    slotStart: string;

    @ApiPropertyOptional({ description: 'Duración en minutos', default: 30 })
    @IsOptional()
    @IsInt()
    @Min(10)
    duration?: number;

    @ApiProperty({ description: 'Nombre completo del paciente' })
    @IsString()
    patientName: string;

    @ApiProperty({ description: 'Teléfono del paciente (con código de país)' })
    @IsString()
    patientPhone: string;

    @ApiPropertyOptional({ description: 'Email del paciente' })
    @IsOptional()
    @IsEmail()
    patientEmail?: string;

    @ApiPropertyOptional({ description: 'Número de documento del paciente' })
    @IsOptional()
    @IsString()
    patientDocumentNumber?: string;

    @ApiPropertyOptional({ description: 'Motivo de la consulta' })
    @IsOptional()
    @IsString()
    reason?: string;
}
