import {
    Controller,
    Post,
    Get,
    Body,
    UseGuards,
    Req,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SignupDto } from './dto/signup.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { CurrentUser } from '@/common/decorators/user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    // ==========================================
    // PUBLIC ENDPOINTS
    // ==========================================

    @Post('signup')
    @ApiOperation({ summary: 'Registrar nueva clínica y administrador (público)' })
    @ApiResponse({ status: 201, description: 'Registro exitoso, verificar email' })
    @ApiResponse({ status: 400, description: 'Email ya registrado o datos inválidos' })
    async signup(@Body() dto: SignupDto) {
        return this.authService.signup(dto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Iniciar sesión' })
    @ApiResponse({ status: 200, description: 'Login exitoso' })
    @ApiResponse({ status: 401, description: 'Credenciales inválidas o email no verificado' })
    async login(@Body() dto: LoginDto, @Req() req: Request) {
        return this.authService.login({
            ...dto,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });
    }

    @Post('verify-email')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Verificar email con token' })
    @ApiResponse({ status: 200, description: 'Email verificado' })
    @ApiResponse({ status: 400, description: 'Token inválido o expirado' })
    async verifyEmail(@Body() dto: VerifyEmailDto) {
        return this.authService.verifyEmail(dto.token);
    }

    @Post('resend-verification')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Reenviar email de verificación' })
    @ApiResponse({ status: 200, description: 'Email enviado si el usuario existe' })
    async resendVerification(@Body() dto: ForgotPasswordDto) {
        return this.authService.resendVerificationEmail(dto.email);
    }

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Solicitar restablecimiento de contraseña' })
    @ApiResponse({ status: 200, description: 'Email enviado si el usuario existe' })
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.forgotPassword(dto.email);
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Restablecer contraseña con token' })
    @ApiResponse({ status: 200, description: 'Contraseña restablecida' })
    @ApiResponse({ status: 400, description: 'Token inválido o expirado' })
    async resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto.token, dto.password);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refrescar tokens' })
    @ApiResponse({ status: 200, description: 'Tokens refrescados' })
    async refreshTokens(@Body() dto: RefreshTokenDto) {
        return this.authService.refreshTokens(dto.refreshToken);
    }

    // ==========================================
    // PROTECTED ENDPOINTS (require authentication)
    // ==========================================

    @Get('me')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Obtener datos del usuario actual' })
    @ApiResponse({ status: 200, description: 'Datos del usuario' })
    async getCurrentUser(@CurrentUser('sub') userId: string) {
        return this.authService.getCurrentUser(userId);
    }

    @Post('register')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Registrar nuevo usuario (solo admins de clínica)' })
    @ApiResponse({ status: 201, description: 'Usuario creado' })
    @ApiResponse({ status: 400, description: 'Email ya registrado' })
    async register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Post('logout')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Cerrar sesión' })
    @ApiResponse({ status: 200, description: 'Sesión cerrada' })
    async logout(@CurrentUser('sub') userId: string) {
        return this.authService.logout(userId);
    }
}
