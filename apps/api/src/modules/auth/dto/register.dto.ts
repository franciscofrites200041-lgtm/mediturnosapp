import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class RegisterDto {
    @ApiProperty({ example: 'doctor@clinica.com' })
    @IsEmail({}, { message: 'Email inválido' })
    email: string;

    @ApiProperty({ example: 'password123' })
    @IsString()
    @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
    password: string;

    @ApiProperty({ example: 'Juan' })
    @IsString()
    firstName: string;

    @ApiProperty({ example: 'Pérez' })
    @IsString()
    lastName: string;

    @ApiPropertyOptional({ example: '+5491155554444' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({ enum: UserRole })
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    clinicId?: string;
}
