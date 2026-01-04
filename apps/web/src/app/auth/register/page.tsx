'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { EyeIcon, EyeSlashIcon, HeartIcon, BuildingOffice2Icon, EnvelopeIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';

interface RegisterFormData {
    clinicName: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    acceptTerms: boolean;
}

const PLANS = {
    BASIC: { name: 'Basic', price: '$9.990/mes', features: ['Hasta 3 médicos', 'Turnos ilimitados'] },
    PROFESSIONAL: { name: 'Professional', price: '$24.990/mes', features: ['Hasta 10 médicos', 'Bot de WhatsApp'] },
    ENTERPRISE: { name: 'Enterprise', price: '$49.990/mes', features: ['Médicos ilimitados', 'Múltiples sucursales'] },
};

export default function RegisterPage() {
    const searchParams = useSearchParams();
    const selectedPlan = (searchParams.get('plan') || 'PROFESSIONAL') as keyof typeof PLANS;
    const planInfo = PLANS[selectedPlan] || PLANS.PROFESSIONAL;

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [registrationComplete, setRegistrationComplete] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState('');

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<RegisterFormData>();

    const password = watch('password');

    const onSubmit = async (data: RegisterFormData) => {
        setIsLoading(true);
        try {
            await authApi.signup({
                email: data.email,
                password: data.password,
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                clinicName: data.clinicName,
                acceptTerms: data.acceptTerms,
                // Pass selected plan to backend (will start trial with that plan)
                plan: selectedPlan,
            } as any);
            setRegisteredEmail(data.email);
            setRegistrationComplete(true);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || 'Error al crear la cuenta');
        } finally {
            setIsLoading(false);
        }
    };

    // Show success message after registration
    if (registrationComplete) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 p-4">
                <div className="max-w-md w-full text-center">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 space-y-6">
                        <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                            <CheckCircleIcon className="w-10 h-10 text-green-600 dark:text-green-400" />
                        </div>
                        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
                            ¡Registro exitoso!
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Hemos enviado un email de verificación a:
                        </p>
                        <p className="text-lg font-semibold text-primary-600 dark:text-primary-400">
                            {registeredEmail}
                        </p>
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-left">
                            <div className="flex gap-3">
                                <EnvelopeIcon className="w-6 h-6 text-blue-500 shrink-0 mt-0.5" />
                                <div className="text-sm text-blue-800 dark:text-blue-200">
                                    <p className="font-medium mb-1">Próximos pasos:</p>
                                    <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-300">
                                        <li>Revisa tu bandeja de entrada</li>
                                        <li>Haz clic en el enlace de verificación</li>
                                        <li>¡Comienza a usar MediTurnos!</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500">
                            ¿No recibiste el email?{' '}
                            <button
                                onClick={async () => {
                                    try {
                                        await authApi.resendVerification(registeredEmail);
                                        toast.success('Email reenviado');
                                    } catch {
                                        toast.error('Error al reenviar el email');
                                    }
                                }}
                                className="text-primary-600 hover:underline font-medium"
                            >
                                Reenviar
                            </button>
                        </p>
                        <Link
                            href="/auth/login"
                            className="block w-full btn-secondary py-3"
                        >
                            Ir a Iniciar Sesión
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex">
            {/* Left side - Hero */}
            <div className="hidden lg:flex flex-1 bg-gradient-to-br from-secondary-500 via-primary-500 to-primary-600 relative overflow-hidden">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10">
                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="dots" width="30" height="30" patternUnits="userSpaceOnUse">
                                <circle cx="15" cy="15" r="2" fill="white" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#dots)" />
                    </svg>
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center p-12 text-white">
                    <div className="max-w-lg">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-sm mb-6">
                            <SparklesIcon className="w-4 h-4" />
                            <span>Plan {planInfo.name}</span>
                        </div>

                        <h2 className="text-4xl font-display font-bold mb-4">
                            Comienza tu prueba gratuita
                        </h2>
                        <p className="text-lg text-white/80 mb-2">
                            <span className="font-bold text-2xl">{planInfo.price}</span>
                            <span className="text-white/60 text-sm ml-2">(después de 14 días gratis)</span>
                        </p>
                        <p className="text-white/70 mb-8">
                            Sin tarjeta de crédito. Cancela cuando quieras.
                        </p>

                        {/* Selected Plan Features */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
                            <h3 className="font-semibold mb-4">Tu plan incluye:</h3>
                            <ul className="space-y-3">
                                {planInfo.features.map((feature) => (
                                    <li key={feature} className="flex items-center gap-3">
                                        <CheckCircleIcon className="w-5 h-5 text-green-300" />
                                        {feature}
                                    </li>
                                ))}
                                <li className="flex items-center gap-3">
                                    <CheckCircleIcon className="w-5 h-5 text-green-300" />
                                    Turnos ilimitados
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircleIcon className="w-5 h-5 text-green-300" />
                                    Historia clínica digital
                                </li>
                            </ul>
                        </div>

                        {/* Change plan link */}
                        <p className="text-sm text-white/60">
                            ¿Quieres otro plan?{' '}
                            <Link href="/#pricing" className="underline text-white/80 hover:text-white">
                                Ver todos los planes
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Decorative circles */}
                <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-white/10" />
                <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white/10" />
            </div>

            {/* Right side - Form */}
            <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
                <div className="w-full max-w-md space-y-6 py-8">
                    {/* Logo */}
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 shadow-lg shadow-primary-500/30 mb-6">
                            <HeartIcon className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">
                            Crea tu cuenta
                        </h1>
                        <p className="mt-2 text-gray-500 dark:text-gray-400">
                            Registra tu clínica y comienza hoy
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Clinic name */}
                        <div>
                            <label htmlFor="clinicName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Nombre de la clínica
                            </label>
                            <input
                                id="clinicName"
                                type="text"
                                {...register('clinicName', {
                                    required: 'El nombre de la clínica es requerido',
                                    minLength: { value: 2, message: 'Mínimo 2 caracteres' },
                                })}
                                className={`input ${errors.clinicName ? 'input-error' : ''}`}
                                placeholder="Clínica San Martín"
                            />
                            {errors.clinicName && (
                                <p className="mt-1 text-sm text-red-500">{errors.clinicName.message}</p>
                            )}
                        </div>

                        {/* Name fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Nombre
                                </label>
                                <input
                                    id="firstName"
                                    type="text"
                                    {...register('firstName', {
                                        required: 'El nombre es requerido',
                                    })}
                                    className={`input ${errors.firstName ? 'input-error' : ''}`}
                                    placeholder="Juan"
                                />
                                {errors.firstName && (
                                    <p className="mt-1 text-sm text-red-500">{errors.firstName.message}</p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Apellido
                                </label>
                                <input
                                    id="lastName"
                                    type="text"
                                    {...register('lastName', {
                                        required: 'El apellido es requerido',
                                    })}
                                    className={`input ${errors.lastName ? 'input-error' : ''}`}
                                    placeholder="Pérez"
                                />
                                {errors.lastName && (
                                    <p className="mt-1 text-sm text-red-500">{errors.lastName.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                {...register('email', {
                                    required: 'El email es requerido',
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: 'Email inválido',
                                    },
                                })}
                                className={`input ${errors.email ? 'input-error' : ''}`}
                                placeholder="tu@email.com"
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Phone */}
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Teléfono
                            </label>
                            <input
                                id="phone"
                                type="tel"
                                {...register('phone', {
                                    required: 'El teléfono es requerido',
                                })}
                                className={`input ${errors.phone ? 'input-error' : ''}`}
                                placeholder="+54 11 1234-5678"
                            />
                            {errors.phone && (
                                <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Contraseña
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    {...register('password', {
                                        required: 'La contraseña es requerida',
                                        minLength: {
                                            value: 8,
                                            message: 'La contraseña debe tener al menos 8 caracteres',
                                        },
                                        pattern: {
                                            value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                                            message: 'Debe incluir mayúsculas, minúsculas y números',
                                        },
                                    })}
                                    className={`input pr-12 ${errors.password ? 'input-error' : ''}`}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? (
                                        <EyeSlashIcon className="w-5 h-5" />
                                    ) : (
                                        <EyeIcon className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Confirm password */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Confirmar contraseña
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                {...register('confirmPassword', {
                                    required: 'Confirma tu contraseña',
                                    validate: (value) =>
                                        value === password || 'Las contraseñas no coinciden',
                                })}
                                className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
                                placeholder="••••••••"
                            />
                            {errors.confirmPassword && (
                                <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        {/* Terms */}
                        <div className="flex items-start">
                            <input
                                id="acceptTerms"
                                type="checkbox"
                                {...register('acceptTerms', {
                                    required: 'Debes aceptar los términos',
                                })}
                                className="w-4 h-4 mt-1 rounded border-gray-300 text-primary-500 focus:ring-primary-400"
                            />
                            <label htmlFor="acceptTerms" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                                Acepto los{' '}
                                <Link href="/terms" className="text-primary-600 hover:underline">
                                    Términos de Servicio
                                </Link>{' '}
                                y la{' '}
                                <Link href="/privacy" className="text-primary-600 hover:underline">
                                    Política de Privacidad
                                </Link>
                            </label>
                        </div>
                        {errors.acceptTerms && (
                            <p className="text-sm text-red-500">{errors.acceptTerms.message}</p>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full py-4"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creando cuenta...
                                </div>
                            ) : (
                                'Crear Cuenta'
                            )}
                        </button>
                    </form>

                    {/* Login link */}
                    <p className="text-center text-gray-500 dark:text-gray-400">
                        ¿Ya tienes una cuenta?{' '}
                        <Link href="/auth/login" className="text-primary-600 hover:underline font-medium">
                            Inicia sesión
                        </Link>
                    </p>
                </div>
            </div >
        </div >
    );
}
