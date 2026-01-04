import Link from 'next/link';
import { HeartIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export const metadata = {
    title: 'Política de Privacidad - MediTurnos',
    description: 'Política de privacidad y protección de datos de MediTurnos',
};

export default function PrivacyPage() {
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
                        Política de Privacidad
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">
                        Última actualización: Enero 2024
                    </p>

                    <div className="prose prose-gray dark:prose-invert max-w-none">
                        <h2>1. Introducción</h2>
                        <p>
                            En MediTurnos, nos tomamos muy en serio la privacidad de nuestros usuarios y
                            la protección de los datos médicos. Esta Política de Privacidad explica cómo
                            recopilamos, usamos, almacenamos y protegemos su información personal.
                        </p>

                        <h2>2. Información que Recopilamos</h2>
                        <h3>2.1 Información de la Cuenta</h3>
                        <ul>
                            <li>Nombre y apellido</li>
                            <li>Dirección de correo electrónico</li>
                            <li>Número de teléfono</li>
                            <li>Nombre de la clínica u organización</li>
                            <li>Información de facturación</li>
                        </ul>

                        <h3>2.2 Datos de Pacientes</h3>
                        <p>
                            Los datos de pacientes ingresados por clínicas incluyen:
                        </p>
                        <ul>
                            <li>Información de identificación (nombre, DNI, fecha de nacimiento)</li>
                            <li>Datos de contacto</li>
                            <li>Historia clínica y diagnósticos</li>
                            <li>Recetas y tratamientos</li>
                            <li>Turnos y citas</li>
                        </ul>

                        <h3>2.3 Datos de Uso</h3>
                        <ul>
                            <li>Registros de acceso al sistema</li>
                            <li>Acciones realizadas en la plataforma</li>
                            <li>Información del dispositivo y navegador</li>
                        </ul>

                        <h2>3. Cómo Usamos la Información</h2>
                        <p>Utilizamos la información recopilada para:</p>
                        <ul>
                            <li>Proporcionar y mantener el Servicio</li>
                            <li>Procesar pagos y gestionar suscripciones</li>
                            <li>Enviar notificaciones importantes sobre el servicio</li>
                            <li>Mejorar la funcionalidad y experiencia del usuario</li>
                            <li>Cumplir con obligaciones legales y regulatorias</li>
                            <li>Proteger contra fraude y acceso no autorizado</li>
                        </ul>

                        <h2>4. Protección de Datos Médicos</h2>
                        <p>
                            Entendemos la sensibilidad de los datos médicos. Por ello implementamos:
                        </p>
                        <ul>
                            <li><strong>Encriptación:</strong> Todos los datos se encriptan en tránsito (TLS 1.3) y en reposo (AES-256)</li>
                            <li><strong>Aislamiento de datos:</strong> Los datos de cada clínica están completamente separados</li>
                            <li><strong>Control de acceso:</strong> Sistema de roles y permisos granular</li>
                            <li><strong>Auditoría:</strong> Registro detallado de todas las acciones sobre datos sensibles</li>
                            <li><strong>Backups:</strong> Copias de seguridad diarias encriptadas</li>
                        </ul>

                        <h2>5. Compartición de Datos</h2>
                        <p>
                            <strong>No vendemos ni compartimos</strong> información personal o datos médicos con terceros, excepto:
                        </p>
                        <ul>
                            <li>Cuando sea requerido por ley o autoridades competentes</li>
                            <li>Con proveedores de servicios necesarios para operar (hosting, pagos), bajo estrictos acuerdos de confidencialidad</li>
                            <li>Con su consentimiento explícito</li>
                        </ul>

                        <h2>6. Retención de Datos</h2>
                        <p>
                            Mantenemos los datos mientras su cuenta esté activa o según sea necesario para
                            proporcionarle servicios. Los datos médicos se retienen según las regulaciones
                            aplicables (generalmente un mínimo de 10 años para historias clínicas).
                        </p>
                        <p>
                            Al solicitar la eliminación de su cuenta:
                        </p>
                        <ul>
                            <li>Los datos personales se eliminan en un plazo de 30 días</li>
                            <li>Los datos médicos se mantienen en formato anonimizado según requerimientos legales</li>
                            <li>Los registros de auditoría se mantienen por 5 años</li>
                        </ul>

                        <h2>7. Sus Derechos</h2>
                        <p>Usted tiene derecho a:</p>
                        <ul>
                            <li><strong>Acceso:</strong> Solicitar copia de sus datos personales</li>
                            <li><strong>Rectificación:</strong> Corregir datos inexactos</li>
                            <li><strong>Eliminación:</strong> Solicitar la eliminación de sus datos</li>
                            <li><strong>Portabilidad:</strong> Recibir sus datos en formato estructurado</li>
                            <li><strong>Oposición:</strong> Oponerse al procesamiento de sus datos</li>
                        </ul>
                        <p>
                            Para ejercer estos derechos, contáctenos en: privacidad@mediturnos.com
                        </p>

                        <h2>8. Cookies y Tecnologías Similares</h2>
                        <p>
                            Utilizamos cookies esenciales para el funcionamiento del servicio:
                        </p>
                        <ul>
                            <li>Cookies de sesión para mantener su inicio de sesión</li>
                            <li>Preferencias de usuario (tema oscuro, idioma)</li>
                            <li>Tokens de seguridad para prevenir CSRF</li>
                        </ul>
                        <p>
                            No utilizamos cookies de seguimiento o publicidad de terceros.
                        </p>

                        <h2>9. Seguridad</h2>
                        <p>
                            Implementamos medidas de seguridad técnicas y organizativas, incluyendo:
                        </p>
                        <ul>
                            <li>Autenticación de dos factores disponible</li>
                            <li>Monitoreo continuo de seguridad</li>
                            <li>Respuesta a incidentes 24/7</li>
                            <li>Pruebas de penetración periódicas</li>
                            <li>Capacitación en seguridad para nuestro equipo</li>
                        </ul>

                        <h2>10. Transferencias Internacionales</h2>
                        <p>
                            Los datos se almacenan en servidores ubicados en América del Sur. En caso de
                            transferencia internacional, nos aseguramos de que existan garantías adecuadas
                            de protección de datos.
                        </p>

                        <h2>11. Menores de Edad</h2>
                        <p>
                            El Servicio está dirigido a profesionales de la salud y administradores de
                            clínicas. No recopilamos intencionalmente información de menores de 18 años
                            como usuarios del sistema.
                        </p>

                        <h2>12. Cambios en esta Política</h2>
                        <p>
                            Podemos actualizar esta Política de Privacidad periódicamente. Le notificaremos
                            sobre cambios significativos por correo electrónico o mediante un aviso destacado
                            en nuestro Servicio.
                        </p>

                        <h2>13. Contacto</h2>
                        <p>
                            Para preguntas o inquietudes sobre esta Política de Privacidad:
                        </p>
                        <p>
                            <strong>Email:</strong> privacidad@mediturnos.com<br />
                            <strong>Responsable de Protección de Datos:</strong> dpo@mediturnos.com<br />
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
