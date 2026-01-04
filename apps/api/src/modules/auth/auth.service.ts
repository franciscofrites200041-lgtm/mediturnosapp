import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { PrismaService } from '@/common/prisma/prisma.service';
import { EmailService } from '@/common/email/email.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SignupDto } from './dto/signup.dto';
import { UserRole, SubscriptionStatus, SubscriptionPlan } from '@prisma/client';

export interface JwtPayload {
    sub: string;
    email: string;
    role: UserRole;
    clinicId: string | null;
}

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private emailService: EmailService,
    ) { }

    // ==========================================
    // PUBLIC SIGNUP - Crear clínica + admin
    // ==========================================
    async signup(dto: SignupDto) {
        // Check if email already exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
        });

        if (existingUser) {
            throw new BadRequestException('Este email ya está registrado');
        }

        // Generate slug from clinic name
        const slug = this.generateSlug(dto.clinicName);

        // Check if slug exists
        const existingClinic = await this.prisma.clinic.findUnique({
            where: { slug },
        });

        if (existingClinic) {
            throw new BadRequestException('Ya existe una clínica con un nombre similar');
        }

        // Generate verification token
        const emailVerifyToken = crypto.randomBytes(32).toString('hex');
        const emailVerifyTokenExp = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Create clinic and admin user in a transaction
        const result = await this.prisma.$transaction(async (tx) => {
            // Create clinic with trial
            const clinic = await tx.clinic.create({
                data: {
                    name: dto.clinicName,
                    slug,
                    email: dto.email.toLowerCase(),
                    phone: dto.phone || '',
                    subscriptionStatus: SubscriptionStatus.TRIAL,
                    subscriptionPlan: (dto.plan as SubscriptionPlan) || SubscriptionPlan.PROFESSIONAL, // Full features during trial
                    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
                    isActive: true,
                },
            });

            // Create admin user
            const passwordHash = await argon2.hash(dto.password);
            const user = await tx.user.create({
                data: {
                    email: dto.email.toLowerCase(),
                    passwordHash,
                    firstName: dto.firstName,
                    lastName: dto.lastName,
                    phone: dto.phone,
                    role: UserRole.CLINIC_ADMIN,
                    clinicId: clinic.id,
                    isActive: true,
                    emailVerified: false,
                    emailVerifyToken,
                    emailVerifyTokenExp,
                },
            });

            return { clinic, user };
        });

        // Send verification email
        await this.emailService.sendVerificationEmail(
            result.user.email,
            result.user.firstName,
            emailVerifyToken,
        );

        return {
            message: 'Registro exitoso. Por favor revisa tu email para verificar tu cuenta.',
            user: {
                id: result.user.id,
                email: result.user.email,
                firstName: result.user.firstName,
                lastName: result.user.lastName,
            },
            clinic: {
                id: result.clinic.id,
                name: result.clinic.name,
                slug: result.clinic.slug,
            },
        };
    }

    // ==========================================
    // VERIFY EMAIL
    // ==========================================
    async verifyEmail(token: string) {
        const user = await this.prisma.user.findFirst({
            where: {
                emailVerifyToken: token,
                emailVerifyTokenExp: { gte: new Date() },
            },
            include: { clinic: true },
        });

        if (!user) {
            throw new BadRequestException('Token de verificación inválido o expirado');
        }

        // Update user as verified
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
                emailVerifyToken: null,
                emailVerifyTokenExp: null,
            },
        });

        // Send welcome email
        if (user.clinic) {
            await this.emailService.sendWelcomeEmail(
                user.email,
                user.firstName,
                user.clinic.name,
            );
        }

        return {
            message: 'Email verificado exitosamente. Ya puedes iniciar sesión.',
            verified: true,
        };
    }

    // ==========================================
    // RESEND VERIFICATION EMAIL
    // ==========================================
    async resendVerificationEmail(email: string) {
        const user = await this.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user) {
            // Don't reveal if user exists
            return { message: 'Si el email está registrado, recibirás un enlace de verificación.' };
        }

        if (user.emailVerified) {
            throw new BadRequestException('Este email ya está verificado');
        }

        // Generate new token
        const emailVerifyToken = crypto.randomBytes(32).toString('hex');
        const emailVerifyTokenExp = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await this.prisma.user.update({
            where: { id: user.id },
            data: { emailVerifyToken, emailVerifyTokenExp },
        });

        await this.emailService.sendVerificationEmail(
            user.email,
            user.firstName,
            emailVerifyToken,
        );

        return { message: 'Si el email está registrado, recibirás un enlace de verificación.' };
    }

    // ==========================================
    // FORGOT PASSWORD
    // ==========================================
    async forgotPassword(email: string) {
        const user = await this.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        // Always return success to prevent email enumeration
        if (!user) {
            return { message: 'Si el email está registrado, recibirás instrucciones para restablecer tu contraseña.' };
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExp = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await this.prisma.user.update({
            where: { id: user.id },
            data: { resetToken, resetTokenExp },
        });

        await this.emailService.sendPasswordResetEmail(
            user.email,
            user.firstName,
            resetToken,
        );

        return { message: 'Si el email está registrado, recibirás instrucciones para restablecer tu contraseña.' };
    }

    // ==========================================
    // RESET PASSWORD
    // ==========================================
    async resetPassword(token: string, newPassword: string) {
        const user = await this.prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExp: { gte: new Date() },
            },
        });

        if (!user) {
            throw new BadRequestException('Token de restablecimiento inválido o expirado');
        }

        const passwordHash = await argon2.hash(newPassword);

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                resetToken: null,
                resetTokenExp: null,
                failedLoginAttempts: 0,
                lockedUntil: null,
            },
        });

        return { message: 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión.' };
    }

    // ==========================================
    // LOGIN
    // ==========================================
    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
            include: { clinic: true },
        });

        if (!user) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Usuario desactivado');
        }

        // Check if email is verified
        if (!user.emailVerified) {
            throw new UnauthorizedException('Por favor verifica tu email antes de iniciar sesión');
        }

        // Check if account is locked
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            throw new UnauthorizedException('Cuenta bloqueada temporalmente. Intente más tarde.');
        }

        // Check if clinic is active (for non-super-admins)
        if (user.role !== UserRole.SUPER_ADMIN && user.clinic) {
            if (!user.clinic.isActive) {
                throw new UnauthorizedException('La clínica está desactivada');
            }

            // Check subscription status
            if (user.clinic.subscriptionStatus === SubscriptionStatus.CANCELLED ||
                user.clinic.subscriptionStatus === SubscriptionStatus.SUSPENDED) {
                throw new UnauthorizedException('La suscripción de la clínica no está activa');
            }

            // Check if trial has expired
            if (user.clinic.subscriptionStatus === SubscriptionStatus.TRIAL &&
                user.clinic.trialEndsAt && user.clinic.trialEndsAt < new Date()) {
                throw new UnauthorizedException('El período de prueba ha expirado. Por favor actualiza tu suscripción.');
            }
        }

        const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);

        if (!isPasswordValid) {
            // Increment failed login attempts
            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    failedLoginAttempts: { increment: 1 },
                    lockedUntil: user.failedLoginAttempts >= 4
                        ? new Date(Date.now() + 15 * 60 * 1000) // Lock for 15 minutes after 5 attempts
                        : null,
                },
            });
            throw new UnauthorizedException('Credenciales inválidas');
        }

        // Reset failed attempts on successful login
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                failedLoginAttempts: 0,
                lockedUntil: null,
                lastLoginAt: new Date(),
            },
        });

        // Create audit log
        await this.prisma.auditLog.create({
            data: {
                userId: user.id,
                clinicId: user.clinicId,
                action: 'LOGIN',
                resource: 'auth',
                details: { ip: dto.ipAddress, userAgent: dto.userAgent },
            },
        });

        const tokens = await this.generateTokens(user);

        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                clinicId: user.clinicId,
                avatarUrl: user.avatarUrl,
            },
            clinic: user.clinic ? {
                id: user.clinic.id,
                name: user.clinic.name,
                slug: user.clinic.slug,
                email: user.clinic.email,
                phone: user.clinic.phone,
                logoUrl: user.clinic.logoUrl,
                timezone: user.clinic.timezone,
                subscriptionStatus: user.clinic.subscriptionStatus,
                subscriptionPlan: user.clinic.subscriptionPlan,
                trialEndsAt: user.clinic.trialEndsAt,
            } : null,
            ...tokens,
        };
    }

    // ==========================================
    // REGISTER (for admins to add users)
    // ==========================================
    async register(dto: RegisterDto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
        });

        if (existingUser) {
            throw new BadRequestException('El email ya está registrado');
        }

        const passwordHash = await argon2.hash(dto.password);

        const user = await this.prisma.user.create({
            data: {
                email: dto.email.toLowerCase(),
                passwordHash,
                firstName: dto.firstName,
                lastName: dto.lastName,
                phone: dto.phone,
                role: dto.role || UserRole.SECRETARY,
                clinicId: dto.clinicId,
                emailVerified: true, // Users added by admin are pre-verified
            },
        });

        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
        };
    }

    // ==========================================
    // GET CURRENT USER (for /auth/me)
    // ==========================================
    async getCurrentUser(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                clinic: true,
                specialty: { select: { id: true, name: true, color: true } },
            },
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            avatarUrl: user.avatarUrl,
            role: user.role,
            clinicId: user.clinicId,
            specialty: user.specialty,
            licenseNumber: user.licenseNumber,
            clinic: user.clinic ? {
                id: user.clinic.id,
                name: user.clinic.name,
                slug: user.clinic.slug,
                email: user.clinic.email,
                phone: user.clinic.phone,
                address: user.clinic.address,
                city: user.clinic.city,
                logoUrl: user.clinic.logoUrl,
                timezone: user.clinic.timezone,
                subscriptionStatus: user.clinic.subscriptionStatus,
                subscriptionPlan: user.clinic.subscriptionPlan,
                trialEndsAt: user.clinic.trialEndsAt,
                webhookUrl: user.clinic.webhookUrl,
                apiKey: user.clinic.apiKey,
            } : null,
        };
    }

    // ==========================================
    // REFRESH TOKENS
    // ==========================================
    async refreshTokens(refreshToken: string) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            });

            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
            });

            if (!user || !user.isActive) {
                throw new UnauthorizedException('Token inválido');
            }

            return this.generateTokens(user);
        } catch {
            throw new UnauthorizedException('Token de refresco inválido');
        }
    }

    // ==========================================
    // LOGOUT
    // ==========================================
    async logout(userId: string) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshToken: null },
        });

        return { message: 'Sesión cerrada exitosamente' };
    }

    // ==========================================
    // HELPERS
    // ==========================================
    private async generateTokens(user: { id: string; email: string; role: UserRole; clinicId: string | null }) {
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            clinicId: user.clinicId,
        };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
                expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
            }),
        ]);

        // Store refresh token hash
        await this.prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: await argon2.hash(refreshToken) },
        });

        return { accessToken, refreshToken };
    }

    private generateSlug(name: string): string {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove accents
            .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single
            .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
    }
}
