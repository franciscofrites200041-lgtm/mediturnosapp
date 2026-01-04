'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CalendarDaysIcon, UserGroupIcon, ClipboardDocumentListIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/lib/store';

export default function HomePage() {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuthStore();

    // Redirect to dashboard if already logged in
    useEffect(() => {
        if (isAuthenticated) {
            router.push('/dashboard');
        }
    }, [isAuthenticated, router]);

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <header className="relative overflow-hidden">
                {/* Background gradient orbs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-400/20 rounded-full blur-3xl" />
                    <div className="absolute top-40 -left-20 w-60 h-60 bg-secondary-400/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-1/3 w-40 h-40 bg-accent-400/10 rounded-full blur-2xl" />
                </div>

                {/* Navigation */}
                <nav className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                                <span className="text-white font-bold text-lg">M</span>
                            </div>
                            <span className="font-display font-bold text-2xl text-gray-900">
                                Medi<span className="text-primary-600">Turnos</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link href="/auth/login" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                                Iniciar Sesión
                            </Link>
                            <Link href="/auth/register" className="btn-primary">
                                Comenzar Gratis
                            </Link>
                        </div>
                    </div>
                </nav>

                {/* Hero Content */}
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="text-center max-w-4xl mx-auto">
                        <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
                            Gestiona tu clínica
                            <span className="block bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-500 bg-clip-text text-transparent">
                                de forma inteligente
                            </span>
                        </h1>
                        <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                            La plataforma todo-en-uno para clínicas médicas. Gestiona turnos, pacientes,
                            historias clínicas y recetas desde un solo lugar.
                        </p>
                        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/auth/register" className="btn-primary text-lg px-8 py-4">
                                Prueba gratis 14 días
                            </Link>
                            <Link href="#features" className="btn-secondary text-lg px-8 py-4">
                                Ver características
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Features Section */}
            <section id="features" className="py-20 bg-white/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="font-display text-4xl font-bold text-gray-900 mb-4">
                            Todo lo que necesitas
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Herramientas profesionales diseñadas para optimizar cada aspecto de tu práctica médica
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                icon: CalendarDaysIcon,
                                title: 'Agenda Inteligente',
                                description: 'Calendario visual con gestión de turnos por especialidad y doctor',
                                color: 'from-primary-500 to-primary-600',
                            },
                            {
                                icon: UserGroupIcon,
                                title: 'Gestión de Pacientes',
                                description: 'Historia clínica digital completa con datos encriptados',
                                color: 'from-secondary-500 to-secondary-600',
                            },
                            {
                                icon: ClipboardDocumentListIcon,
                                title: 'Recetas Digitales',
                                description: 'Genera y envía recetas directamente al WhatsApp del paciente',
                                color: 'from-accent-500 to-accent-600',
                            },
                            {
                                icon: ChartBarIcon,
                                title: 'Reportes y Métricas',
                                description: 'Dashboards con estadísticas de ocupación y rendimiento',
                                color: 'from-orange-500 to-orange-600',
                            },
                        ].map((feature) => (
                            <div key={feature.title} className="card p-6 hover:shadow-lg transition-shadow duration-300 group">
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                    <feature.icon className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="font-semibold text-lg text-gray-900 mb-2">{feature.title}</h3>
                                <p className="text-gray-600">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* WhatsApp Integration Section */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="glass-card p-10 rounded-3xl">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    Integración WhatsApp
                                </div>
                                <h2 className="font-display text-4xl font-bold text-gray-900 mb-6">
                                    Automatiza la comunicación con tus pacientes
                                </h2>
                                <p className="text-lg text-gray-600 mb-8">
                                    Conecta con n8n y nuestro bot de WhatsApp para que tus pacientes puedan
                                    reservar turnos, recibir recordatorios y obtener sus recetas automáticamente.
                                </p>
                                <ul className="space-y-4">
                                    {[
                                        'Reserva de turnos vía chat',
                                        'Recordatorios automáticos',
                                        'Envío de recetas post-consulta',
                                        'Confirmación de citas',
                                    ].map((item) => (
                                        <li key={item} className="flex items-center gap-3 text-gray-700">
                                            <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                                                <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="relative">
                                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-3xl p-8 shadow-2xl shadow-green-500/20">
                                    <div className="bg-white rounded-2xl p-4 space-y-3">
                                        <div className="flex gap-3">
                                            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-2 max-w-[80%]">
                                                <p className="text-sm text-gray-700">Hola! Quisiera un turno con el Dr. García para mañana</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 justify-end">
                                            <div className="bg-green-500 text-white rounded-2xl rounded-tr-sm px-4 py-2 max-w-[80%]">
                                                <p className="text-sm">¡Hola! Claro, tengo disponibles estos horarios para mañana con el Dr. García:</p>
                                                <p className="text-sm mt-2">🕐 09:00<br />🕐 10:30<br />🕐 14:00</p>
                                                <p className="text-sm mt-2">¿Cuál prefieres?</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-20 bg-white/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="font-display text-4xl font-bold text-gray-900 mb-4">
                            Planes diseñados para crecer contigo
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Elige el plan que mejor se adapte a tu clínica. Todos incluyen <strong>14 días gratis</strong> para probar.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {/* Basic Plan */}
                        <div className="card p-8 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-gray-200">
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Basic</h3>
                                <p className="text-gray-500 text-sm">Para clínicas pequeñas</p>
                            </div>
                            <div className="mb-6">
                                <span className="text-4xl font-bold text-gray-900">$9.990</span>
                                <span className="text-gray-500">/mes</span>
                            </div>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-2 text-gray-600">
                                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Hasta 3 médicos
                                </li>
                                <li className="flex items-center gap-2 text-gray-600">
                                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Turnos ilimitados
                                </li>
                                <li className="flex items-center gap-2 text-gray-600">
                                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Historia clínica digital
                                </li>
                                <li className="flex items-center gap-2 text-gray-400">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    <span className="line-through">Bot de WhatsApp</span>
                                </li>
                            </ul>
                            <Link href="/auth/register?plan=BASIC" className="btn-secondary w-full text-center block">
                                Comenzar Gratis
                            </Link>
                        </div>

                        {/* Professional Plan - Most Popular */}
                        <div className="card p-8 shadow-xl border-2 border-primary-500 relative scale-105 bg-gradient-to-br from-white to-primary-50/50">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-sm font-medium rounded-full">
                                Más Popular
                            </div>
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Professional</h3>
                                <p className="text-gray-500 text-sm">Para clínicas en crecimiento</p>
                            </div>
                            <div className="mb-6">
                                <span className="text-4xl font-bold text-gray-900">$24.990</span>
                                <span className="text-gray-500">/mes</span>
                            </div>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-2 text-gray-600">
                                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Hasta 10 médicos
                                </li>
                                <li className="flex items-center gap-2 text-gray-600">
                                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Turnos ilimitados
                                </li>
                                <li className="flex items-center gap-2 text-gray-600">
                                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Historia clínica digital
                                </li>
                                <li className="flex items-center gap-2 text-primary-600 font-medium">
                                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    ✨ Bot de WhatsApp
                                </li>
                            </ul>
                            <Link href="/auth/register?plan=PROFESSIONAL" className="btn-primary w-full text-center block">
                                Comenzar Gratis
                            </Link>
                        </div>

                        {/* Enterprise Plan */}
                        <div className="card p-8 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-gray-200">
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Enterprise</h3>
                                <p className="text-gray-500 text-sm">Para grandes instituciones</p>
                            </div>
                            <div className="mb-6">
                                <span className="text-4xl font-bold text-gray-900">$49.990</span>
                                <span className="text-gray-500">/mes</span>
                            </div>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-2 text-gray-600">
                                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Médicos ilimitados
                                </li>
                                <li className="flex items-center gap-2 text-gray-600">
                                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Múltiples sucursales
                                </li>
                                <li className="flex items-center gap-2 text-gray-600">
                                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Soporte prioritario
                                </li>
                                <li className="flex items-center gap-2 text-primary-600 font-medium">
                                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    ✨ Bot de WhatsApp
                                </li>
                            </ul>
                            <Link href="/auth/register?plan=ENTERPRISE" className="btn-secondary w-full text-center block">
                                Comenzar Gratis
                            </Link>
                        </div>
                    </div>

                    <p className="text-center text-gray-500 mt-8">
                        Prueba gratis por 14 días. Sin tarjeta de crédito requerida.
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-400 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold">M</span>
                            </div>
                            <span className="font-display font-bold text-xl text-white">MediTurnos</span>
                        </div>
                        <p className="text-sm">© 2026 MediTurnos. Todos los derechos reservados.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
