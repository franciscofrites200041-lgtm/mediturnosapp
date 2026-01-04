'use client';

import { format, parseISO, isToday, isTomorrow, startOfDay, endOfDay, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import {
    CalendarDaysIcon,
    UsersIcon,
    UserGroupIcon,
    ClockIcon,
    ArrowRightIcon,
    PlusIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon as ClockOutlineIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore, useModalStore } from '@/lib/store';
import { useCalendarAppointments, usePatients, useDoctors, useAreas } from '@/lib/hooks';
import { Button, Badge, Card, Spinner, Avatar } from '@/components/ui/FormElements';
import AppointmentModal from '@/components/appointments/AppointmentModal';

interface Appointment {
    id: string;
    scheduledAt: string;
    duration: number;
    status: string;
    reason?: string;
    patient: {
        id: string;
        firstName: string;
        lastName: string;
        phone: string;
    };
    doctor: {
        id: string;
        firstName: string;
        lastName: string;
    };
    area: {
        id: string;
        name: string;
        color: string;
    };
}

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }> = {
    SCHEDULED: { label: 'Programado', variant: 'neutral' },
    CONFIRMED: { label: 'Confirmado', variant: 'info' },
    CHECKED_IN: { label: 'En Sala', variant: 'warning' },
    IN_PROGRESS: { label: 'En Consulta', variant: 'info' },
    COMPLETED: { label: 'Completado', variant: 'success' },
    CANCELLED: { label: 'Cancelado', variant: 'danger' },
    NO_SHOW: { label: 'No Asistió', variant: 'danger' },
};

export default function DashboardPage() {
    const { user, clinic } = useAuthStore();
    const { openAppointmentModal } = useModalStore();

    const today = new Date();
    const startDate = startOfDay(today).toISOString();
    const endDate = endOfDay(addDays(today, 7)).toISOString();

    // If user is a doctor, filter by their ID
    const doctorFilter = user?.role === 'DOCTOR' ? user.id : undefined;

    const { data: appointments = [], isLoading: loadingAppointments } = useCalendarAppointments(
        startDate,
        endDate,
        doctorFilter
    );
    const { data: patientsData } = usePatients({ limit: 1 });
    const { data: doctors = [] } = useDoctors();
    const { data: areas = [] } = useAreas();

    // Filter today's appointments
    const todayAppointments = appointments.filter((apt: Appointment) =>
        isToday(parseISO(apt.scheduledAt))
    );

    // Filter upcoming appointments (next 7 days, excluding today)
    const upcomingAppointments = appointments
        .filter((apt: Appointment) => !isToday(parseISO(apt.scheduledAt)) && parseISO(apt.scheduledAt) > today)
        .slice(0, 5);

    // Stats calculations
    const stats = {
        todayTotal: todayAppointments.length,
        todayCompleted: todayAppointments.filter((a: Appointment) => a.status === 'COMPLETED').length,
        todayPending: todayAppointments.filter((a: Appointment) => ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN'].includes(a.status)).length,
        totalPatients: patientsData?.total || 0,
        totalDoctors: doctors.length,
        totalAreas: areas.length,
    };

    // Greeting based on time of day
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900 dark:text-white">
                        {greeting}, {user?.firstName}! 👋
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {format(today, "EEEE d 'de' MMMM, yyyy", { locale: es })}
                    </p>
                </div>
                <Button
                    leftIcon={<PlusIcon className="w-5 h-5" />}
                    onClick={() => openAppointmentModal('create')}
                >
                    Nuevo Turno
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Turnos Hoy"
                    value={stats.todayTotal}
                    subtitle={`${stats.todayCompleted} completados, ${stats.todayPending} pendientes`}
                    icon={<CalendarDaysIcon className="w-6 h-6" />}
                    color="primary"
                    href="/dashboard/appointments"
                />
                <StatCard
                    title="Pacientes"
                    value={stats.totalPatients}
                    subtitle="Registrados en el sistema"
                    icon={<UsersIcon className="w-6 h-6" />}
                    color="green"
                    href="/dashboard/patients"
                />
                <StatCard
                    title="Doctores"
                    value={stats.totalDoctors}
                    subtitle="Médicos activos"
                    icon={<UserGroupIcon className="w-6 h-6" />}
                    color="purple"
                    href="/dashboard/doctors"
                />
                <StatCard
                    title="Especialidades"
                    value={stats.totalAreas}
                    subtitle="Áreas médicas"
                    icon={<ClockIcon className="w-6 h-6" />}
                    color="orange"
                    href="/dashboard/areas"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Today's Appointments */}
                <div className="lg:col-span-2">
                    <Card>
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Turnos de Hoy
                                </h2>
                                <Link
                                    href="/dashboard/appointments"
                                    className="text-sm text-primary-600 hover:underline flex items-center gap-1"
                                >
                                    Ver todos
                                    <ArrowRightIcon className="w-4 h-4" />
                                </Link>
                            </div>

                            {loadingAppointments ? (
                                <div className="flex justify-center py-8">
                                    <Spinner />
                                </div>
                            ) : todayAppointments.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <CalendarDaysIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p>No hay turnos programados para hoy</p>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="mt-3"
                                        onClick={() => openAppointmentModal('create')}
                                    >
                                        Agendar turno
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {todayAppointments.slice(0, 6).map((apt: Appointment) => (
                                        <AppointmentRow key={apt.id} appointment={apt} />
                                    ))}
                                    {todayAppointments.length > 6 && (
                                        <Link
                                            href="/dashboard/appointments"
                                            className="block text-center text-sm text-primary-600 hover:underline py-2"
                                        >
                                            Ver {todayAppointments.length - 6} turnos más
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Upcoming Appointments */}
                    <Card>
                        <div className="p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Próximos Días
                            </h2>
                            {upcomingAppointments.length === 0 ? (
                                <p className="text-center text-gray-500 py-4">
                                    No hay turnos programados
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {upcomingAppointments.map((apt: Appointment) => (
                                        <UpcomingRow key={apt.id} appointment={apt} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                        <div className="p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Acciones Rápidas
                            </h2>
                            <div className="grid grid-cols-2 gap-3">
                                <QuickAction
                                    label="Nuevo Turno"
                                    icon={<CalendarDaysIcon className="w-5 h-5" />}
                                    onClick={() => openAppointmentModal('create')}
                                />
                                <QuickAction
                                    label="Nuevo Paciente"
                                    icon={<UsersIcon className="w-5 h-5" />}
                                    href="/dashboard/patients"
                                />
                                <QuickAction
                                    label="Ver Agenda"
                                    icon={<ClockOutlineIcon className="w-5 h-5" />}
                                    href="/dashboard/appointments"
                                />
                                <QuickAction
                                    label="Configuración"
                                    icon={<UserGroupIcon className="w-5 h-5" />}
                                    href="/dashboard/settings"
                                />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Appointment Modal */}
            <AppointmentModal />
        </div>
    );
}

function StatCard({
    title,
    value,
    subtitle,
    icon,
    color,
    href,
}: {
    title: string;
    value: number;
    subtitle: string;
    icon: React.ReactNode;
    color: 'primary' | 'green' | 'purple' | 'orange';
    href: string;
}) {
    const colorClasses = {
        primary: 'bg-primary-500 text-white',
        green: 'bg-green-500 text-white',
        purple: 'bg-purple-500 text-white',
        orange: 'bg-orange-500 text-white',
    };

    return (
        <Link href={href}>
            <Card className="group hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                        <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]} shadow-lg`}
                        >
                            {icon}
                        </div>
                        <ArrowRightIcon className="w-5 h-5 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</p>
                    <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
                </div>
            </Card>
        </Link>
    );
}

function AppointmentRow({ appointment }: { appointment: Appointment }) {
    const status = statusConfig[appointment.status] || statusConfig.SCHEDULED;

    return (
        <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <div className="text-center min-w-[60px]">
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {format(parseISO(appointment.scheduledAt), 'HH:mm')}
                </p>
                <p className="text-xs text-gray-500">{appointment.duration} min</p>
            </div>

            <div
                className="w-1 h-12 rounded-full"
                style={{ backgroundColor: appointment.area.color }}
            />

            <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                    {appointment.patient.firstName} {appointment.patient.lastName}
                </p>
                <p className="text-sm text-gray-500 truncate">
                    Dr. {appointment.doctor.firstName} {appointment.doctor.lastName} • {appointment.area.name}
                </p>
            </div>

            <Badge variant={status.variant}>{status.label}</Badge>
        </div>
    );
}

function UpcomingRow({ appointment }: { appointment: Appointment }) {
    const date = parseISO(appointment.scheduledAt);
    const dateLabel = isTomorrow(date)
        ? 'Mañana'
        : format(date, "EEE d", { locale: es });

    return (
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <div className="text-center min-w-[50px]">
                <p className="text-xs text-gray-500 capitalize">{dateLabel}</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {format(date, 'HH:mm')}
                </p>
            </div>
            <div
                className="w-0.5 h-8 rounded-full"
                style={{ backgroundColor: appointment.area.color }}
            />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {appointment.patient.firstName} {appointment.patient.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{appointment.area.name}</p>
            </div>
        </div>
    );
}

function QuickAction({
    label,
    icon,
    href,
    onClick,
}: {
    label: string;
    icon: React.ReactNode;
    href?: string;
    onClick?: () => void;
}) {
    const content = (
        <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">
            <div className="text-primary-500">{icon}</div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</span>
        </div>
    );

    if (href) {
        return <Link href={href}>{content}</Link>;
    }

    return <button onClick={onClick}>{content}</button>;
}
