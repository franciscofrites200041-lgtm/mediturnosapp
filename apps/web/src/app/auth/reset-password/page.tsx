'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { EyeIcon, EyeSlashIcon, LockClosedIcon, HeartIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { authApi } from '@/lib/api';

interface ResetPasswordFormData {
    password: string;
    confirmPassword: string;
}

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState<'form' | 'success' | 'error'>('form');
    const [errorMessage, setErrorMessage] = useState('');

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<ResetPasswordFormData>();

    const password = watch('password');

    const onSubmit = async (data: ResetPasswordFormData) => {
        if (!token) {
            setStatus('error');
            setErrorMessage('Token de restablecimiento no proporcionado');
            return;
        }

        setIsLoading(true);
        try {
            await authApi.resetPassword(token, data.password);
            setStatus('success');
        } catch (error: unknown) {
            setStatus('error');
            const err = error as { response?: { data?: { message?: string } } };
            setErrorMessage(err.response?.data?.message || 'Error al restablecer la contraseña');
        } finally {
            setIsLoading(false);
        }
    };

    // No token provided
    if (!token) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 space-y-6 text-center">
                <div className="w-20 h-20 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <XCircleIcon className="w-10 h-10 text-red-600 dark:text-red-400" />
                </div>
                <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
                    Enlace inválido
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    El enlace de restablecimiento no es válido o ha expirado.
                </p>
                <Link
                    href="/auth/forgot-password"
                    className="block w-full btn-primary py-3"
                >
                    Solicitar nuevo enlace
                </Link>
            </div>
        );
    }

    // Success state
    if (status === 'success') {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 space-y-6 text-center">
                <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center animate-scale-in">
                    <CheckCircleIcon className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
                    ¡Contraseña restablecida!
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Tu contraseña ha sido cambiada exitosamente.
                    Ya puedes iniciar sesión con tu nueva contraseña.
                </p>
                <Link
                    href="/auth/login"
                    className="block w-full btn-primary py-3"
                >
                    Iniciar Sesión
                </Link>
            </div>
        );
    }

    // Error state
    if (status === 'error') {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 space-y-6 text-center">
                <div className="w-20 h-20 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <XCircleIcon className="w-10 h-10 text-red-600 dark:text-red-400" />
                </div>
                <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
                    Error
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    {errorMessage}
                </p>
                <div className="flex gap-3">
                    <Link
                        href="/auth/forgot-password"
                        className="flex-1 btn-secondary py-3"
                    >
                        Solicitar nuevo enlace
                    </Link>
                    <button
                        onClick={() => setStatus('form')}
                        className="flex-1 btn-primary py-3"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    // Form state
    return (
        <>
            {/* Logo */}
            <div className="text-center mb-8">
                <Link href="/" className="inline-flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
                        <HeartIcon className="w-6 h-6 text-white" />
                    </div>
                    <span className="font-display font-bold text-2xl text-gray-900 dark:text-white">
                        MediTurnos
                    </span>
                </Link>
                <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-2">
                    Crea tu nueva contraseña
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Ingresa una contraseña segura para tu cuenta
                </p>
            </div>

            {/* Form */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* New Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Nueva contraseña
                        </label>
                        <div className="relative">
                            <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                className={`input pl-12 pr-12 ${errors.password ? 'input-error' : ''}`}
                                {...register('password', {
                                    required: 'La contraseña es requerida',
                                    minLength: {
                                        value: 8,
                                        message: 'Mínimo 8 caracteres',
                                    },
                                    pattern: {
                                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                                        message: 'Debe incluir mayúsculas, minúsculas y números',
                                    },
                                })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Confirmar contraseña
                        </label>
                        <div className="relative">
                            <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="password"
                                placeholder="••••••••"
                                className={`input pl-12 ${errors.confirmPassword ? 'input-error' : ''}`}
                                {...register('confirmPassword', {
                                    required: 'Confirma tu contraseña',
                                    validate: (value) =>
                                        value === password || 'Las contraseñas no coinciden',
                                })}
                            />
                        </div>
                        {errors.confirmPassword && (
                            <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
                        )}
                    </div>

                    {/* Password requirements hint */}
                    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            La contraseña debe tener al menos 8 caracteres, incluir mayúsculas,
                            minúsculas y números.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary w-full py-4 text-lg"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Guardando...
                            </div>
                        ) : (
                            'Restablecer Contraseña'
                        )}
                    </button>
                </form>
            </div>
        </>
    );
}

function LoadingFallback() {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 space-y-6 text-center">
            <div className="w-20 h-20 mx-auto bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
                Cargando...
            </h1>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 p-4">
            <div className="w-full max-w-md">
                <Suspense fallback={<LoadingFallback />}>
                    <ResetPasswordContent />
                </Suspense>
            </div>
        </div>
    );
}
