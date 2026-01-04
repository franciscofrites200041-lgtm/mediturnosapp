'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useDoctors, useDoctorSchedules, useCreateSchedule, useDeleteSchedule } from '@/lib/hooks';
import { Button, Card, Select, Spinner, EmptyState } from '@/components/ui/FormElements';
import { ConfirmDialog } from '@/components/ui/Modal';
import Modal from '@/components/ui/Modal';

interface Schedule {
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    slotDuration: number;
    maxPatients: number;
    isActive: boolean;
}

const daysOfWeek = [
    { value: '1', label: 'Lunes' },
    { value: '2', label: 'Martes' },
    { value: '3', label: 'Miércoles' },
    { value: '4', label: 'Jueves' },
    { value: '5', label: 'Viernes' },
    { value: '6', label: 'Sábado' },
    { value: '0', label: 'Domingo' },
];

const dayNames: Record<number, string> = {
    0: 'Domingo',
    1: 'Lunes',
    2: 'Martes',
    3: 'Miércoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sábado',
};

export default function SchedulesPage() {
    const searchParams = useSearchParams();
    const initialDoctorId = searchParams.get('doctorId') || '';

    const [selectedDoctorId, setSelectedDoctorId] = useState(initialDoctorId);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteScheduleId, setDeleteScheduleId] = useState<string | null>(null);

    const { data: doctors = [] } = useDoctors();
    const { data: schedules = [], isLoading } = useDoctorSchedules(selectedDoctorId);
    const deleteMutation = useDeleteSchedule();

    useEffect(() => {
        if (initialDoctorId) {
            setSelectedDoctorId(initialDoctorId);
        } else if (doctors.length > 0 && !selectedDoctorId) {
            setSelectedDoctorId(doctors[0].id);
        }
    }, [initialDoctorId, doctors, selectedDoctorId]);

    const selectedDoctor = doctors.find((d: { id: string }) => d.id === selectedDoctorId);

    const handleDelete = async () => {
        if (deleteScheduleId) {
            await deleteMutation.mutateAsync({ id: deleteScheduleId, doctorId: selectedDoctorId });
            setDeleteScheduleId(null);
        }
    };

    // Group schedules by day
    const schedulesByDay = schedules.reduce((acc: Record<number, Schedule[]>, schedule: Schedule) => {
        if (!acc[schedule.dayOfWeek]) {
            acc[schedule.dayOfWeek] = [];
        }
        acc[schedule.dayOfWeek].push(schedule);
        return acc;
    }, {} as Record<number, Schedule[]>);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
                        Horarios de Atención
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Configura los horarios de cada doctor
                    </p>
                </div>
                <Button
                    leftIcon={<PlusIcon className="w-5 h-5" />}
                    onClick={() => setModalOpen(true)}
                    disabled={!selectedDoctorId}
                >
                    Agregar Horario
                </Button>
            </div>

            {/* Doctor selector */}
            <Card padding="sm">
                <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Doctor:
                    </label>
                    <select
                        value={selectedDoctorId}
                        onChange={(e) => setSelectedDoctorId(e.target.value)}
                        className="input py-2 w-auto min-w-[300px]"
                    >
                        <option value="">Seleccionar doctor</option>
                        {doctors.map((doctor: { id: string; firstName: string; lastName: string }) => (
                            <option key={doctor.id} value={doctor.id}>
                                Dr. {doctor.firstName} {doctor.lastName}
                            </option>
                        ))}
                    </select>
                    {selectedDoctor && (
                        <span className="text-sm text-gray-500">
                            {schedules.length} bloques configurados
                        </span>
                    )}
                </div>
            </Card>

            {/* Schedules */}
            {!selectedDoctorId ? (
                <Card>
                    <EmptyState
                        icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>}
                        title="Selecciona un doctor"
                        description="Elige un doctor para ver y configurar sus horarios de atención"
                    />
                </Card>
            ) : isLoading ? (
                <div className="flex justify-center py-12">
                    <Spinner size="lg" />
                </div>
            ) : schedules.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>}
                        title="Sin horarios configurados"
                        description={`Dr. ${selectedDoctor?.firstName} ${selectedDoctor?.lastName} no tiene horarios de atención configurados`}
                        action={
                            <Button leftIcon={<PlusIcon className="w-5 h-5" />} onClick={() => setModalOpen(true)}>
                                Agregar Horario
                            </Button>
                        }
                    />
                </Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {[1, 2, 3, 4, 5, 6, 0].map((day) => {
                        const daySchedules: Schedule[] = schedulesByDay[day] || [];
                        return (
                            <Card key={day} className={daySchedules.length === 0 ? 'opacity-50' : ''}>
                                <div className="p-4">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                                        {dayNames[day]}
                                    </h3>
                                    {daySchedules.length > 0 ? (
                                        <div className="space-y-2">
                                            {daySchedules.map((schedule) => (
                                                <div
                                                    key={schedule.id}
                                                    className="flex items-center justify-between p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800"
                                                >
                                                    <div>
                                                        <p className="font-medium text-primary-700 dark:text-primary-300">
                                                            {schedule.startTime} - {schedule.endTime}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {schedule.slotDuration} min/turno
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => setDeleteScheduleId(schedule.id)}
                                                        className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30"
                                                    >
                                                        <TrashIcon className="w-4 h-4 text-red-500" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400 text-center py-4">
                                            No atiende
                                        </p>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Schedule Modal */}
            <ScheduleModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                doctorId={selectedDoctorId}
            />

            {/* Delete confirmation */}
            <ConfirmDialog
                isOpen={!!deleteScheduleId}
                onClose={() => setDeleteScheduleId(null)}
                onConfirm={handleDelete}
                title="Eliminar Horario"
                message="¿Estás seguro de que deseas eliminar este bloque horario?"
                confirmText="Eliminar"
                variant="danger"
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}

interface ScheduleFormData {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    slotDuration: number;
}

function ScheduleModal({
    isOpen,
    onClose,
    doctorId,
}: {
    isOpen: boolean;
    onClose: () => void;
    doctorId: string;
}) {
    const createMutation = useCreateSchedule();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ScheduleFormData>({
        defaultValues: {
            dayOfWeek: '1',
            startTime: '09:00',
            endTime: '13:00',
            slotDuration: 30,
        },
    });

    const onSubmit = async (data: ScheduleFormData) => {
        await createMutation.mutateAsync({
            doctorId,
            dayOfWeek: parseInt(data.dayOfWeek),
            startTime: data.startTime,
            endTime: data.endTime,
            slotDuration: data.slotDuration,
        });
        onClose();
        reset();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Agregar Horario" size="md">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Select
                    label="Día de la semana"
                    required
                    options={daysOfWeek}
                    {...register('dayOfWeek', { required: true })}
                />

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Hora inicio
                        </label>
                        <input
                            type="time"
                            className="input"
                            {...register('startTime', { required: true })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Hora fin
                        </label>
                        <input
                            type="time"
                            className="input"
                            {...register('endTime', { required: true })}
                        />
                    </div>
                </div>

                <Select
                    label="Duración de cada turno"
                    options={[
                        { value: '15', label: '15 minutos' },
                        { value: '20', label: '20 minutos' },
                        { value: '30', label: '30 minutos' },
                        { value: '45', label: '45 minutos' },
                        { value: '60', label: '1 hora' },
                    ]}
                    {...register('slotDuration', { valueAsNumber: true })}
                />

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" isLoading={createMutation.isPending}>
                        Guardar
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
