'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { EnvelopeIcon, ArrowLeftIcon, CheckCircleIcon, HeartIcon } from '@heroicons/react/24/outline';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface ForgotPasswordFormData {
    email: string;
}

export default function ForgotPasswordPage() {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submittedEmail, setSubmittedEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordFormData>();

    const onSubmit = async (data: ForgotPasswordFormData) => {
        setIsLoading(true);
        try {
            await authApi.forgotPassword(data.email);
            setSubmittedEmail(data.email);
            setIsSubmitted(true);
        } catch (error: any) {
            // Don't show error to prevent email enumeration
            // Always show success message
            setSubmittedEmail(data.email);
            setIsSubmitted(true);
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 p-4">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-green-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
                            <CheckCircleIcon className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-2">
                            Revisa tu correo
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">
                            Te hemos enviado un enlace para restablecer tu contraseña a:
                        </p>
                        <p className="font-medium text-gray-900 dark:text-white mt-2">{submittedEmail}</p>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 space-y-6">
                        <div className="text-sm text-gray-500 dark:text-gray-400 space-y-3">
                            <p>
                                Si no ves el correo en tu bandeja de entrada, revisa la carpeta de spam.
                            </p>
                            <p>
                                El enlace expirará en 24 horas.
                            </p>
                        </div>

                        <Link
                            href="/auth/login"
                            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                        >
                            <ArrowLeftIcon className="w-5 h-5" />
                            Volver al login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 p-4">
            <div className="w-full max-w-md">
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
                        ¿Olvidaste tu contraseña?
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Ingresa tu email y te enviaremos un enlace para restablecerla
                    </p>
                </div>

                {/* Form */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    placeholder="tu@email.com"
                                    className="input pl-12"
                                    {...register('email', {
                                        required: 'El email es requerido',
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: 'Email inválido',
                                        },
                                    })}
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full py-4 text-lg"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Enviando...
                                </div>
                            ) : (
                                'Enviar enlace de recuperación'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link
                            href="/auth/login"
                            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors"
                        >
                            <ArrowLeftIcon className="w-4 h-4" />
                            Volver al login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
