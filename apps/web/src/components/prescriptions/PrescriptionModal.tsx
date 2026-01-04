'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { PlusIcon, TrashIcon, PaperAirplaneIcon, PrinterIcon } from '@heroicons/react/24/outline';
import Modal from '@/components/ui/Modal';
import { Input, Textarea, Button, Select } from '@/components/ui/FormElements';
import { useModalStore, useAuthStore } from '@/lib/store';
import { useCreatePrescription, useSendPrescription, usePatient } from '@/lib/hooks';
import { CreatePrescriptionData, Medication } from '@/lib/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PrescriptionFormData {
    medications: {
        name: string;
        dosage: string;
        frequency: string;
        duration: string;
        notes: string;
    }[];
    instructions: string;
    diagnosis: string;
    validUntil: string;
}

const frequencyOptions = [
    { value: 'cada 4 horas', label: 'Cada 4 horas' },
    { value: 'cada 6 horas', label: 'Cada 6 horas' },
    { value: 'cada 8 horas', label: 'Cada 8 horas' },
    { value: 'cada 12 horas', label: 'Cada 12 horas' },
    { value: '1 vez al día', label: '1 vez al día' },
    { value: '2 veces al día', label: '2 veces al día' },
    { value: '3 veces al día', label: '3 veces al día' },
    { value: 'antes de dormir', label: 'Antes de dormir' },
    { value: 'en ayunas', label: 'En ayunas' },
    { value: 'con las comidas', label: 'Con las comidas' },
    { value: 'según necesidad', label: 'Según necesidad' },
];

export default function PrescriptionModal() {
    const {
        prescriptionModalOpen,
        selectedPrescriptionPatientId,
        closePrescriptionModal,
    } = useModalStore();

    const { user, clinic } = useAuthStore();
    const { data: patient } = usePatient(selectedPrescriptionPatientId || '');
    const createMutation = useCreatePrescription();
    const sendMutation = useSendPrescription();

    const [createdPrescriptionId, setCreatedPrescriptionId] = useState<string | null>(null);

    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<PrescriptionFormData>({
        defaultValues: {
            medications: [{ name: '', dosage: '', frequency: '', duration: '', notes: '' }],
            instructions: '',
            diagnosis: '',
            validUntil: '',
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'medications',
    });

    const onSubmit = async (data: PrescriptionFormData) => {
        if (!selectedPrescriptionPatientId) return;

        const medications: Medication[] = data.medications
            .filter((m) => m.name)
            .map((m) => ({
                name: m.name,
                dosage: m.dosage,
                frequency: m.frequency,
                duration: m.duration || undefined,
                notes: m.notes || undefined,
            }));

        const payload: CreatePrescriptionData = {
            patientId: selectedPrescriptionPatientId,
            medications,
            instructions: data.instructions || undefined,
            diagnosis: data.diagnosis || undefined,
            validUntil: data.validUntil || undefined,
        };

        const result = await createMutation.mutateAsync(payload);
        setCreatedPrescriptionId(result.id);
    };

    const handleSend = async () => {
        if (createdPrescriptionId) {
            await sendMutation.mutateAsync(createdPrescriptionId);
            closePrescriptionModal();
            reset();
            setCreatedPrescriptionId(null);
        }
    };

    const handleClose = () => {
        closePrescriptionModal();
        reset();
        setCreatedPrescriptionId(null);
    };

    const isLoading = createMutation.isPending || sendMutation.isPending;

    // Show preview after creation
    if (createdPrescriptionId) {
        return (
            <Modal isOpen={prescriptionModalOpen} onClose={handleClose} title="Receta Creada" size="lg">
                <PrescriptionPreview
                    patient={patient}
                    doctor={user}
                    clinic={clinic}
                    medications={fields.map((f, i) => ({
                        name: f.name,
                        dosage: f.dosage,
                        frequency: f.frequency,
                        duration: f.duration,
                    }))}
                />

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-slate-700">
                    <Button variant="secondary" leftIcon={<PrinterIcon className="w-5 h-5" />}>
                        Imprimir
                    </Button>
                    <Button
                        onClick={handleSend}
                        isLoading={sendMutation.isPending}
                        leftIcon={<PaperAirplaneIcon className="w-5 h-5" />}
                    >
                        Enviar por WhatsApp
                    </Button>
                </div>
            </Modal>
        );
    }

    return (
        <Modal isOpen={prescriptionModalOpen} onClose={handleClose} title="Nueva Receta" size="xl">
            {/* Patient header */}
            {patient && (
                <div className="flex items-center gap-4 p-4 mb-6 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white font-bold">
                        {patient.firstName[0]}
                        {patient.lastName[0]}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                            {patient.firstName} {patient.lastName}
                        </h3>
                        <p className="text-sm text-gray-500">DNI: {patient.documentNumber}</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Diagnosis */}
                <Input
                    label="Diagnóstico"
                    placeholder="Diagnóstico relacionado a la prescripción..."
                    {...register('diagnosis')}
                />

                {/* Medications */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Medicamentos
                        </label>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            leftIcon={<PlusIcon className="w-4 h-4" />}
                            onClick={() => append({ name: '', dosage: '', frequency: '', duration: '', notes: '' })}
                        >
                            Agregar
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {fields.map((field, index) => (
                            <div
                                key={field.id}
                                className="p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-medium text-gray-500">
                                        Medicamento {index + 1}
                                    </span>
                                    {fields.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => remove(index)}
                                            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                    <Input
                                        placeholder="Nombre del medicamento"
                                        {...register(`medications.${index}.name`, { required: index === 0 })}
                                    />
                                    <Input
                                        placeholder="Dosis (ej: 500mg)"
                                        {...register(`medications.${index}.dosage`)}
                                    />
                                    <Select
                                        placeholder="Frecuencia"
                                        options={frequencyOptions}
                                        {...register(`medications.${index}.frequency`)}
                                    />
                                    <Input
                                        placeholder="Duración (ej: 7 días)"
                                        {...register(`medications.${index}.duration`)}
                                    />
                                </div>

                                <Input
                                    placeholder="Notas adicionales para este medicamento..."
                                    className="mt-3"
                                    {...register(`medications.${index}.notes`)}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* General Instructions */}
                <Textarea
                    label="Indicaciones Generales"
                    placeholder="Instrucciones adicionales para el paciente..."
                    {...register('instructions')}
                />

                {/* Validity */}
                <Input
                    type="date"
                    label="Válido hasta"
                    {...register('validUntil')}
                />

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                    <Button type="button" variant="secondary" onClick={handleClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" isLoading={isLoading}>
                        Crear Receta
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

function PrescriptionPreview({
    patient,
    doctor,
    clinic,
    medications,
}: {
    patient: { firstName: string; lastName: string; documentNumber: string } | undefined;
    doctor: { firstName: string; lastName: string; licenseNumber?: string } | null;
    clinic: { name: string; address?: string; phone?: string } | null;
    medications: { name: string; dosage: string; frequency: string; duration?: string }[];
}) {
    return (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 print:border-black">
            {/* Header */}
            <div className="text-center border-b border-gray-200 dark:border-slate-700 pb-4 mb-4">
                <h2 className="text-xl font-bold text-primary-600">{clinic?.name || 'Clínica Médica'}</h2>
                {clinic?.address && <p className="text-sm text-gray-500">{clinic.address}</p>}
                {clinic?.phone && <p className="text-sm text-gray-500">Tel: {clinic.phone}</p>}
            </div>

            <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">RECETA MÉDICA</h3>
                <p className="text-sm text-gray-500">{format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })}</p>
            </div>

            {/* Patient info */}
            <div className="mb-6">
                <p className="text-sm text-gray-500">Paciente:</p>
                <p className="font-medium text-gray-900 dark:text-white">
                    {patient?.firstName} {patient?.lastName}
                </p>
                <p className="text-sm text-gray-500">DNI: {patient?.documentNumber}</p>
            </div>

            {/* Medications */}
            <div className="mb-6">
                <p className="text-sm text-gray-500 mb-2">Rp/</p>
                <div className="space-y-3 pl-4">
                    {medications.filter(m => m.name).map((med, index) => (
                        <div key={index} className="border-l-2 border-primary-400 pl-3">
                            <p className="font-medium text-gray-900 dark:text-white">
                                {index + 1}. {med.name} {med.dosage && `- ${med.dosage}`}
                            </p>
                            {med.frequency && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {med.frequency}
                                    {med.duration && ` por ${med.duration}`}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Signature */}
            <div className="border-t border-gray-200 dark:border-slate-700 pt-6 mt-8">
                <div className="text-center">
                    <div className="inline-block border-b border-gray-400 px-12 mb-2">
                        <span className="opacity-0">Firma</span>
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white">
                        Dr. {doctor?.firstName} {doctor?.lastName}
                    </p>
                    {doctor?.licenseNumber && (
                        <p className="text-sm text-gray-500">M.N. {doctor.licenseNumber}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
