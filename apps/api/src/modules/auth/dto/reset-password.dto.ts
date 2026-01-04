import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
    @ApiProperty({ description: 'Token de restablecimiento enviado por email' })
    @IsString()
    @MinLength(10)
    token: string;

    @ApiProperty({ example: 'NuevaPassword123!', description: 'Nueva contraseña (mínimo 8 caracteres)' })
    @IsString()
    @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
    password: string;
}
