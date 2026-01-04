'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { authApi } from '@/lib/api';

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Token de verificación no proporcionado');
            return;
        }

        const verifyEmail = async () => {
            try {
                const response = await authApi.verifyEmail(token);
                setStatus('success');
                setMessage(response.message || 'Email verificado exitosamente');
            } catch (error: unknown) {
                setStatus('error');
                const err = error as { response?: { data?: { message?: string } } };
                setMessage(err.response?.data?.message || 'Error al verificar el email');
            }
        };

        verifyEmail();
    }, [token]);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 space-y-6">
            {status === 'loading' && (
                <>
                    <div className="w-20 h-20 mx-auto bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
                        Verificando tu email...
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Por favor espera un momento
                    </p>
                </>
            )}

            {status === 'success' && (
                <>
                    <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center animate-scale-in">
                        <CheckCircleIcon className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </div>
                    <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
                        ¡Email verificado!
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        {message}
                    </p>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                        <p className="text-sm text-green-800 dark:text-green-200">
                            Tu cuenta está lista. Ya puedes iniciar sesión y comenzar a usar MediTurnos.
                        </p>
                    </div>
                    <Link
                        href="/auth/login"
                        className="flex items-center justify-center gap-2 w-full btn-primary py-3"
                    >
                        Iniciar Sesión
                        <ArrowRightIcon className="w-5 h-5" />
                    </Link>
                </>
            )}

            {status === 'error' && (
                <>
                    <div className="w-20 h-20 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                        <XCircleIcon className="w-10 h-10 text-red-600 dark:text-red-400" />
                    </div>
                    <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
                        Error de verificación
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        {message}
                    </p>
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                            El enlace puede haber expirado o ya fue utilizado.
                            Si necesitas un nuevo enlace de verificación, intenta registrarte nuevamente
                            o contacta a soporte.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            href="/auth/register"
                            className="flex-1 btn-secondary py-3"
                        >
                            Registrarse
                        </Link>
                        <Link
                            href="/auth/login"
                            className="flex-1 btn-primary py-3"
                        >
                            Iniciar Sesión
                        </Link>
                    </div>
                </>
            )}
        </div>
    );
}

function LoadingFallback() {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 space-y-6">
            <div className="w-20 h-20 mx-auto bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
                Cargando...
            </h1>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 p-4">
            <div className="max-w-md w-full text-center">
                <Suspense fallback={<LoadingFallback />}>
                    <VerifyEmailContent />
                </Suspense>
            </div>
        </div>
    );
}
