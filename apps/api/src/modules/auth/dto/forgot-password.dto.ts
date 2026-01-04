import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
    @ApiProperty({ example: 'admin@clinicasanmartin.com', description: 'Email de la cuenta' })
    @IsEmail({}, { message: 'Email inválido' })
    email: string;
}
