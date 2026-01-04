import { IsEmail, IsString, MinLength, MaxLength, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SignupDto {
    @ApiProperty({ example: 'admin@clinicasanmartin.com', description: 'Email del administrador' })
    @IsEmail({}, { message: 'Email inválido' })
    email: string;

    @ApiProperty({ example: 'MiPassword123!', description: 'Contraseña (mínimo 8 caracteres)' })
    @IsString()
    @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
    password: string;

    @ApiProperty({ example: 'Juan', description: 'Nombre del administrador' })
    @IsString()
    @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
    @MaxLength(50)
    firstName: string;

    @ApiProperty({ example: 'Pérez', description: 'Apellido del administrador' })
    @IsString()
    @MinLength(2, { message: 'El apellido debe tener al menos 2 caracteres' })
    @MaxLength(50)
    lastName: string;

    @ApiProperty({ example: 'Clínica San Martín', description: 'Nombre de la clínica' })
    @IsString()
    @MinLength(3, { message: 'El nombre de la clínica debe tener al menos 3 caracteres' })
    @MaxLength(100)
    clinicName: string;

    @ApiPropertyOptional({ example: '+54 11 4555-1234', description: 'Teléfono de contacto' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({ example: 'true', description: 'Acepta términos y condiciones' })
    @IsOptional()
    acceptTerms?: boolean;

    @ApiPropertyOptional({ example: 'PROFESSIONAL', description: 'Plan de suscripción seleccionado (BASIC, PROFESSIONAL, ENTERPRISE)' })
    @IsOptional()
    @IsString()
    plan?: string;
}
