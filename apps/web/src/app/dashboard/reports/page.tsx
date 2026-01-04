'use client';

import { useState, useEffect } from 'react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    ChartBarIcon,
    CalendarDaysIcon,
    UsersIcon,
    ClockIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    CheckCircleIcon,
    XCircleIcon,
    CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { useAppointments, useDoctors, usePatients } from '@/lib/hooks';
import { Card, Spinner, Badge } from '@/components/ui/FormElements';

export default function ReportsPage() {
    const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month');
    const [forceShow, setForceShow] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setForceShow(true), 2000);
        return () => clearTimeout(timer);
    }, []);

    // Calculate date range
    const endDate = new Date();
    const startDate = dateRange === 'week'
        ? subDays(endDate, 7)
        : dateRange === 'month'
            ? startOfMonth(endDate)
            : subDays(endDate, 365);

    const { data: appointmentsData, isLoading: loadingAppointments } = useAppointments({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
    });

    const { data: doctorsData, isLoading: loadingDoctors } = useDoctors();
    const { data: patientsData, isLoading: loadingPatients } = usePatients({});

    // Safe data access
    const appointments = appointmentsData?.data || [];
    const doctors = Array.isArray(doctorsData) ? doctorsData : [];
    const patients = patientsData?.patients || [];

    // Estimate revenue (assuming average consultation price if not set)
    const AVERAGE_CONSULTATION_PRICE = 15000; // ARS

    // Calculate statistics
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter((a: any) => a.status === 'COMPLETED').length;
    const cancelledAppointments = appointments.filter((a: any) => a.status === 'CANCELLED').length;
    const noShowAppointments = appointments.filter((a: any) => a.status === 'NO_SHOW').length;
    const completionRate = totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0;

    // Revenue
    const estimatedRevenue = completedAppointments * AVERAGE_CONSULTATION_PRICE;

    // Appointments by doctor - robust mapping
    const appointmentsByDoctor = doctors.map((doctor: any) => {
        const doctorAppointments = appointments.filter((a: any) => a.doctor?.id === doctor.id);
        const completed = doctorAppointments.filter((a: any) => a.status === 'COMPLETED').length;
        return {
            ...doctor,
            total: doctorAppointments.length,
            completed,
            revenue: completed * AVERAGE_CONSULTATION_PRICE
        };
    }).sort((a: any, b: any) => b.total - a.total);

    // If queries fail, we show empty state instead of infinite loading
    // We consider loading only if data is undefined AND loading is true
    const isInitialLoading = !forceShow && (
        (loadingAppointments && !appointmentsData) ||
        (loadingDoctors && !doctorsData) ||
        (loadingPatients && !patientsData)
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
                        Reportes
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Estadísticas y análisis de tu clínica
                    </p>
                </div>

                {/* Date range selector */}
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-800 rounded-xl p-1">
                    {(['week', 'month', 'year'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setDateRange(range)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dateRange === range
                                ? 'bg-white dark:bg-slate-700 shadow-sm text-gray-900 dark:text-white'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {range === 'week' ? 'Semana' : range === 'month' ? 'Mes' : 'Año'}
                        </button>
                    ))}
                </div>
            </div>

            {isInitialLoading ? (
                <div className="flex justify-center py-12">
                    <Spinner size="lg" />
                </div>
            ) : (
                <>
                    {/* Stats Grid */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            title="Ingresos Estimados"
                            value={new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(estimatedRevenue)}
                            subtitle="~ $15.000 / consulta"
                            icon={<CurrencyDollarIcon className="w-6 h-6" />}
                            color="success"
                        />
                        <StatCard
                            title="Total Turnos"
                            value={totalAppointments}
                            icon={<CalendarDaysIcon className="w-6 h-6" />}
                            color="primary"
                        />
                        <StatCard
                            title="Completados"
                            value={completedAppointments}
                            subtitle={`${completionRate}% de asistencia`}
                            icon={<CheckCircleIcon className="w-6 h-6" />}
                            color="success"
                        />
                        <StatCard
                            title="Cancelados"
                            value={cancelledAppointments}
                            icon={<XCircleIcon className="w-6 h-6" />}
                            color="danger"
                        />
                        <StatCard
                            title="No Asistieron"
                            value={noShowAppointments}
                            icon={<UsersIcon className="w-6 h-6" />}
                            color="warning"
                        />
                    </div>

                    {/* Additional Stats */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Doctors Performance */}
                        <Card>
                            <div className="p-5">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                                    Rendimiento por Doctor
                                </h3>
                                <div className="space-y-4">
                                    {appointmentsByDoctor.slice(0, 5).map((doctor: { id: string; firstName: string; lastName: string; total: number; completed: number }) => (
                                        <div key={doctor.id} className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white font-semibold text-sm">
                                                {doctor.firstName[0]}{doctor.lastName[0]}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        Dr. {doctor.firstName} {doctor.lastName}
                                                    </span>
                                                    <span className="text-sm text-gray-500">
                                                        {doctor.total} turnos
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                                                    <div
                                                        className="bg-primary-500 h-2 rounded-full"
                                                        style={{ width: `${doctor.total > 0 ? (doctor.completed / doctor.total) * 100 : 0}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        {/* Quick Stats */}
                        <Card>
                            <div className="p-5">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                                    Resumen General
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <UsersIcon className="w-5 h-5 text-primary-500" />
                                            <span className="text-gray-600 dark:text-gray-400">Total Pacientes</span>
                                        </div>
                                        <span className="font-bold text-gray-900 dark:text-white text-xl">
                                            {patients.length}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <UsersIcon className="w-5 h-5 text-secondary-500" />
                                            <span className="text-gray-600 dark:text-gray-400">Total Doctores</span>
                                        </div>
                                        <span className="font-bold text-gray-900 dark:text-white text-xl">
                                            {doctors.length}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <ClockIcon className="w-5 h-5 text-amber-500" />
                                            <span className="text-gray-600 dark:text-gray-400">Promedio/Día</span>
                                        </div>
                                        <span className="font-bold text-gray-900 dark:text-white text-xl">
                                            {dateRange === 'week'
                                                ? Math.round(totalAppointments / 7)
                                                : dateRange === 'month'
                                                    ? Math.round(totalAppointments / 30)
                                                    : Math.round(totalAppointments / 365)
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}

function StatCard({
    title,
    value,
    subtitle,
    icon,
    color,
}: {
    title: string;
    value: number | string;
    subtitle?: string;
    icon: React.ReactNode;
    color: 'primary' | 'success' | 'danger' | 'warning';
}) {
    const colorClasses = {
        primary: 'from-primary-500 to-primary-600 shadow-primary-500/30',
        success: 'from-green-500 to-green-600 shadow-green-500/30',
        danger: 'from-red-500 to-red-600 shadow-red-500/30',
        warning: 'from-amber-500 to-amber-600 shadow-amber-500/30',
    };

    return (
        <Card className="overflow-hidden">
            <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} text-white shadow-lg`}>
                        {icon}
                    </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {value}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
                {subtitle && (
                    <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
                )}
            </div>
        </Card>
    );
}
