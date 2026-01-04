import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
    @ApiProperty({ description: 'Token de verificación enviado por email' })
    @IsString()
    @MinLength(10)
    token: string;
}
