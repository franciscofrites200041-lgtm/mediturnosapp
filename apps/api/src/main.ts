import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);

    // Security middleware
    app.use(helmet());
    app.use(cookieParser());

    // CORS
    const corsOrigins = configService.get<string>('CORS_ORIGINS')?.split(',') || ['http://localhost:3000'];
    console.log('✅ CORS ORIGINS LOADED:', corsOrigins);

    app.enableCors({
        origin: corsOrigins,
        credentials: true,
    });

    // API Versioning
    app.setGlobalPrefix(configService.get<string>('API_PREFIX') || 'api/v1');
    app.enableVersioning({
        type: VersioningType.URI,
    });

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    // Swagger documentation
    const swaggerConfig = new DocumentBuilder()
        .setTitle('MediTurnos API')
        .setDescription('API para gestión de clínicas médicas multi-tenant')
        .setVersion('1.0')
        .addBearerAuth()
        .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header' }, 'api-key')
        .addTag('auth', 'Autenticación y autorización')
        .addTag('clinics', 'Gestión de clínicas')
        .addTag('users', 'Gestión de usuarios')
        .addTag('patients', 'Gestión de pacientes')
        .addTag('appointments', 'Gestión de turnos')
        .addTag('medical-records', 'Historia clínica')
        .addTag('prescriptions', 'Recetas médicas')
        .addTag('n8n', 'Integración con n8n/WhatsApp')
        .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);

    const port = configService.get<number>('PORT') || 3001;
    await app.listen(port);

    console.log(`🚀 MediTurnos API running on: http://localhost:${port}`);
    console.log(`📚 Swagger docs available at: http://localhost:${port}/docs`);
}

bootstrap();
