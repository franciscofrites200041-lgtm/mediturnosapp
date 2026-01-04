import Link from 'next/link';
import { HeartIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export const metadata = {
    title: 'Términos y Condiciones - MediTurnos',
    description: 'Términos y condiciones de uso del servicio MediTurnos',
};

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
            {/* Header */}
            <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <Link href="/" className="inline-flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                            <HeartIcon className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-display font-bold text-xl text-gray-900 dark:text-white">
                            MediTurnos
                        </span>
                    </Link>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 py-12">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 mb-8"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    Volver al inicio
                </Link>

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 md:p-12">
                    <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">
                        Términos y Condiciones
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">
                        Última actualización: Enero 2024
                    </p>

                    <div className="prose prose-gray dark:prose-invert max-w-none">
                        <h2>1. Aceptación de los Términos</h2>
                        <p>
                            Al acceder y utilizar MediTurnos (&quot;el Servicio&quot;), usted acepta estar sujeto a estos
                            Términos y Condiciones. Si no está de acuerdo con alguna parte de estos términos,
                            no podrá acceder al Servicio.
                        </p>

                        <h2>2. Descripción del Servicio</h2>
                        <p>
                            MediTurnos es una plataforma de software como servicio (SaaS) diseñada para la
                            gestión de clínicas y consultorios médicos. El Servicio incluye, pero no se limita a:
                        </p>
                        <ul>
                            <li>Gestión de turnos y citas médicas</li>
                            <li>Administración de pacientes e historias clínicas</li>
                            <li>Generación de recetas médicas digitales</li>
                            <li>Reportes y estadísticas</li>
                            <li>Integraciones con sistemas de mensajería</li>
                        </ul>

                        <h2>3. Cuentas de Usuario</h2>
                        <p>
                            Para utilizar el Servicio, debe crear una cuenta proporcionando información precisa
                            y completa. Usted es responsable de:
                        </p>
                        <ul>
                            <li>Mantener la confidencialidad de su contraseña</li>
                            <li>Todas las actividades que ocurran bajo su cuenta</li>
                            <li>Notificar inmediatamente cualquier uso no autorizado</li>
                        </ul>

                        <h2>4. Período de Prueba</h2>
                        <p>
                            MediTurnos ofrece un período de prueba gratuito de 14 días. Durante este período,
                            tendrá acceso a todas las funcionalidades del plan seleccionado. Al finalizar el
                            período de prueba, deberá suscribirse a un plan de pago para continuar usando el Servicio.
                        </p>

                        <h2>5. Precios y Pagos</h2>
                        <p>
                            Los precios de los planes de suscripción están publicados en nuestra página web y
                            pueden estar sujetos a cambios. Los pagos se procesarán mensualmente de forma
                            anticipada. No se realizarán reembolsos por períodos parciales no utilizados.
                        </p>

                        <h2>6. Protección de Datos Médicos</h2>
                        <p>
                            Nos comprometemos a proteger la información médica sensible de acuerdo con las
                            regulaciones aplicables. Los datos médicos son:
                        </p>
                        <ul>
                            <li>Encriptados en tránsito y en reposo</li>
                            <li>Accesibles solo por personal autorizado de la clínica</li>
                            <li>Respaldados regularmente</li>
                            <li>Procesados de acuerdo con las leyes de protección de datos</li>
                        </ul>

                        <h2>7. Uso Aceptable</h2>
                        <p>Usted acepta no utilizar el Servicio para:</p>
                        <ul>
                            <li>Violar leyes o regulaciones aplicables</li>
                            <li>Transmitir contenido ilegal o dañino</li>
                            <li>Intentar acceder sin autorización a sistemas o datos</li>
                            <li>Interferir con el funcionamiento del Servicio</li>
                        </ul>

                        <h2>8. Propiedad Intelectual</h2>
                        <p>
                            El Servicio y su contenido original, características y funcionalidad son propiedad
                            de MediTurnos y están protegidos por leyes de propiedad intelectual.
                        </p>

                        <h2>9. Limitación de Responsabilidad</h2>
                        <p>
                            MediTurnos se proporciona &quot;tal cual&quot; y &quot;según disponibilidad&quot;. No garantizamos
                            que el Servicio sea ininterrumpido o libre de errores. En ningún caso seremos
                            responsables por daños indirectos, incidentales o consecuentes.
                        </p>

                        <h2>10. Terminación</h2>
                        <p>
                            Podemos suspender o terminar su acceso al Servicio inmediatamente, sin previo aviso,
                            por cualquier razón, incluyendo el incumplimiento de estos Términos.
                        </p>

                        <h2>11. Cambios en los Términos</h2>
                        <p>
                            Nos reservamos el derecho de modificar estos Términos en cualquier momento. Los
                            cambios entrarán en vigencia inmediatamente después de su publicación. El uso
                            continuado del Servicio constituye la aceptación de los nuevos términos.
                        </p>

                        <h2>12. Contacto</h2>
                        <p>
                            Para preguntas sobre estos Términos y Condiciones, contáctenos en:
                        </p>
                        <p>
                            <strong>Email:</strong> legal@mediturnos.com<br />
                            <strong>Dirección:</strong> Buenos Aires, Argentina
                        </p>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-400 py-8 mt-12">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <p className="text-sm">
                        © {new Date().getFullYear()} MediTurnos. Todos los derechos reservados.
                    </p>
                </div>
            </footer>
        </div>
    );
}
