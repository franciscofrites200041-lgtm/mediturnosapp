'use client';

import { useState, useMemo } from 'react';
import {
    format,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    addDays,
    addWeeks,
    addMonths,
    subDays,
    subWeeks,
    subMonths,
    isSameDay,
    isSameMonth,
    isToday,
    parseISO,
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    PlusIcon,
    CalendarIcon,
    ListBulletIcon,
    ViewColumnsIcon,
    FunnelIcon,
} from '@heroicons/react/24/outline';
import { useCalendarAppointments, useDoctors, useAreas, useCancelAppointment, useUpdateAppointmentStatus } from '@/lib/hooks';
import { useCalendarStore, useModalStore, useAuthStore } from '@/lib/store';
import { Button, Badge, Select, Spinner } from '@/components/ui/FormElements';
import { ConfirmDialog } from '@/components/ui/Modal';
import AppointmentModal from '@/components/appointments/AppointmentModal';
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

const statusLabels: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }> = {
    SCHEDULED: { label: 'Programado', variant: 'neutral' },
    CONFIRMED: { label: 'Confirmado', variant: 'info' },
    CHECKED_IN: { label: 'En Sala', variant: 'warning' },
    IN_PROGRESS: { label: 'En Consulta', variant: 'info' },
    COMPLETED: { label: 'Completado', variant: 'success' },
    CANCELLED: { label: 'Cancelado', variant: 'danger' },
    NO_SHOW: { label: 'No Asistió', variant: 'danger' },
};

export default function AppointmentsPage() {
    const { user } = useAuthStore();
    const {
        selectedDate,
        view,
        selectedDoctorId,
        selectedAreaId,
        setSelectedDate,
        setView,
        setSelectedDoctorId,
        setSelectedAreaId,
    } = useCalendarStore();

    const { openAppointmentModal } = useModalStore();

    const [cancelAppointmentId, setCancelAppointmentId] = useState<string | null>(null);

    // If user is a doctor, always filter by their ID
    const isDoctor = user?.role === 'DOCTOR';
    const effectiveDoctorId = isDoctor ? user.id : selectedDoctorId;

    // Calculate date range based on view
    const { startDate, endDate } = useMemo(() => {
        switch (view) {
            case 'day':
                return { startDate: selectedDate, endDate: selectedDate };
            case 'week':
                return {
                    startDate: startOfWeek(selectedDate, { locale: es }),
                    endDate: endOfWeek(selectedDate, { locale: es }),
                };
            case 'month':
                return {
                    startDate: startOfMonth(selectedDate),
                    endDate: endOfMonth(selectedDate),
                };
        }
    }, [selectedDate, view]);

    const { data: appointments = [], isLoading } = useCalendarAppointments(
        startDate.toISOString(),
        endDate.toISOString(),
        effectiveDoctorId || undefined,
        selectedAreaId || undefined
    );

    const { data: doctors = [] } = useDoctors();
    const { data: areas = [] } = useAreas();
    const cancelMutation = useCancelAppointment();
    const updateStatusMutation = useUpdateAppointmentStatus();

    const navigate = (direction: 'prev' | 'next') => {
        const fn = direction === 'prev'
            ? view === 'day' ? subDays : view === 'week' ? subWeeks : subMonths
            : view === 'day' ? addDays : view === 'week' ? addWeeks : addMonths;
        setSelectedDate(fn(selectedDate, 1));
    };

    const goToToday = () => {
        setSelectedDate(new Date());
    };

    const handleCancelAppointment = async () => {
        if (cancelAppointmentId) {
            await cancelMutation.mutateAsync({ id: cancelAppointmentId, reason: 'Cancelado por secretaría' });
            setCancelAppointmentId(null);
        }
    };

    const handleStatusChange = async (appointmentId: string, newStatus: string) => {
        await updateStatusMutation.mutateAsync({ id: appointmentId, status: newStatus });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
                        Turnos
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Gestiona el calendario de turnos de la clínica
                    </p>
                </div>
                <Button
                    leftIcon={<PlusIcon className="w-5 h-5" />}
                    onClick={() => openAppointmentModal('create')}
                >
                    Nuevo Turno
                </Button>
            </div>

            {/* Calendar Controls */}
            <div className="card p-4">
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                    {/* Navigation */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => navigate('prev')}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                <ChevronLeftIcon className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => navigate('next')}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                <ChevronRightIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <button
                            onClick={goToToday}
                            className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700"
                        >
                            Hoy
                        </button>

                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                            {view === 'day'
                                ? format(selectedDate, "EEEE d 'de' MMMM", { locale: es })
                                : view === 'week'
                                    ? `${format(startDate, "d MMM", { locale: es })} - ${format(endDate, "d MMM yyyy", { locale: es })}`
                                    : format(selectedDate, 'MMMM yyyy', { locale: es })}
                        </h2>
                    </div>

                    {/* View toggle and filters */}
                    <div className="flex items-center gap-3">
                        {/* View toggle */}
                        <div className="flex items-center p-1 rounded-xl bg-gray-100 dark:bg-slate-700">
                            <button
                                onClick={() => setView('day')}
                                className={clsx(
                                    'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                                    view === 'day'
                                        ? 'bg-white dark:bg-slate-600 shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400'
                                )}
                            >
                                Día
                            </button>
                            <button
                                onClick={() => setView('week')}
                                className={clsx(
                                    'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                                    view === 'week'
                                        ? 'bg-white dark:bg-slate-600 shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400'
                                )}
                            >
                                Semana
                            </button>
                            <button
                                onClick={() => setView('month')}
                                className={clsx(
                                    'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                                    view === 'month'
                                        ? 'bg-white dark:bg-slate-600 shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400'
                                )}
                            >
                                Mes
                            </button>
                        </div>

                        {/* Filters - hide doctor filter for doctors */}
                        {!isDoctor && (
                            <select
                                value={selectedDoctorId || ''}
                                onChange={(e) => setSelectedDoctorId(e.target.value || null)}
                                className="input py-2 w-auto"
                            >
                                <option value="">Todos los doctores</option>
                                {doctors.map((doctor: { id: string; firstName: string; lastName: string }) => (
                                    <option key={doctor.id} value={doctor.id}>
                                        Dr. {doctor.firstName} {doctor.lastName}
                                    </option>
                                ))}
                            </select>
                        )}

                        <select
                            value={selectedAreaId || ''}
                            onChange={(e) => setSelectedAreaId(e.target.value || null)}
                            className="input py-2 w-auto"
                        >
                            <option value="">Todas las áreas</option>
                            {areas.map((area: { id: string; name: string }) => (
                                <option key={area.id} value={area.id}>
                                    {area.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Calendar Content */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Spinner size="lg" />
                </div>
            ) : view === 'day' ? (
                <DayView
                    appointments={appointments}
                    date={selectedDate}
                    onAppointmentClick={(apt) => openAppointmentModal('edit', apt.id)}
                    onStatusChange={handleStatusChange}
                    onCancel={(id) => setCancelAppointmentId(id)}
                />
            ) : view === 'week' ? (
                <WeekView
                    appointments={appointments}
                    startDate={startDate}
                    onAppointmentClick={(apt) => openAppointmentModal('edit', apt.id)}
                    onDayClick={(date) => {
                        setSelectedDate(date);
                        setView('day');
                    }}
                    onSlotClick={(date, time) => {
                        openAppointmentModal('create', undefined, { scheduledAt: new Date(`${format(date, 'yyyy-MM-dd')}T${time}`) });
                    }}
                />
            ) : (
                <MonthView
                    appointments={appointments}
                    selectedDate={selectedDate}
                    onDayClick={(date) => {
                        setSelectedDate(date);
                        setView('day');
                    }}
                />
            )}

            {/* Modals */}
            <AppointmentModal />

            <ConfirmDialog
                isOpen={!!cancelAppointmentId}
                onClose={() => setCancelAppointmentId(null)}
                onConfirm={handleCancelAppointment}
                title="Cancelar Turno"
                message="¿Estás seguro de que deseas cancelar este turno?"
                confirmText="Cancelar Turno"
                variant="danger"
                isLoading={cancelMutation.isPending}
            />
        </div>
    );
}

// Day View Component
function DayView({
    appointments,
    date,
    onAppointmentClick,
    onStatusChange,
    onCancel,
}: {
    appointments: Appointment[];
    date: Date;
    onAppointmentClick: (apt: Appointment) => void;
    onStatusChange: (id: string, status: string) => void;
    onCancel: (id: string) => void;
}) {
    const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM

    const getAppointmentsForHour = (hour: number) => {
        return appointments.filter((apt) => {
            const aptDate = parseISO(apt.scheduledAt);
            return isSameDay(aptDate, date) && aptDate.getHours() === hour;
        });
    };

    return (
        <div className="card divide-y divide-gray-100 dark:divide-slate-700">
            {hours.map((hour) => {
                const hourAppointments = getAppointmentsForHour(hour);
                return (
                    <div key={hour} className="flex min-h-[80px]">
                        {/* Time label */}
                        <div className="w-20 py-3 px-4 text-sm text-gray-500 dark:text-gray-400 font-medium border-r border-gray-100 dark:border-slate-700">
                            {`${hour.toString().padStart(2, '0')}:00`}
                        </div>

                        {/* Appointments */}
                        <div className="flex-1 p-2 space-y-2">
                            {hourAppointments.map((apt) => (
                                <AppointmentCard
                                    key={apt.id}
                                    appointment={apt}
                                    onClick={() => onAppointmentClick(apt)}
                                    onStatusChange={onStatusChange}
                                    onCancel={onCancel}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// Week View Component
function WeekView({
    appointments,
    startDate,
    onAppointmentClick,
    onDayClick,
    onSlotClick,
}: {
    appointments: Appointment[];
    startDate: Date;
    onAppointmentClick: (apt: Appointment) => void;
    onDayClick: (date: Date) => void;
    onSlotClick: (date: Date, time: string) => void;
}) {
    const days = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
    const hours = Array.from({ length: 13 }, (_, i) => i + 8);

    const getAppointmentsForSlot = (day: Date, hour: number) => {
        return appointments.filter((apt) => {
            const aptDate = parseISO(apt.scheduledAt);
            return isSameDay(aptDate, day) && aptDate.getHours() === hour;
        });
    };

    return (
        <div className="card overflow-x-auto">
            <table className="w-full min-w-[800px]">
                <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-700">
                        <th className="w-20 p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            Hora
                        </th>
                        {days.map((day) => (
                            <th
                                key={day.toISOString()}
                                className={clsx(
                                    'p-3 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50',
                                    isToday(day) && 'bg-primary-50 dark:bg-primary-900/20'
                                )}
                                onClick={() => onDayClick(day)}
                            >
                                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    {format(day, 'EEE', { locale: es })}
                                </div>
                                <div
                                    className={clsx(
                                        'text-lg font-semibold mt-1',
                                        isToday(day)
                                            ? 'text-primary-600 dark:text-primary-400'
                                            : 'text-gray-900 dark:text-white'
                                    )}
                                >
                                    {format(day, 'd')}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {hours.map((hour) => (
                        <tr key={hour}>
                            <td className="p-2 text-sm text-gray-500 dark:text-gray-400 font-medium border-r border-gray-100 dark:border-slate-700">
                                {`${hour.toString().padStart(2, '0')}:00`}
                            </td>
                            {days.map((day) => {
                                const slotAppointments = getAppointmentsForSlot(day, hour);
                                return (
                                    <td
                                        key={`${day.toISOString()}-${hour}`}
                                        className="p-1 border-r border-gray-100 dark:border-slate-700 align-top min-h-[60px] hover:bg-gray-50 dark:hover:bg-slate-700/30 cursor-pointer"
                                        onClick={() => {
                                            if (slotAppointments.length === 0) {
                                                onSlotClick(day, `${hour.toString().padStart(2, '0')}:00`);
                                            }
                                        }}
                                    >
                                        <div className="space-y-1">
                                            {slotAppointments.map((apt) => (
                                                <div
                                                    key={apt.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onAppointmentClick(apt);
                                                    }}
                                                    className="p-1.5 rounded-lg text-xs cursor-pointer transition-transform hover:scale-[1.02]"
                                                    style={{
                                                        backgroundColor: `${apt.area.color}20`,
                                                        borderLeft: `3px solid ${apt.area.color}`,
                                                    }}
                                                >
                                                    <div className="font-medium truncate">
                                                        {apt.patient.firstName} {apt.patient.lastName[0]}.
                                                    </div>
                                                    <div className="text-gray-500 truncate">
                                                        {format(parseISO(apt.scheduledAt), 'HH:mm')}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Month View Component
function MonthView({
    appointments,
    selectedDate,
    onDayClick,
}: {
    appointments: Appointment[];
    selectedDate: Date;
    onDayClick: (date: Date) => void;
}) {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const calendarStart = startOfWeek(monthStart, { locale: es });
    const calendarEnd = endOfWeek(monthEnd, { locale: es });

    const days: Date[] = [];
    let currentDay = calendarStart;
    while (currentDay <= calendarEnd) {
        days.push(currentDay);
        currentDay = addDays(currentDay, 1);
    }

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7));
    }

    const getAppointmentsForDay = (day: Date) => {
        return appointments.filter((apt) => isSameDay(parseISO(apt.scheduledAt), day));
    };

    return (
        <div className="card overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-7 border-b border-gray-200 dark:border-slate-700">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
                    <div key={day} className="p-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="divide-y divide-gray-100 dark:divide-slate-700">
                {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="grid grid-cols-7 divide-x divide-gray-100 dark:divide-slate-700">
                        {week.map((day) => {
                            const dayAppointments = getAppointmentsForDay(day);
                            const isCurrentMonth = isSameMonth(day, selectedDate);
                            return (
                                <div
                                    key={day.toISOString()}
                                    onClick={() => onDayClick(day)}
                                    className={clsx(
                                        'min-h-[100px] p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors',
                                        !isCurrentMonth && 'bg-gray-50 dark:bg-slate-800/50',
                                        isToday(day) && 'bg-primary-50 dark:bg-primary-900/20'
                                    )}
                                >
                                    <div
                                        className={clsx(
                                            'text-sm font-medium mb-1',
                                            isToday(day)
                                                ? 'text-primary-600 dark:text-primary-400'
                                                : isCurrentMonth
                                                    ? 'text-gray-900 dark:text-white'
                                                    : 'text-gray-400 dark:text-gray-500'
                                        )}
                                    >
                                        {format(day, 'd')}
                                    </div>
                                    <div className="space-y-1">
                                        {dayAppointments.slice(0, 3).map((apt) => (
                                            <div
                                                key={apt.id}
                                                className="text-xs p-1 rounded truncate"
                                                style={{
                                                    backgroundColor: `${apt.area.color}20`,
                                                    color: apt.area.color,
                                                }}
                                            >
                                                {format(parseISO(apt.scheduledAt), 'HH:mm')} {apt.patient.lastName}
                                            </div>
                                        ))}
                                        {dayAppointments.length > 3 && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                +{dayAppointments.length - 3} más
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}

// Appointment Card Component
function AppointmentCard({
    appointment,
    onClick,
    onStatusChange,
    onCancel,
}: {
    appointment: Appointment;
    onClick: () => void;
    onStatusChange: (id: string, status: string) => void;
    onCancel: (id: string) => void;
}) {
    const status = statusLabels[appointment.status] || statusLabels.SCHEDULED;

    return (
        <div
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors group"
            style={{
                borderLeft: `4px solid ${appointment.area.color}`,
            }}
            onClick={onClick}
        >
            {/* Time */}
            <div className="text-center">
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {format(parseISO(appointment.scheduledAt), 'HH:mm')}
                </p>
                <p className="text-xs text-gray-500">{appointment.duration} min</p>
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white">
                    {appointment.patient.firstName} {appointment.patient.lastName}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Dr. {appointment.doctor.firstName} {appointment.doctor.lastName} • {appointment.area.name}
                </p>
                {appointment.reason && (
                    <p className="text-xs text-gray-400 mt-1 truncate">{appointment.reason}</p>
                )}
            </div>

            {/* Status and actions */}
            <div className="flex items-center gap-2">
                <Badge variant={status.variant}>{status.label}</Badge>

                {/* Quick status buttons */}
                {appointment.status === 'SCHEDULED' && (
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(appointment.id, 'CHECKED_IN');
                        }}
                        className="opacity-0 group-hover:opacity-100"
                    >
                        Llegó
                    </Button>
                )}
                {appointment.status === 'CHECKED_IN' && (
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(appointment.id, 'IN_PROGRESS');
                        }}
                        className="opacity-0 group-hover:opacity-100"
                    >
                        Iniciar
                    </Button>
                )}
            </div>
        </div>
    );
}
