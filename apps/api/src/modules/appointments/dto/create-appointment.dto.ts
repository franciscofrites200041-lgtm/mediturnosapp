import { IsString, IsDateString, IsOptional, IsInt, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentType, PatientSource } from '@prisma/client';

export class CreateAppointmentDto {
    @ApiProperty({ description: 'ID del paciente' })
    @IsString()
    patientId: string;

    @ApiProperty({ description: 'ID del doctor' })
    @IsString()
    doctorId: string;

    @ApiProperty({ description: 'ID del área/especialidad' })
    @IsString()
    areaId: string;

    @ApiProperty({ description: 'Fecha y hora del turno (ISO 8601)' })
    @IsDateString()
    scheduledAt: string;

    @ApiPropertyOptional({ description: 'Duración en minutos', default: 30 })
    @IsOptional()
    @IsInt()
    @Min(10)
    duration?: number;

    @ApiPropertyOptional({ enum: AppointmentType, default: 'IN_PERSON' })
    @IsOptional()
    @IsEnum(AppointmentType)
    type?: AppointmentType;

    @ApiPropertyOptional({ description: 'Motivo de la consulta' })
    @IsOptional()
    @IsString()
    reason?: string;

    @ApiPropertyOptional({ description: 'Notas adicionales' })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional({ enum: PatientSource })
    @IsOptional()
    @IsEnum(PatientSource)
    source?: PatientSource;
}
