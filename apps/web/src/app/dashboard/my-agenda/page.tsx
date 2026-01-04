'use client';

import { useState } from 'react';
import { format, parseISO, isToday, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    CalendarDaysIcon,
    ClockIcon,
    UserIcon,
    DocumentTextIcon,
    CheckCircleIcon,
    PlayIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useMyAgenda, useUpdateAppointmentStatus } from '@/lib/hooks';
import { useAuthStore, useModalStore } from '@/lib/store';
import { Button, Badge, Card, EmptyState, Spinner, Avatar } from '@/components/ui/FormElements';
import clsx from 'clsx';

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
        documentNumber: string;
        birthDate?: string;
    };
    area: {
        id: string;
        name: string;
        color: string;
    };
    medicalRecord?: {
        id: string;
        status: string;
    };
}

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral'; icon: React.ReactNode }> = {
    SCHEDULED: { label: 'Programado', variant: 'neutral', icon: <ClockIcon className="w-4 h-4" /> },
    CONFIRMED: { label: 'Confirmado', variant: 'info', icon: <CheckCircleIcon className="w-4 h-4" /> },
    CHECKED_IN: { label: 'En Sala', variant: 'warning', icon: <UserIcon className="w-4 h-4" /> },
    IN_PROGRESS: { label: 'En Consulta', variant: 'info', icon: <PlayIcon className="w-4 h-4" /> },
    COMPLETED: { label: 'Completado', variant: 'success', icon: <CheckCircleIcon className="w-4 h-4" /> },
    CANCELLED: { label: 'Cancelado', variant: 'danger', icon: null },
    NO_SHOW: { label: 'No Asistió', variant: 'danger', icon: null },
};

export default function MyAgendaPage() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const { user } = useAuthStore();
    const { openMedicalRecordModal } = useModalStore();

    const { data: agenda = [], isLoading } = useMyAgenda(format(selectedDate, 'yyyy-MM-dd'));
    const updateStatusMutation = useUpdateAppointmentStatus();

    const navigate = (direction: 'prev' | 'next') => {
        setSelectedDate((prev) => (direction === 'prev' ? subDays(prev, 1) : addDays(prev, 1)));
    };

    const handleStatusChange = async (appointmentId: string, newStatus: string) => {
        await updateStatusMutation.mutateAsync({ id: appointmentId, status: newStatus });
    };

    // Group appointments by status
    const waitingAppointments = agenda.filter((apt: Appointment) => apt.status === 'CHECKED_IN');
    const inProgressAppointment = agenda.find((apt: Appointment) => apt.status === 'IN_PROGRESS');
    const upcomingAppointments = agenda.filter((apt: Appointment) => ['SCHEDULED', 'CONFIRMED'].includes(apt.status));
    const completedAppointments = agenda.filter((apt: Appointment) => apt.status === 'COMPLETED');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
                        Mi Agenda
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Buenos días, Dr. {user?.firstName}. Tienes {agenda.length} turnos para hoy.
                    </p>
                </div>

                {/* Date navigation */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('prev')}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        <ChevronLeftIcon className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                        <CalendarDaysIcon className="w-5 h-5 text-primary-500" />
                        <span className="font-medium text-gray-900 dark:text-white capitalize">
                            {isToday(selectedDate) ? 'Hoy' : format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
                        </span>
                    </div>

                    <button
                        onClick={() => navigate('next')}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        <ChevronRightIcon className="w-5 h-5" />
                    </button>

                    {!isToday(selectedDate) && (
                        <Button variant="secondary" size="sm" onClick={() => setSelectedDate(new Date())}>
                            Ir a Hoy
                        </Button>
                    )}
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Spinner size="lg" />
                </div>
            ) : agenda.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={<CalendarDaysIcon className="w-8 h-8" />}
                        title="No hay turnos"
                        description={`No tienes turnos programados para ${isToday(selectedDate) ? 'hoy' : format(selectedDate, "d 'de' MMMM", { locale: es })}`}
                    />
                </Card>
            ) : (
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main column - Current/Waiting */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Current consultation */}
                        {inProgressAppointment && (
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    En Consulta Ahora
                                </h2>
                                <CurrentPatientCard
                                    appointment={inProgressAppointment}
                                    onComplete={() => handleStatusChange(inProgressAppointment.id, 'COMPLETED')}
                                    onOpenRecord={() => openMedicalRecordModal(inProgressAppointment.patient.id, inProgressAppointment.id)}
                                />
                            </div>
                        )}

                        {/* Waiting room */}
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Sala de Espera ({waitingAppointments.length})
                            </h2>
                            {waitingAppointments.length > 0 ? (
                                <div className="space-y-3">
                                    {waitingAppointments.map((apt: Appointment) => (
                                        <WaitingPatientCard
                                            key={apt.id}
                                            appointment={apt}
                                            onStartConsultation={() => handleStatusChange(apt.id, 'IN_PROGRESS')}
                                            disabled={!!inProgressAppointment}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <Card padding="sm">
                                    <p className="text-center text-gray-500 py-4">No hay pacientes en espera</p>
                                </Card>
                            )}
                        </div>

                        {/* Completed */}
                        {completedAppointments.length > 0 && (
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    Completados Hoy ({completedAppointments.length})
                                </h2>
                                <div className="space-y-2">
                                    {completedAppointments.map((apt: Appointment) => (
                                        <CompletedCard key={apt.id} appointment={apt} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar - Upcoming */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Próximos ({upcomingAppointments.length})
                        </h2>
                        <Card padding="none">
                            <div className="divide-y divide-gray-100 dark:divide-slate-700">
                                {upcomingAppointments.length > 0 ? (
                                    upcomingAppointments.map((apt: Appointment) => (
                                        <UpcomingCard key={apt.id} appointment={apt} />
                                    ))
                                ) : (
                                    <p className="text-center text-gray-500 py-8">No hay más turnos programados</p>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}

function CurrentPatientCard({
    appointment,
    onComplete,
    onOpenRecord,
}: {
    appointment: Appointment;
    onComplete: () => void;
    onOpenRecord: () => void;
}) {
    const age = appointment.patient.birthDate
        ? Math.floor((new Date().getTime() - new Date(appointment.patient.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : null;

    return (
        <div className="card p-6 bg-gradient-to-br from-primary-500 to-primary-600 text-white relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
            <div className="absolute -right-5 -bottom-5 w-24 h-24 rounded-full bg-white/10" />

            <div className="relative">
                {/* Patient info */}
                <div className="flex items-start gap-4 mb-6">
                    <Avatar
                        name={`${appointment.patient.firstName} ${appointment.patient.lastName}`}
                        size="xl"
                        className="border-2 border-white/30"
                    />
                    <div>
                        <h3 className="text-2xl font-bold">
                            {appointment.patient.firstName} {appointment.patient.lastName}
                        </h3>
                        <p className="text-primary-100">
                            DNI: {appointment.patient.documentNumber}
                            {age && ` • ${age} años`}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="px-3 py-1 rounded-full bg-white/20 text-sm">
                                {appointment.area.name}
                            </span>
                            {appointment.reason && (
                                <span className="text-sm text-primary-100">
                                    {appointment.reason}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick info */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                        <p className="text-sm text-primary-100">Llegó a las</p>
                        <p className="text-lg font-bold">{format(parseISO(appointment.scheduledAt), 'HH:mm')}</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                        <p className="text-sm text-primary-100">Duración</p>
                        <p className="text-lg font-bold">{appointment.duration} min</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                        <p className="text-sm text-primary-100">Historia</p>
                        <p className="text-lg font-bold">
                            {appointment.medicalRecord ? 'Existe' : 'Nueva'}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        className="flex-1 bg-white text-primary-600 hover:bg-primary-50"
                        leftIcon={<DocumentTextIcon className="w-5 h-5" />}
                        onClick={onOpenRecord}
                    >
                        Historia Clínica
                    </Button>
                    <Link href={`/dashboard/patients/${appointment.patient.id}/prescriptions`} className="flex-1">
                        <Button variant="secondary" className="w-full bg-white/20 text-white border-white/30 hover:bg-white/30">
                            Recetas
                        </Button>
                    </Link>
                    <Button
                        className="bg-white text-green-600 hover:bg-green-50"
                        leftIcon={<CheckCircleIcon className="w-5 h-5" />}
                        onClick={onComplete}
                    >
                        Finalizar
                    </Button>
                </div>
            </div>
        </div>
    );
}

function WaitingPatientCard({
    appointment,
    onStartConsultation,
    disabled,
}: {
    appointment: Appointment;
    onStartConsultation: () => void;
    disabled: boolean;
}) {
    return (
        <Card className="group hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4 p-4">
                <Avatar name={`${appointment.patient.firstName} ${appointment.patient.lastName}`} size="lg" />

                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                        {appointment.patient.firstName} {appointment.patient.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">
                        {format(parseISO(appointment.scheduledAt), 'HH:mm')} • {appointment.area.name}
                    </p>
                    {appointment.reason && (
                        <p className="text-sm text-gray-400 truncate">{appointment.reason}</p>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <Badge variant="warning">En Sala</Badge>
                    <Button
                        size="sm"
                        onClick={onStartConsultation}
                        disabled={disabled}
                        leftIcon={<PlayIcon className="w-4 h-4" />}
                        className={clsx(disabled && 'opacity-50')}
                    >
                        Atender
                    </Button>
                </div>
            </div>
        </Card>
    );
}

function UpcomingCard({ appointment }: { appointment: Appointment }) {
    const status = statusConfig[appointment.status];

    return (
        <div className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <div className="text-center">
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {format(parseISO(appointment.scheduledAt), 'HH:mm')}
                </p>
            </div>
            <div
                className="w-1 h-10 rounded-full"
                style={{ backgroundColor: appointment.area.color }}
            />
            <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                    {appointment.patient.firstName} {appointment.patient.lastName}
                </p>
                <p className="text-sm text-gray-500 truncate">{appointment.area.name}</p>
            </div>
            <Badge variant={status.variant} size="sm">
                {status.label}
            </Badge>
        </div>
    );
}

function CompletedCard({ appointment }: { appointment: Appointment }) {
    return (
        <Card padding="sm" className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                        {appointment.patient.firstName} {appointment.patient.lastName}
                    </p>
                </div>
                <span className="text-sm text-gray-500">
                    {format(parseISO(appointment.scheduledAt), 'HH:mm')}
                </span>
            </div>
        </Card>
    );
}
