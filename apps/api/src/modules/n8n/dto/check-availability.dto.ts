import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckAvailabilityDto {
    @ApiPropertyOptional({ description: 'ID del doctor específico' })
    @IsOptional()
    @IsString()
    doctorId?: string;

    @ApiPropertyOptional({ description: 'Nombre de la especialidad (ej: "Cardiología")' })
    @IsOptional()
    @IsString()
    specialty?: string;

    @ApiProperty({ description: 'Fecha a consultar (YYYY-MM-DD)' })
    @IsDateString()
    date: string;
}
