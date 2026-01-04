'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { format, addMinutes, parse, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { MagnifyingGlassIcon, PlusIcon, CalendarIcon, ClockIcon, UserIcon, UserPlusIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Modal from '@/components/ui/Modal';
import { Input, Select, Textarea, Button } from '@/components/ui/FormElements';
import { useModalStore, useCalendarStore, useAuthStore } from '@/lib/store';
import { useCreateAppointment, useUpdateAppointment, useAppointment, useDoctors, useAreas, useSearchPatients, useAppointmentAvailability, useCreatePatient } from '@/lib/hooks';
import { CreateAppointmentData, CreatePatientData } from '@/lib/api';

interface AppointmentFormData {
    patientId: string;
    doctorId: string;
    areaId: string;
    date: string;
    time: string;
    duration: number;
    reason: string;
    notes: string;
}

export default function AppointmentModal() {
    const {
        appointmentModalOpen,
        appointmentModalMode,
        selectedAppointmentId,
        prefilledAppointmentData,
        closeAppointmentModal,
    } = useModalStore();

    const { selectedDate } = useCalendarStore();
    const { user } = useAuthStore();

    // Check if user can create patients (only CLINIC_ADMIN and SECRETARY)
    const canCreatePatient = user?.role === 'CLINIC_ADMIN' || user?.role === 'SECRETARY';

    // State for patient search
    const [patientSearch, setPatientSearch] = useState('');
    const [showPatientResults, setShowPatientResults] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<{ id: string; name: string; phone: string } | null>(null);

    // State for quick patient creation
    const [showQuickPatientForm, setShowQuickPatientForm] = useState(false);
    const [quickPatientData, setQuickPatientData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        documentNumber: '',
    });

    // Queries
    const { data: doctors = [] } = useDoctors();
    const { data: areas = [] } = useAreas();
    const { data: searchResults = [] } = useSearchPatients(patientSearch);
    const { data: existingAppointment } = useAppointment(selectedAppointmentId || '');

    // Form
    const {
        register,
        handleSubmit,
        control,
        watch,
        setValue,
        reset,
        formState: { errors },
    } = useForm<AppointmentFormData>({
        defaultValues: {
            patientId: '',
            doctorId: '',
            areaId: '',
            date: format(selectedDate, 'yyyy-MM-dd'),
            time: '',
            duration: 30,
            reason: '',
            notes: '',
        },
    });

    const watchDoctorId = watch('doctorId');
    const watchDate = watch('date');

    // Get availability for selected doctor and date
    const { data: availability } = useAppointmentAvailability(watchDoctorId, watchDate);

    // Mutations
    const createMutation = useCreateAppointment();
    const updateMutation = useUpdateAppointment();
    const createPatientMutation = useCreatePatient();

    // Reset form when modal opens/closes
    useEffect(() => {
        if (appointmentModalOpen) {
            if (appointmentModalMode === 'edit' && existingAppointment) {
                // Populate form with existing data
                const scheduledAt = new Date(existingAppointment.scheduledAt);
                setValue('patientId', existingAppointment.patientId);
                setValue('doctorId', existingAppointment.doctorId);
                setValue('areaId', existingAppointment.areaId);
                setValue('date', format(scheduledAt, 'yyyy-MM-dd'));
                setValue('time', format(scheduledAt, 'HH:mm'));
                setValue('duration', existingAppointment.duration);
                setValue('reason', existingAppointment.reason || '');
                setValue('notes', existingAppointment.notes || '');
                setSelectedPatient({
                    id: existingAppointment.patient.id,
                    name: `${existingAppointment.patient.firstName} ${existingAppointment.patient.lastName}`,
                    phone: existingAppointment.patient.phone,
                });
            } else if (prefilledAppointmentData) {
                // Prefill from calendar click
                if (prefilledAppointmentData.doctorId) {
                    setValue('doctorId', prefilledAppointmentData.doctorId);
                }
                if (prefilledAppointmentData.scheduledAt) {
                    const date = new Date(prefilledAppointmentData.scheduledAt);
                    setValue('date', format(date, 'yyyy-MM-dd'));
                    setValue('time', format(date, 'HH:mm'));
                }
            } else {
                // Default to selected date
                setValue('date', format(selectedDate, 'yyyy-MM-dd'));
            }
        } else {
            // Reset when closing
            reset();
            setSelectedPatient(null);
            setPatientSearch('');
            setShowQuickPatientForm(false);
            setQuickPatientData({ firstName: '', lastName: '', phone: '', documentNumber: '' });
        }
    }, [appointmentModalOpen, appointmentModalMode, existingAppointment, prefilledAppointmentData, selectedDate, setValue, reset]);

    // Auto-select area when doctor is selected
    useEffect(() => {
        if (watchDoctorId) {
            const doctor = doctors.find((d: { id: string }) => d.id === watchDoctorId);
            if (doctor?.specialtyId) {
                setValue('areaId', doctor.specialtyId);
            }
        }
    }, [watchDoctorId, doctors, setValue]);

    const onSubmit = async (data: AppointmentFormData) => {
        if (!selectedPatient) return;

        const scheduledAt = new Date(`${data.date}T${data.time}:00`);

        const payload: CreateAppointmentData = {
            patientId: selectedPatient.id,
            doctorId: data.doctorId,
            areaId: data.areaId,
            scheduledAt: scheduledAt.toISOString(),
            duration: data.duration,
            reason: data.reason || undefined,
            notes: data.notes || undefined,
        };

        if (appointmentModalMode === 'edit' && selectedAppointmentId) {
            await updateMutation.mutateAsync({ id: selectedAppointmentId, data: payload });
        } else {
            await createMutation.mutateAsync(payload);
        }

        closeAppointmentModal();
    };

    const handlePatientSelect = (patient: { id: string; firstName: string; lastName: string; phone: string }) => {
        setSelectedPatient({
            id: patient.id,
            name: `${patient.firstName} ${patient.lastName}`,
            phone: patient.phone,
        });
        setValue('patientId', patient.id);
        setPatientSearch('');
        setShowPatientResults(false);
    };

    // Handle quick patient creation
    const handleQuickPatientCreate = async () => {
        if (!quickPatientData.firstName || !quickPatientData.lastName || !quickPatientData.phone || !quickPatientData.documentNumber) {
            return;
        }

        try {
            const newPatient = await createPatientMutation.mutateAsync({
                firstName: quickPatientData.firstName,
                lastName: quickPatientData.lastName,
                phone: quickPatientData.phone,
                documentNumber: quickPatientData.documentNumber,
            });

            // Auto-select the newly created patient
            setSelectedPatient({
                id: newPatient.id,
                name: `${newPatient.firstName} ${newPatient.lastName}`,
                phone: newPatient.phone,
            });
            setValue('patientId', newPatient.id);

            // Reset quick patient form
            setShowQuickPatientForm(false);
            setQuickPatientData({ firstName: '', lastName: '', phone: '', documentNumber: '' });
        } catch (error) {
            console.error('Error creating patient:', error);
        }
    };

    const isLoading = createMutation.isPending || updateMutation.isPending || createPatientMutation.isPending;

    return (
        <Modal
            isOpen={appointmentModalOpen}
            onClose={closeAppointmentModal}
            title={appointmentModalMode === 'edit' ? 'Editar Turno' : 'Nuevo Turno'}
            size="lg"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Patient search */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Paciente <span className="text-red-500">*</span>
                    </label>

                    {selectedPatient ? (
                        <div className="flex items-center gap-3 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-200 dark:border-primary-800">
                            <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
                                {selectedPatient.name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')}
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-gray-900 dark:text-white">{selectedPatient.name}</p>
                                <p className="text-sm text-gray-500">{selectedPatient.phone}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedPatient(null);
                                    setValue('patientId', '');
                                }}
                                className="text-sm text-primary-600 hover:underline"
                            >
                                Cambiar
                            </button>
                        </div>
                    ) : showQuickPatientForm && canCreatePatient ? (
                        /* Quick Patient Creation Form */
                        <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <button
                                    type="button"
                                    onClick={() => setShowQuickPatientForm(false)}
                                    className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    <ArrowLeftIcon className="w-4 h-4 text-gray-500" />
                                </button>
                                <h4 className="font-medium text-gray-900 dark:text-white">Nuevo Paciente</h4>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    label="Nombre"
                                    required
                                    placeholder="Juan"
                                    value={quickPatientData.firstName}
                                    onChange={(e) => setQuickPatientData(prev => ({ ...prev, firstName: e.target.value }))}
                                />
                                <Input
                                    label="Apellido"
                                    required
                                    placeholder="Pérez"
                                    value={quickPatientData.lastName}
                                    onChange={(e) => setQuickPatientData(prev => ({ ...prev, lastName: e.target.value }))}
                                />
                                <Input
                                    label="Teléfono"
                                    required
                                    placeholder="+54 11 1234-5678"
                                    value={quickPatientData.phone}
                                    onChange={(e) => setQuickPatientData(prev => ({ ...prev, phone: e.target.value }))}
                                />
                                <Input
                                    label="DNI"
                                    required
                                    placeholder="12345678"
                                    value={quickPatientData.documentNumber}
                                    onChange={(e) => setQuickPatientData(prev => ({ ...prev, documentNumber: e.target.value }))}
                                />
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setShowQuickPatientForm(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleQuickPatientCreate}
                                    isLoading={createPatientMutation.isPending}
                                    disabled={!quickPatientData.firstName || !quickPatientData.lastName || !quickPatientData.phone || !quickPatientData.documentNumber}
                                >
                                    Crear y Seleccionar
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="relative">
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={patientSearch}
                                    onChange={(e) => {
                                        setPatientSearch(e.target.value);
                                        setShowPatientResults(true);
                                    }}
                                    onFocus={() => setShowPatientResults(true)}
                                    placeholder="Buscar paciente por nombre, DNI o teléfono..."
                                    className="input pl-10"
                                />
                            </div>

                            {/* Search results dropdown */}
                            {showPatientResults && patientSearch.length >= 2 && (
                                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 max-h-60 overflow-y-auto">
                                    {searchResults.length > 0 ? (
                                        <>
                                            {searchResults.map((patient: { id: string; firstName: string; lastName: string; phone: string; documentNumber: string }) => (
                                                <button
                                                    key={patient.id}
                                                    type="button"
                                                    onClick={() => handlePatientSelect(patient)}
                                                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-slate-700 text-left"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center text-sm font-medium">
                                                        {patient.firstName[0]}
                                                        {patient.lastName[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                            {patient.firstName} {patient.lastName}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            DNI: {patient.documentNumber} • {patient.phone}
                                                        </p>
                                                    </div>
                                                </button>
                                            ))}
                                            {canCreatePatient && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowPatientResults(false);
                                                        setShowQuickPatientForm(true);
                                                        // Pre-fill name if search looks like a name
                                                        const parts = patientSearch.trim().split(' ');
                                                        if (parts.length >= 1 && isNaN(Number(parts[0]))) {
                                                            setQuickPatientData(prev => ({
                                                                ...prev,
                                                                firstName: parts[0] || '',
                                                                lastName: parts.slice(1).join(' ') || '',
                                                            }));
                                                        }
                                                    }}
                                                    className="w-full flex items-center gap-3 p-3 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-left border-t border-gray-100 dark:border-slate-700"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                                                        <UserPlusIcon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                    </div>
                                                    <p className="font-medium text-primary-600 dark:text-primary-400">
                                                        + Crear nuevo paciente
                                                    </p>
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <div className="p-4 text-center">
                                            <p className="text-gray-500 mb-3">No se encontraron pacientes</p>
                                            {canCreatePatient && (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    leftIcon={<UserPlusIcon className="w-4 h-4" />}
                                                    onClick={() => {
                                                        setShowPatientResults(false);
                                                        setShowQuickPatientForm(true);
                                                        // Pre-fill name if search looks like a name
                                                        const parts = patientSearch.trim().split(' ');
                                                        if (parts.length >= 1 && isNaN(Number(parts[0]))) {
                                                            setQuickPatientData(prev => ({
                                                                ...prev,
                                                                firstName: parts[0] || '',
                                                                lastName: parts.slice(1).join(' ') || '',
                                                            }));
                                                        }
                                                    }}
                                                >
                                                    Crear nuevo paciente
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    {errors.patientId && <p className="text-sm text-red-500">Selecciona un paciente</p>}
                </div>

                {/* Doctor and Area */}
                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Doctor"
                        required
                        placeholder="Seleccionar doctor"
                        options={doctors.map((d: { id: string; firstName: string; lastName: string }) => ({
                            value: d.id,
                            label: `Dr. ${d.firstName} ${d.lastName}`,
                        }))}
                        error={errors.doctorId?.message}
                        {...register('doctorId', { required: 'Selecciona un doctor' })}
                    />

                    <Select
                        label="Especialidad"
                        required
                        placeholder="Seleccionar especialidad"
                        options={areas.map((a: { id: string; name: string }) => ({
                            value: a.id,
                            label: a.name,
                        }))}
                        error={errors.areaId?.message}
                        {...register('areaId', { required: 'Selecciona una especialidad' })}
                    />
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-3 gap-4">
                    <Input
                        type="date"
                        label="Fecha"
                        required
                        error={errors.date?.message}
                        {...register('date', { required: 'Ingresa la fecha' })}
                    />

                    <Select
                        label="Hora"
                        required
                        placeholder="Seleccionar hora"
                        options={
                            availability?.slots?.map((slot: { start: string; formatted: string }) => ({
                                value: slot.formatted,
                                label: slot.formatted,
                            })) || generateTimeSlots()
                        }
                        error={errors.time?.message}
                        {...register('time', { required: 'Selecciona la hora' })}
                    />

                    <Select
                        label="Duración"
                        options={[
                            { value: '15', label: '15 min' },
                            { value: '30', label: '30 min' },
                            { value: '45', label: '45 min' },
                            { value: '60', label: '1 hora' },
                        ]}
                        {...register('duration', { valueAsNumber: true })}
                    />
                </div>

                {/* Reason */}
                <Input
                    label="Motivo de consulta"
                    placeholder="Ej: Control de rutina, Dolor de cabeza, etc."
                    {...register('reason')}
                />

                {/* Notes */}
                <Textarea
                    label="Notas adicionales"
                    placeholder="Información relevante para el turno..."
                    {...register('notes')}
                />

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                    <Button type="button" variant="secondary" onClick={closeAppointmentModal}>
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        isLoading={isLoading}
                        disabled={!selectedPatient}
                    >
                        {appointmentModalMode === 'edit' ? 'Guardar Cambios' : 'Crear Turno'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

function generateTimeSlots() {
    const slots = [];
    for (let hour = 8; hour <= 20; hour++) {
        for (const min of ['00', '30']) {
            const time = `${hour.toString().padStart(2, '0')}:${min}`;
            slots.push({ value: time, label: time });
        }
    }
    return slots;
}
