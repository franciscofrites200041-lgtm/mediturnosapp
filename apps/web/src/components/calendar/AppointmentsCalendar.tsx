'use client';

import { useState, useMemo, useCallback } from 'react';
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    PlusIcon,
    FunnelIcon,
    CalendarDaysIcon,
    ClockIcon,
    UserIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import {
    format,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    addWeeks,
    subWeeks,
    parseISO,
    isToday,
} from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';

// Types
interface Appointment {
    id: string;
    scheduledAt: string;
    duration: number;
    status: 'SCHEDULED' | 'CONFIRMED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
    type: 'IN_PERSON' | 'VIDEO_CALL' | 'PHONE';
    reason?: string;
    patient: {
        id: string;
        firstName: string;
        lastName: string;
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

interface Doctor {
    id: string;
    firstName: string;
    lastName: string;
    specialty?: { name: string; color: string };
}

interface Area {
    id: string;
    name: string;
    color: string;
}

interface Props {
    appointments?: Appointment[];
    doctors?: Doctor[];
    areas?: Area[];
    onSlotClick?: (date: Date, doctorId?: string) => void;
    onAppointmentClick?: (appointment: Appointment) => void;
    onNewAppointment?: () => void;
    loading?: boolean;
}

type ViewMode = 'month' | 'week' | 'day';

// Status colors and labels
const statusConfig = {
    SCHEDULED: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', label: 'Programado' },
    CONFIRMED: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', label: 'Confirmado' },
    CHECKED_IN: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', label: 'En sala' },
    IN_PROGRESS: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', label: 'En consulta' },
    COMPLETED: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300', label: 'Completado' },
    CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', label: 'Cancelado' },
    NO_SHOW: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', label: 'No asistió' },
};

// Demo data for visualization
const demoAppointments: Appointment[] = [
    {
        id: '1',
        scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        duration: 30,
        status: 'CONFIRMED',
        type: 'IN_PERSON',
        reason: 'Control anual',
        patient: { id: 'p1', firstName: 'María', lastName: 'García' },
        doctor: { id: 'd1', firstName: 'Carlos', lastName: 'López' },
        area: { id: 'a1', name: 'Cardiología', color: '#ef4444' },
    },
    {
        id: '2',
        scheduledAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        duration: 45,
        status: 'SCHEDULED',
        type: 'IN_PERSON',
        reason: 'Primera consulta',
        patient: { id: 'p2', firstName: 'Juan', lastName: 'Pérez' },
        doctor: { id: 'd2', firstName: 'Ana', lastName: 'Martínez' },
        area: { id: 'a2', name: 'Pediatría', color: '#3b82f6' },
    },
    {
        id: '3',
        scheduledAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        duration: 30,
        status: 'CHECKED_IN',
        type: 'IN_PERSON',
        patient: { id: 'p3', firstName: 'Laura', lastName: 'Fernández' },
        doctor: { id: 'd1', firstName: 'Carlos', lastName: 'López' },
        area: { id: 'a1', name: 'Cardiología', color: '#ef4444' },
    },
];

const demoDoctors: Doctor[] = [
    { id: 'd1', firstName: 'Carlos', lastName: 'López', specialty: { name: 'Cardiología', color: '#ef4444' } },
    { id: 'd2', firstName: 'Ana', lastName: 'Martínez', specialty: { name: 'Pediatría', color: '#3b82f6' } },
    { id: 'd3', firstName: 'Roberto', lastName: 'Sánchez', specialty: { name: 'Traumatología', color: '#22c55e' } },
];

const demoAreas: Area[] = [
    { id: 'a1', name: 'Cardiología', color: '#ef4444' },
    { id: 'a2', name: 'Pediatría', color: '#3b82f6' },
    { id: 'a3', name: 'Traumatología', color: '#22c55e' },
    { id: 'a4', name: 'Dermatología', color: '#a855f7' },
];

export default function AppointmentsCalendar({
    appointments = demoAppointments,
    doctors = demoDoctors,
    areas = demoAreas,
    onSlotClick,
    onAppointmentClick,
    onNewAppointment,
    loading = false,
}: Props) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('week');
    const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
    const [selectedArea, setSelectedArea] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

    // Navigation handlers
    const handlePrevious = useCallback(() => {
        if (viewMode === 'month') {
            setCurrentDate(subMonths(currentDate, 1));
        } else {
            setCurrentDate(subWeeks(currentDate, 1));
        }
    }, [currentDate, viewMode]);

    const handleNext = useCallback(() => {
        if (viewMode === 'month') {
            setCurrentDate(addMonths(currentDate, 1));
        } else {
            setCurrentDate(addWeeks(currentDate, 1));
        }
    }, [currentDate, viewMode]);

    const handleToday = useCallback(() => {
        setCurrentDate(new Date());
    }, []);

    // Filter appointments
    const filteredAppointments = useMemo(() => {
        return appointments.filter((apt) => {
            if (selectedDoctor && apt.doctor.id !== selectedDoctor) return false;
            if (selectedArea && apt.area.id !== selectedArea) return false;
            return apt.status !== 'CANCELLED';
        });
    }, [appointments, selectedDoctor, selectedArea]);

    // Generate calendar days
    const calendarDays = useMemo(() => {
        if (viewMode === 'month') {
            const start = startOfWeek(startOfMonth(currentDate), { locale: es });
            const end = endOfWeek(endOfMonth(currentDate), { locale: es });
            return eachDayOfInterval({ start, end });
        } else {
            const start = startOfWeek(currentDate, { locale: es });
            const end = endOfWeek(currentDate, { locale: es });
            return eachDayOfInterval({ start, end });
        }
    }, [currentDate, viewMode]);

    // Get appointments for a specific day
    const getAppointmentsForDay = useCallback(
        (day: Date) => {
            return filteredAppointments.filter((apt) => isSameDay(parseISO(apt.scheduledAt), day));
        },
        [filteredAppointments]
    );

    // Time slots for week/day view
    const timeSlots = useMemo(() => {
        const slots = [];
        for (let hour = 8; hour <= 20; hour++) {
            slots.push(`${hour.toString().padStart(2, '0')}:00`);
            slots.push(`${hour.toString().padStart(2, '0')}:30`);
        }
        return slots;
    }, []);

    // Handle appointment click
    const handleAppointmentClick = (apt: Appointment) => {
        setSelectedAppointment(apt);
        onAppointmentClick?.(apt);
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-soft overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-slate-700">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Title and navigation */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrevious}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <ChevronLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </button>
                            <button
                                onClick={handleNext}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <ChevronRightIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </button>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white capitalize">
                            {format(currentDate, viewMode === 'month' ? 'MMMM yyyy' : "'Semana del' d 'de' MMMM", {
                                locale: es,
                            })}
                        </h2>
                        <button
                            onClick={handleToday}
                            className="px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                        >
                            Hoy
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        {/* View mode toggle */}
                        <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                            {(['week', 'month'] as ViewMode[]).map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    className={clsx(
                                        'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
                                        viewMode === mode
                                            ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                                    )}
                                >
                                    {mode === 'week' ? 'Semana' : 'Mes'}
                                </button>
                            ))}
                        </div>

                        {/* Filter button */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={clsx(
                                'flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors',
                                showFilters || selectedDoctor || selectedArea
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                                    : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                            )}
                        >
                            <FunnelIcon className="w-4 h-4" />
                            <span className="text-sm font-medium">Filtros</span>
                            {(selectedDoctor || selectedArea) && (
                                <span className="w-2 h-2 bg-primary-500 rounded-full" />
                            )}
                        </button>

                        {/* New appointment button */}
                        <button onClick={onNewAppointment} className="btn-primary flex items-center gap-2 py-2">
                            <PlusIcon className="w-5 h-5" />
                            <span className="hidden sm:inline">Nuevo Turno</span>
                        </button>
                    </div>
                </div>

                {/* Filters panel */}
                {showFilters && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl animate-slide-down">
                        <div className="grid sm:grid-cols-2 gap-4">
                            {/* Doctor filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Doctor
                                </label>
                                <select
                                    value={selectedDoctor || ''}
                                    onChange={(e) => setSelectedDoctor(e.target.value || null)}
                                    className="input"
                                >
                                    <option value="">Todos los doctores</option>
                                    {doctors.map((doc) => (
                                        <option key={doc.id} value={doc.id}>
                                            Dr. {doc.firstName} {doc.lastName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Area filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Especialidad
                                </label>
                                <select
                                    value={selectedArea || ''}
                                    onChange={(e) => setSelectedArea(e.target.value || null)}
                                    className="input"
                                >
                                    <option value="">Todas las especialidades</option>
                                    {areas.map((area) => (
                                        <option key={area.id} value={area.id}>
                                            {area.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Clear filters */}
                        {(selectedDoctor || selectedArea) && (
                            <button
                                onClick={() => {
                                    setSelectedDoctor(null);
                                    setSelectedArea(null);
                                }}
                                className="mt-3 text-sm text-primary-600 hover:underline"
                            >
                                Limpiar filtros
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
                    </div>
                ) : viewMode === 'month' ? (
                    /* Month View */
                    <div className="h-full">
                        {/* Day headers */}
                        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-slate-700">
                            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
                                <div
                                    key={day}
                                    className="py-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar days */}
                        <div className="grid grid-cols-7 h-[calc(100%-48px)]">
                            {calendarDays.map((day, index) => {
                                const dayAppointments = getAppointmentsForDay(day);
                                const isCurrentMonth = isSameMonth(day, currentDate);
                                const isCurrentDay = isToday(day);

                                return (
                                    <div
                                        key={index}
                                        onClick={() => onSlotClick?.(day)}
                                        className={clsx(
                                            'min-h-[100px] p-2 border-b border-r border-gray-100 dark:border-slate-700/50 cursor-pointer transition-colors',
                                            isCurrentMonth ? 'bg-white dark:bg-slate-800' : 'bg-gray-50 dark:bg-slate-800/50',
                                            'hover:bg-primary-50/50 dark:hover:bg-primary-900/10'
                                        )}
                                    >
                                        {/* Day number */}
                                        <div
                                            className={clsx(
                                                'inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium',
                                                isCurrentDay
                                                    ? 'bg-primary-500 text-white'
                                                    : isCurrentMonth
                                                        ? 'text-gray-900 dark:text-white'
                                                        : 'text-gray-400 dark:text-gray-600'
                                            )}
                                        >
                                            {format(day, 'd')}
                                        </div>

                                        {/* Appointments */}
                                        <div className="mt-1 space-y-1">
                                            {dayAppointments.slice(0, 3).map((apt) => (
                                                <div
                                                    key={apt.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAppointmentClick(apt);
                                                    }}
                                                    className={clsx(
                                                        'px-2 py-1 rounded text-xs font-medium truncate cursor-pointer transition-transform hover:scale-[1.02]',
                                                        statusConfig[apt.status].bg,
                                                        statusConfig[apt.status].text
                                                    )}
                                                    style={{ borderLeft: `3px solid ${apt.area.color}` }}
                                                >
                                                    {format(parseISO(apt.scheduledAt), 'HH:mm')} - {apt.patient.lastName}
                                                </div>
                                            ))}
                                            {dayAppointments.length > 3 && (
                                                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                    +{dayAppointments.length - 3} más
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    /* Week View */
                    <div className="flex h-full">
                        {/* Time column */}
                        <div className="w-16 flex-shrink-0 border-r border-gray-200 dark:border-slate-700">
                            <div className="h-12 border-b border-gray-200 dark:border-slate-700" />
                            {timeSlots.filter((_, i) => i % 2 === 0).map((time) => (
                                <div
                                    key={time}
                                    className="h-20 px-2 text-right text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-slate-700/50"
                                >
                                    {time}
                                </div>
                            ))}
                        </div>

                        {/* Days columns */}
                        <div className="flex-1 grid grid-cols-7">
                            {calendarDays.map((day, dayIndex) => {
                                const dayAppointments = getAppointmentsForDay(day);
                                const isCurrentDay = isToday(day);

                                return (
                                    <div
                                        key={dayIndex}
                                        className="border-r border-gray-200 dark:border-slate-700 last:border-r-0"
                                    >
                                        {/* Day header */}
                                        <div
                                            className={clsx(
                                                'h-12 flex flex-col items-center justify-center border-b border-gray-200 dark:border-slate-700 sticky top-0 z-10',
                                                isCurrentDay
                                                    ? 'bg-primary-50 dark:bg-primary-900/20'
                                                    : 'bg-white dark:bg-slate-800'
                                            )}
                                        >
                                            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                                                {format(day, 'EEE', { locale: es })}
                                            </span>
                                            <span
                                                className={clsx(
                                                    'text-lg font-semibold',
                                                    isCurrentDay ? 'text-primary-600' : 'text-gray-900 dark:text-white'
                                                )}
                                            >
                                                {format(day, 'd')}
                                            </span>
                                        </div>

                                        {/* Time slots */}
                                        <div className="relative">
                                            {timeSlots.filter((_, i) => i % 2 === 0).map((time) => (
                                                <div
                                                    key={time}
                                                    onClick={() => {
                                                        const [hour] = time.split(':').map(Number);
                                                        const slotDate = new Date(day);
                                                        slotDate.setHours(hour, 0, 0, 0);
                                                        onSlotClick?.(slotDate, selectedDoctor || undefined);
                                                    }}
                                                    className="h-20 border-b border-gray-100 dark:border-slate-700/50 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 cursor-pointer transition-colors"
                                                />
                                            ))}

                                            {/* Appointments overlay */}
                                            {dayAppointments.map((apt) => {
                                                const appointmentDate = parseISO(apt.scheduledAt);
                                                const hour = appointmentDate.getHours();
                                                const minutes = appointmentDate.getMinutes();
                                                const top = ((hour - 8) * 2 + minutes / 30) * 40; // 40px per half hour
                                                const height = (apt.duration / 30) * 40;

                                                return (
                                                    <div
                                                        key={apt.id}
                                                        onClick={() => handleAppointmentClick(apt)}
                                                        className={clsx(
                                                            'absolute left-1 right-1 rounded-lg p-2 cursor-pointer transition-all hover:shadow-md hover:z-10',
                                                            statusConfig[apt.status].bg,
                                                            statusConfig[apt.status].border,
                                                            'border-l-4'
                                                        )}
                                                        style={{
                                                            top: `${top}px`,
                                                            height: `${height}px`,
                                                            borderLeftColor: apt.area.color,
                                                        }}
                                                    >
                                                        <div className={clsx('text-xs font-semibold', statusConfig[apt.status].text)}>
                                                            {format(appointmentDate, 'HH:mm')}
                                                        </div>
                                                        <div className="text-xs text-gray-700 dark:text-gray-300 truncate">
                                                            {apt.patient.firstName} {apt.patient.lastName}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                            Dr. {apt.doctor.lastName}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Appointment Detail Modal */}
            {selectedAppointment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slide-up">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Detalle del Turno
                            </h3>
                            <button
                                onClick={() => setSelectedAppointment(null)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <XMarkIcon className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Status badge */}
                            <div className="flex items-center gap-2">
                                <span
                                    className={clsx(
                                        'badge',
                                        statusConfig[selectedAppointment.status].bg,
                                        statusConfig[selectedAppointment.status].text
                                    )}
                                >
                                    {statusConfig[selectedAppointment.status].label}
                                </span>
                                <span
                                    className="badge"
                                    style={{ backgroundColor: `${selectedAppointment.area.color}20`, color: selectedAppointment.area.color }}
                                >
                                    {selectedAppointment.area.name}
                                </span>
                            </div>

                            {/* Date and time */}
                            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                <CalendarDaysIcon className="w-5 h-5" />
                                <span>
                                    {format(parseISO(selectedAppointment.scheduledAt), "EEEE d 'de' MMMM, yyyy", {
                                        locale: es,
                                    })}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                <ClockIcon className="w-5 h-5" />
                                <span>
                                    {format(parseISO(selectedAppointment.scheduledAt), 'HH:mm')} -{' '}
                                    {selectedAppointment.duration} minutos
                                </span>
                            </div>

                            {/* Patient */}
                            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                <UserIcon className="w-5 h-5" />
                                <span>
                                    {selectedAppointment.patient.firstName} {selectedAppointment.patient.lastName}
                                </span>
                            </div>

                            {/* Doctor */}
                            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center">
                                    <span className="text-xs font-bold text-primary-600">Dr</span>
                                </div>
                                <span>
                                    Dr. {selectedAppointment.doctor.firstName} {selectedAppointment.doctor.lastName}
                                </span>
                            </div>

                            {/* Reason */}
                            {selectedAppointment.reason && (
                                <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Motivo</p>
                                    <p className="text-gray-900 dark:text-white">{selectedAppointment.reason}</p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setSelectedAppointment(null)}
                                    className="flex-1 btn-secondary"
                                >
                                    Cerrar
                                </button>
                                <button className="flex-1 btn-primary">Editar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                <div className="flex flex-wrap gap-4 justify-center">
                    {Object.entries(statusConfig)
                        .filter(([key]) => !['CANCELLED', 'NO_SHOW'].includes(key))
                        .map(([key, config]) => (
                            <div key={key} className="flex items-center gap-2">
                                <span className={clsx('w-3 h-3 rounded-full', config.bg, 'border', config.border)} />
                                <span className="text-xs text-gray-600 dark:text-gray-400">{config.label}</span>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
}
