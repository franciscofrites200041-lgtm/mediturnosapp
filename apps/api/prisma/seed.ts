import { PrismaClient, UserRole, SubscriptionStatus, SubscriptionPlan, DocumentType, Gender, PatientSource, AppointmentStatus, AppointmentType, RecordStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seed de la base de datos...');

    // Limpiar datos existentes
    await prisma.webhookEvent.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.prescription.deleteMany();
    await prisma.medicalRecord.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.doctorSchedule.deleteMany();
    await prisma.patient.deleteMany();
    await prisma.user.deleteMany();
    await prisma.area.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.clinic.deleteMany();

    console.log('✓ Datos anteriores eliminados');

    // Crear clínica de demostración
    const clinic = await prisma.clinic.create({
        data: {
            name: 'Clínica San Martín',
            slug: 'clinica-san-martin',
            email: 'contacto@clinicasanmartin.com',
            phone: '+54 11 4555-1234',
            address: 'Av. Corrientes 1234, Piso 5',
            city: 'Buenos Aires',
            country: 'AR',
            timezone: 'America/Argentina/Buenos_Aires',
            subscriptionStatus: SubscriptionStatus.ACTIVE,
            subscriptionPlan: SubscriptionPlan.PROFESSIONAL,
            apiKey: 'mt_demo_' + generateRandomString(32),
            webhookUrl: 'https://n8n.example.com/webhook/mediturnos',
            webhookSecret: generateRandomString(32),
            isActive: true,
        },
    });

    console.log('✓ Clínica creada:', clinic.name);

    // Crear áreas/especialidades
    const areas = await Promise.all([
        prisma.area.create({
            data: {
                clinicId: clinic.id,
                name: 'Cardiología',
                description: 'Especialidad médica que se ocupa del corazón y sistema circulatorio',
                color: '#EF4444',
                defaultDuration: 30,
            },
        }),
        prisma.area.create({
            data: {
                clinicId: clinic.id,
                name: 'Pediatría',
                description: 'Atención médica para niños y adolescentes',
                color: '#3B82F6',
                defaultDuration: 20,
            },
        }),
        prisma.area.create({
            data: {
                clinicId: clinic.id,
                name: 'Traumatología',
                description: 'Especialidad en lesiones del sistema músculo-esquelético',
                color: '#22C55E',
                defaultDuration: 30,
            },
        }),
        prisma.area.create({
            data: {
                clinicId: clinic.id,
                name: 'Dermatología',
                description: 'Especialidad en enfermedades de la piel',
                color: '#F59E0B',
                defaultDuration: 20,
            },
        }),
        prisma.area.create({
            data: {
                clinicId: clinic.id,
                name: 'Clínica Médica',
                description: 'Medicina general y consultas de rutina',
                color: '#8B5CF6',
                defaultDuration: 30,
            },
        }),
    ]);

    console.log('✓ Áreas creadas:', areas.length);

    // Hash de contraseña común para demo
    const passwordHash = await argon2.hash('demo1234');

    // Crear Super Admin
    const superAdmin = await prisma.user.create({
        data: {
            email: 'admin@mediturnos.com',
            passwordHash,
            firstName: 'Admin',
            lastName: 'Sistema',
            role: UserRole.SUPER_ADMIN,
            isActive: true,
            emailVerified: true,
        },
    });

    console.log('✓ Super Admin creado:', superAdmin.email);

    // Crear Admin de clínica
    const clinicAdmin = await prisma.user.create({
        data: {
            email: 'admin@clinicasanmartin.com',
            passwordHash,
            firstName: 'Roberto',
            lastName: 'González',
            phone: '+54 11 5555-0001',
            role: UserRole.CLINIC_ADMIN,
            clinicId: clinic.id,
            isActive: true,
            emailVerified: true,
        },
    });

    console.log('✓ Admin de clínica creado:', clinicAdmin.email);

    // Crear Secretaria
    const secretary = await prisma.user.create({
        data: {
            email: 'maria@clinicasanmartin.com',
            passwordHash,
            firstName: 'María',
            lastName: 'Fernández',
            phone: '+54 11 5555-0002',
            role: UserRole.SECRETARY,
            clinicId: clinic.id,
            isActive: true,
            emailVerified: true,
        },
    });

    console.log('✓ Secretaria creada:', secretary.email);

    // Crear Doctores
    const doctors = await Promise.all([
        prisma.user.create({
            data: {
                email: 'dr.lopez@clinicasanmartin.com',
                passwordHash,
                firstName: 'Carlos',
                lastName: 'López',
                phone: '+54 11 5555-1001',
                role: UserRole.DOCTOR,
                clinicId: clinic.id,
                specialtyId: areas[0].id, // Cardiología
                licenseNumber: '123456',
                isActive: true,
                emailVerified: true,
            },
        }),
        prisma.user.create({
            data: {
                email: 'dra.martinez@clinicasanmartin.com',
                passwordHash,
                firstName: 'Ana',
                lastName: 'Martínez',
                phone: '+54 11 5555-1002',
                role: UserRole.DOCTOR,
                clinicId: clinic.id,
                specialtyId: areas[1].id, // Pediatría
                licenseNumber: '234567',
                isActive: true,
                emailVerified: true,
            },
        }),
        prisma.user.create({
            data: {
                email: 'dr.sanchez@clinicasanmartin.com',
                passwordHash,
                firstName: 'Miguel',
                lastName: 'Sánchez',
                phone: '+54 11 5555-1003',
                role: UserRole.DOCTOR,
                clinicId: clinic.id,
                specialtyId: areas[2].id, // Traumatología
                licenseNumber: '345678',
                isActive: true,
                emailVerified: true,
            },
        }),
    ]);

    console.log('✓ Doctores creados:', doctors.length);

    // Crear horarios para doctores
    const schedulePromises = [];
    for (const doctor of doctors) {
        // Lunes a Viernes, mañana
        for (let day = 1; day <= 5; day++) {
            schedulePromises.push(
                prisma.doctorSchedule.create({
                    data: {
                        doctorId: doctor.id,
                        clinicId: clinic.id,
                        dayOfWeek: day,
                        startTime: '09:00',
                        endTime: '13:00',
                        slotDuration: 30,
                        maxPatients: 1,
                    },
                })
            );
        }
        // Lunes, Miércoles, Viernes - tarde
        for (const day of [1, 3, 5]) {
            schedulePromises.push(
                prisma.doctorSchedule.create({
                    data: {
                        doctorId: doctor.id,
                        clinicId: clinic.id,
                        dayOfWeek: day,
                        startTime: '15:00',
                        endTime: '19:00',
                        slotDuration: 30,
                        maxPatients: 1,
                    },
                })
            );
        }
    }
    await Promise.all(schedulePromises);

    console.log('✓ Horarios creados');

    // Crear pacientes de ejemplo
    const patients = await Promise.all([
        prisma.patient.create({
            data: {
                clinicId: clinic.id,
                firstName: 'Juan',
                lastName: 'Pérez',
                email: 'juan.perez@email.com',
                phone: '+54 11 6666-1001',
                documentType: DocumentType.DNI,
                documentNumber: '30123456',
                birthDate: new Date('1985-05-15'),
                gender: Gender.MALE,
                address: 'Calle Florida 456',
                city: 'Buenos Aires',
                insuranceProvider: 'OSDE',
                insuranceNumber: '123456789',
                source: PatientSource.WALK_IN,
            },
        }),
        prisma.patient.create({
            data: {
                clinicId: clinic.id,
                firstName: 'Laura',
                lastName: 'García',
                email: 'laura.garcia@email.com',
                phone: '+54 11 6666-1002',
                documentType: DocumentType.DNI,
                documentNumber: '35987654',
                birthDate: new Date('1990-08-22'),
                gender: Gender.FEMALE,
                address: 'Av. Libertador 789',
                city: 'Buenos Aires',
                insuranceProvider: 'Swiss Medical',
                insuranceNumber: '987654321',
                source: PatientSource.WHATSAPP,
            },
        }),
        prisma.patient.create({
            data: {
                clinicId: clinic.id,
                firstName: 'Pedro',
                lastName: 'Rodríguez',
                email: 'pedro.rodriguez@email.com',
                phone: '+54 11 6666-1003',
                documentType: DocumentType.DNI,
                documentNumber: '28654321',
                birthDate: new Date('1978-03-10'),
                gender: Gender.MALE,
                address: 'Belgrano 123',
                city: 'Buenos Aires',
                source: PatientSource.PHONE,
            },
        }),
        prisma.patient.create({
            data: {
                clinicId: clinic.id,
                firstName: 'Sofía',
                lastName: 'Martínez',
                phone: '+54 11 6666-1004',
                documentType: DocumentType.DNI,
                documentNumber: '40111222',
                birthDate: new Date('2015-11-05'),
                gender: Gender.FEMALE,
                emergencyContact: 'Ana Martínez (madre)',
                emergencyPhone: '+54 11 5555-9999',
                insuranceProvider: 'OSDE',
                insuranceNumber: '222333444',
                source: PatientSource.WEB,
            },
        }),
        prisma.patient.create({
            data: {
                clinicId: clinic.id,
                firstName: 'Carlos',
                lastName: 'Fernández',
                email: 'carlos.fernandez@email.com',
                phone: '+54 11 6666-1005',
                documentType: DocumentType.DNI,
                documentNumber: '25333444',
                birthDate: new Date('1972-07-18'),
                gender: Gender.MALE,
                address: 'San Juan 567',
                city: 'Buenos Aires',
                insuranceProvider: 'Galeno',
                insuranceNumber: '555666777',
                source: PatientSource.REFERRAL,
            },
        }),
    ]);

    console.log('✓ Pacientes creados:', patients.length);

    // Crear turnos para hoy y los próximos días
    const today = new Date();
    const appointmentPromises = [];

    // Turnos de hoy
    const todaySlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '15:00', '15:30'];
    for (let i = 0; i < todaySlots.length; i++) {
        const [hours, minutes] = todaySlots[i].split(':').map(Number);
        const scheduledAt = new Date(today);
        scheduledAt.setHours(hours, minutes, 0, 0);

        const patient = patients[i % patients.length];
        const doctor = doctors[i % doctors.length];

        const statuses = [
            AppointmentStatus.COMPLETED,
            AppointmentStatus.COMPLETED,
            AppointmentStatus.COMPLETED,
            AppointmentStatus.IN_PROGRESS,
            AppointmentStatus.CHECKED_IN,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.SCHEDULED,
        ];

        appointmentPromises.push(
            prisma.appointment.create({
                data: {
                    clinicId: clinic.id,
                    patientId: patient.id,
                    doctorId: doctor.id,
                    areaId: doctor.specialtyId!,
                    scheduledAt,
                    duration: 30,
                    status: statuses[i],
                    type: AppointmentType.IN_PERSON,
                    reason: ['Control de rutina', 'Dolor de pecho', 'Fiebre', 'Lesión en rodilla', 'Consulta general'][i % 5],
                    source: PatientSource.WALK_IN,
                    createdById: secretary.id,
                },
            })
        );
    }

    // Turnos para mañana
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowSlots = ['09:00', '09:30', '10:00', '11:00', '15:00', '16:00'];
    for (let i = 0; i < tomorrowSlots.length; i++) {
        const [hours, minutes] = tomorrowSlots[i].split(':').map(Number);
        const scheduledAt = new Date(tomorrow);
        scheduledAt.setHours(hours, minutes, 0, 0);

        const patient = patients[(i + 2) % patients.length];
        const doctor = doctors[(i + 1) % doctors.length];

        appointmentPromises.push(
            prisma.appointment.create({
                data: {
                    clinicId: clinic.id,
                    patientId: patient.id,
                    doctorId: doctor.id,
                    areaId: doctor.specialtyId!,
                    scheduledAt,
                    duration: 30,
                    status: AppointmentStatus.CONFIRMED,
                    type: AppointmentType.IN_PERSON,
                    reason: 'Consulta programada',
                    source: PatientSource.WHATSAPP,
                    createdById: secretary.id,
                },
            })
        );
    }

    await Promise.all(appointmentPromises);

    console.log('✓ Turnos creados');

    // Crear algunos registros médicos para turnos completados
    const completedAppointments = await prisma.appointment.findMany({
        where: {
            clinicId: clinic.id,
            status: AppointmentStatus.COMPLETED,
        },
        include: {
            patient: true,
            doctor: true,
        },
    });

    for (const apt of completedAppointments) {
        await prisma.medicalRecord.create({
            data: {
                clinicId: clinic.id,
                patientId: apt.patientId,
                doctorId: apt.doctorId,
                appointmentId: apt.id,
                chiefComplaint: 'Paciente refiere síntomas de ' + apt.reason,
                physicalExam: 'Signos vitales normales. Sin hallazgos de importancia.',
                diagnosis: 'Diagnóstico realizado',
                treatmentPlan: 'Se indica tratamiento sintomático y control en 2 semanas.',
                vitalSigns: {
                    bloodPressure: '120/80',
                    heartRate: 72,
                    temperature: 36.5,
                    weight: 70,
                    height: 170,
                    oxygenSaturation: 98,
                },
                status: RecordStatus.COMPLETED,
                completedAt: apt.scheduledAt,
            },
        });
    }

    console.log('✓ Historias clínicas creadas');

    console.log('\n✅ Seed completado exitosamente!\n');
    console.log('📋 Credenciales de prueba:');
    console.log('─────────────────────────────────────');
    console.log('Super Admin:     admin@mediturnos.com');
    console.log('Admin Clínica:   admin@clinicasanmartin.com');
    console.log('Secretaria:      maria@clinicasanmartin.com');
    console.log('Doctor:          dr.lopez@clinicasanmartin.com');
    console.log('Contraseña:      demo1234');
    console.log('─────────────────────────────────────\n');
}

function generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

main()
    .catch((e) => {
        console.error('❌ Error en seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
