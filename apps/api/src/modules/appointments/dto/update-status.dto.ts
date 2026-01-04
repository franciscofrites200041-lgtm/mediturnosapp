import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus } from '@prisma/client';

export class UpdateStatusDto {
    @ApiProperty({ enum: AppointmentStatus })
    @IsEnum(AppointmentStatus)
    status: AppointmentStatus;

    @ApiPropertyOptional({ description: 'Motivo de cancelación (si aplica)' })
    @IsOptional()
    @IsString()
    cancelReason?: string;
}
