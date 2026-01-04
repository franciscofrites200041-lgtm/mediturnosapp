'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { EyeIcon, EyeSlashIcon, HeartIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

interface LoginFormData {
    email: string;
    password: string;
}

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>();

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        try {
            const response = await authApi.login(data.email, data.password);
            login(response.user, response.clinic, response.accessToken, response.refreshToken);
            toast.success(`¡Bienvenido, ${response.user.firstName}!`, { duration: 3000 });
            router.push('/dashboard');
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || 'Error al iniciar sesión');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left side - Form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md space-y-8">
                    {/* Logo */}
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/30 mb-6">
                            <HeartIcon className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">
                            Bienvenido
                        </h1>
                        <p className="mt-2 text-gray-500 dark:text-gray-400">
                            Ingresa a tu cuenta de MediTurnos
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Contraseña
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    {...register('password', {
                                        required: 'La contraseña es requerida',
                                        minLength: {
                                            value: 6,
                                            message: 'La contraseña debe tener al menos 6 caracteres',
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

                        {/* Forgot password */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember"
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-400"
                                />
                                <label htmlFor="remember" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                                    Recordarme
                                </label>
                            </div>
                            <Link
                                href="/auth/forgot-password"
                                className="text-sm text-primary-600 hover:text-primary-500"
                            >
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full py-4"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Iniciando sesión...
                                </div>
                            ) : (
                                'Iniciar Sesión'
                            )}
                        </button>
                    </form>

                    {/* Register link */}
                    <p className="text-center text-gray-500 dark:text-gray-400">
                        ¿No tienes una cuenta?{' '}
                        <Link href="/auth/register" className="text-primary-600 hover:underline font-medium">
                            Registra tu clínica
                        </Link>
                    </p>
                </div>
            </div>

            {/* Right side - Hero */}
            <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-500 relative overflow-hidden">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10">
                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center p-12 text-white">
                    <div className="max-w-lg">
                        <h2 className="text-4xl font-display font-bold mb-6">
                            Gestiona tu clínica de manera eficiente
                        </h2>
                        <p className="text-lg text-white/80 mb-8">
                            MediTurnos te ayuda a administrar turnos, pacientes, historia clínica
                            y mucho más, todo desde una plataforma moderna e intuitiva.
                        </p>

                        {/* Features */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span>Calendario de turnos en tiempo real</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span>Historia clínica digital segura</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span>Integración con WhatsApp</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span>Recetas digitales con firma</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Decorative circles */}
                <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-white/10" />
                <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/10" />
            </div>
        </div>
    );
}
