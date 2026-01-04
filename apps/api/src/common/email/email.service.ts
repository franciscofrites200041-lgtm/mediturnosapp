import { Action } from 'rxjs/internal/scheduler/Action';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { Resend } from 'resend';

export interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private transporter: Transporter | null = null;
    private resend: Resend | null = null;
    private readonly fromEmail: string;
    private readonly fromName: string;

    constructor(private configService: ConfigService) {
        this.fromEmail = this.configService.get<string>('SMTP_FROM') || 'noreply@mediturnos.com';
        this.fromName = this.configService.get<string>('SMTP_FROM_NAME') || 'MediTurnos';

        // Initialize Resend
        const resendApiKey = this.configService.get<string>('RESEND_API_KEY');
        if (resendApiKey) {
            this.resend = new Resend(resendApiKey);
            this.logger.log('Resend initialized');
        }

        // Initialize transporter if SMTP is configured
        const smtpHost = this.configService.get<string>('SMTP_HOST');
        if (smtpHost) {
            this.transporter = nodemailer.createTransport({
                host: smtpHost,
                port: this.configService.get<number>('SMTP_PORT') || 587,
                secure: this.configService.get<boolean>('SMTP_SECURE') || false,
                auth: {
                    user: this.configService.get<string>('SMTP_USER'),
                    pass: this.configService.get<string>('SMTP_PASS'),
                },
            });
            this.logger.log('Email transporter initialized');
        } else {
            this.logger.warn('SMTP not configured - emails will be logged to console');
        }
    }

    async sendEmail(options: SendEmailOptions): Promise<boolean> {
        const { to, subject, html, text } = options;

        // Try Resend first
        if (this.resend) {
            try {
                // Use onboarding domain for dev if configured or default to safer dev for now
                // Allows overriding via env var for production
                const resendFrom = this.configService.get('EMAIL_FROM') || 'onboarding@resend.dev';

                await this.resend.emails.send({
                    from: resendFrom.includes('@resend.dev') ? resendFrom : `${this.fromName} <${resendFrom}>`,
                    to,
                    subject,
                    html,
                    text
                });
                this.logger.log(`Email sent via Resend to ${to}`);
                return true;
            } catch (error) {
                this.logger.error('Resend failed, falling back to SMTP/Console', error);
            }
        }

        // If no transporter, log email to console (development mode)
        if (!this.transporter) {
            this.logger.log('='.repeat(60));
            this.logger.log(`📧 EMAIL (dev mode - no SMTP configured)`);
            this.logger.log(`To: ${to}`);
            this.logger.log(`Subject: ${subject}`);
            this.logger.log(`Body: ${text || 'See HTML'}`);
            this.logger.log('='.repeat(60));
            return true;
        }

        try {
            await this.transporter.sendMail({
                from: `"${this.fromName}" <${this.fromEmail}>`,
                to,
                subject,
                html,
                text: text || this.htmlToText(html),
            });
            this.logger.log(`Email sent to ${to}: ${subject}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send email to ${to}:`, error);
            return false;
        }
    }

    // Email Templates
    // Email Templates


    async sendVerificationEmail(to: string, name: string, token: string): Promise<boolean> {
        const verificationUrl = `${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/auth/verify-email?token=${token}`;

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verifica tu cuenta</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 16px 16px 0 0; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">MediTurnos</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Verificación de Cuenta</p>
            </td>
        </tr>
        <tr>
            <td style="background-color: #ffffff; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h2 style="color: #1a202c; margin: 0 0 20px 0; font-size: 24px;">¡Hola ${name}!</h2>
                <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Gracias por registrarte. Para activar tu cuenta, por favor confirma tu dirección de correo electrónico haciendo clic en el siguiente botón:
                </p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                        Verificar mi Cuenta
                    </a>
                </div>
                <p style="color: #667eea; font-size: 14px; word-break: break-all; margin: 10px 0 0 0; text-align: center;">
                    ${verificationUrl}
                </p>
            </td>
        </tr>
    </table>
</body>
</html>`;

        return this.sendEmail({
            to,
            subject: 'Verifica tu cuenta en MediTurnos',
            html,
            text: `Verifica tu cuenta entrando a: ${verificationUrl}`,
        });
    }

    async sendPasswordResetEmail(to: string, name: string, token: string): Promise<boolean> {
        const resetUrl = `${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/auth/reset-password?token=${token}`;

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Restablecer contraseña - MediTurnos</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 16px 16px 0 0; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">MediTurnos</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Sistema de Gestión de Clínicas</p>
            </td>
        </tr>
        <tr>
            <td style="background-color: #ffffff; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h2 style="color: #1a202c; margin: 0 0 20px 0; font-size: 24px;">Hola ${name}</h2>
                <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Recibimos una solicitud para restablecer la contraseña de tu cuenta. 
                    Haz clic en el botón de abajo para crear una nueva contraseña:
                </p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                        Restablecer Contraseña
                    </a>
                </div>
                <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                    Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:
                </p>
                <p style="color: #667eea; font-size: 14px; word-break: break-all; margin: 10px 0 0 0;">
                    ${resetUrl}
                </p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                <p style="color: #a0aec0; font-size: 12px; margin: 0;">
                    Este enlace expira en 1 hora. Si no solicitaste restablecer tu contraseña, puedes ignorar este email.
                </p>
            </td>
        </tr>
        <tr>
            <td style="padding: 20px; text-align: center;">
                <p style="color: #a0aec0; font-size: 12px; margin: 0;">
                    © ${new Date().getFullYear()} MediTurnos. Todos los derechos reservados.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>`;

        return this.sendEmail({
            to,
            subject: 'Restablecer contraseña - MediTurnos',
            html,
            text: `Hola ${name}, restablece tu contraseña visitando: ${resetUrl}`,
        });
    }

    async sendWelcomeEmail(to: string, name: string, clinicName: string): Promise<boolean> {
        const loginUrl = `${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/auth/login`;

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenido a MediTurnos</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 16px 16px 0 0; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎉 ¡Bienvenido a MediTurnos!</h1>
            </td>
        </tr>
        <tr>
            <td style="background-color: #ffffff; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h2 style="color: #1a202c; margin: 0 0 20px 0; font-size: 24px;">Hola ${name}</h2>
                <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Tu cuenta para <strong>${clinicName}</strong> ha sido verificada exitosamente. 
                    Ya puedes comenzar a usar todas las funcionalidades de MediTurnos.
                </p>
                
                <div style="background-color: #f7fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 16px;">🚀 Primeros pasos:</h3>
                    <ul style="color: #4a5568; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                        <li>Configura las áreas/especialidades de tu clínica</li>
                        <li>Agrega a tus doctores y secretarias</li>
                        <li>Define los horarios de atención</li>
                        <li>¡Comienza a agendar turnos!</li>
                    </ul>
                </div>

                <div style="background-color: #ebf8ff; border-left: 4px solid #4299e1; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                    <p style="color: #2b6cb0; font-size: 14px; margin: 0;">
                        <strong>💡 Tip:</strong> Tienes 14 días de prueba gratuita con todas las funcionalidades.
                    </p>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                        Ir al Dashboard
                    </a>
                </div>

                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                <p style="color: #a0aec0; font-size: 12px; margin: 0;">
                    ¿Necesitas ayuda? Responde a este email y te asistiremos.
                </p>
            </td>
        </tr>
        <tr>
            <td style="padding: 20px; text-align: center;">
                <p style="color: #a0aec0; font-size: 12px; margin: 0;">
                    © ${new Date().getFullYear()} MediTurnos. Todos los derechos reservados.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>`;

        return this.sendEmail({
            to,
            subject: `¡Bienvenido a MediTurnos, ${name}!`,
            html,
            text: `Hola ${name}, tu cuenta para ${clinicName} está lista. Ingresa en: ${loginUrl}`,
        });
    }

    private htmlToText(html: string): string {
        return html
            .replace(/<style[^>]*>.*?<\/style>/gs, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
}
