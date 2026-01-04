'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '@/components/ui/Modal';
import { Input, Select, Textarea, Button } from '@/components/ui/FormElements';
import { useModalStore } from '@/lib/store';
import { useCreatePatient, useUpdatePatient, usePatient } from '@/lib/hooks';
import { CreatePatientData } from '@/lib/api';

interface PatientFormData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    phoneSecondary: string;
    documentType: string;
    documentNumber: string;
    birthDate: string;
    gender: string;
    address: string;
    city: string;
    emergencyContact: string;
    emergencyPhone: string;
    insuranceProvider: string;
    insuranceNumber: string;
    notes: string;
}

const genderOptions = [
    { value: 'MALE', label: 'Masculino' },
    { value: 'FEMALE', label: 'Femenino' },
    { value: 'OTHER', label: 'Otro' },
    { value: 'PREFER_NOT_TO_SAY', label: 'Prefiero no decir' },
];

const documentTypeOptions = [
    { value: 'DNI', label: 'DNI' },
    { value: 'PASSPORT', label: 'Pasaporte' },
    { value: 'CUIL', label: 'CUIL' },
    { value: 'CUIT', label: 'CUIT' },
    { value: 'OTHER', label: 'Otro' },
];

export default function PatientModal() {
    const { patientModalOpen, patientModalMode, selectedPatientId, closePatientModal } = useModalStore();

    const { data: existingPatient } = usePatient(selectedPatientId || '');
    const createMutation = useCreatePatient();
    const updateMutation = useUpdatePatient();

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm<PatientFormData>({
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            phoneSecondary: '',
            documentType: 'DNI',
            documentNumber: '',
            birthDate: '',
            gender: '',
            address: '',
            city: '',
            emergencyContact: '',
            emergencyPhone: '',
            insuranceProvider: '',
            insuranceNumber: '',
            notes: '',
        },
    });

    useEffect(() => {
        if (patientModalOpen && patientModalMode === 'edit' && existingPatient) {
            Object.entries(existingPatient).forEach(([key, value]) => {
                if (key === 'birthDate' && value) {
                    setValue(key as keyof PatientFormData, new Date(value as string).toISOString().split('T')[0]);
                } else if (value !== null && value !== undefined) {
                    setValue(key as keyof PatientFormData, value as string);
                }
            });
        } else if (!patientModalOpen) {
            reset();
        }
    }, [patientModalOpen, patientModalMode, existingPatient, setValue, reset]);

    const onSubmit = async (data: PatientFormData) => {
        const payload: CreatePatientData = {
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            documentNumber: data.documentNumber,
            email: data.email || undefined,
            phoneSecondary: data.phoneSecondary || undefined,
            documentType: data.documentType || undefined,
            birthDate: data.birthDate || undefined,
            gender: data.gender || undefined,
            address: data.address || undefined,
            city: data.city || undefined,
            emergencyContact: data.emergencyContact || undefined,
            emergencyPhone: data.emergencyPhone || undefined,
            insuranceProvider: data.insuranceProvider || undefined,
            insuranceNumber: data.insuranceNumber || undefined,
            notes: data.notes || undefined,
        };

        if (patientModalMode === 'edit' && selectedPatientId) {
            await updateMutation.mutateAsync({ id: selectedPatientId, data: payload });
        } else {
            await createMutation.mutateAsync(payload);
        }

        closePatientModal();
    };

    const isLoading = createMutation.isPending || updateMutation.isPending;

    return (
        <Modal
            isOpen={patientModalOpen}
            onClose={closePatientModal}
            title={patientModalMode === 'edit' ? 'Editar Paciente' : 'Nuevo Paciente'}
            size="xl"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Info */}
                <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                        Información Personal
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Nombre"
                            required
                            placeholder="Juan"
                            error={errors.firstName?.message}
                            {...register('firstName', { required: 'El nombre es requerido' })}
                        />
                        <Input
                            label="Apellido"
                            required
                            placeholder="Pérez"
                            error={errors.lastName?.message}
                            {...register('lastName', { required: 'El apellido es requerido' })}
                        />
                        <Select
                            label="Tipo de Documento"
                            options={documentTypeOptions}
                            {...register('documentType')}
                        />
                        <Input
                            label="Número de Documento"
                            required
                            placeholder="12345678"
                            error={errors.documentNumber?.message}
                            {...register('documentNumber', { required: 'El documento es requerido' })}
                        />
                        <Input
                            type="date"
                            label="Fecha de Nacimiento"
                            {...register('birthDate')}
                        />
                        <Select
                            label="Género"
                            placeholder="Seleccionar"
                            options={genderOptions}
                            {...register('gender')}
                        />
                    </div>
                </div>

                {/* Contact Info */}
                <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                        Contacto
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Teléfono"
                            required
                            placeholder="+54 11 1234-5678"
                            error={errors.phone?.message}
                            {...register('phone', { required: 'El teléfono es requerido' })}
                        />
                        <Input
                            label="Teléfono Secundario"
                            placeholder="+54 11 8765-4321"
                            {...register('phoneSecondary')}
                        />
                        <Input
                            type="email"
                            label="Email"
                            placeholder="juan@email.com"
                            {...register('email')}
                        />
                    </div>
                </div>

                {/* Address */}
                <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                        Dirección
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Dirección"
                            placeholder="Av. Corrientes 1234, Piso 5"
                            className="sm:col-span-2"
                            {...register('address')}
                        />
                        <Input
                            label="Ciudad"
                            placeholder="Buenos Aires"
                            {...register('city')}
                        />
                    </div>
                </div>

                {/* Emergency Contact */}
                <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                        Contacto de Emergencia
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Nombre del Contacto"
                            placeholder="María Pérez"
                            {...register('emergencyContact')}
                        />
                        <Input
                            label="Teléfono de Emergencia"
                            placeholder="+54 11 9999-8888"
                            {...register('emergencyPhone')}
                        />
                    </div>
                </div>

                {/* Insurance */}
                <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                        Obra Social / Prepaga
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Obra Social / Prepaga"
                            placeholder="OSDE, Swiss Medical, etc."
                            {...register('insuranceProvider')}
                        />
                        <Input
                            label="Número de Afiliado"
                            placeholder="123456789"
                            {...register('insuranceNumber')}
                        />
                    </div>
                </div>

                {/* Notes */}
                <Textarea
                    label="Notas"
                    placeholder="Información adicional sobre el paciente..."
                    {...register('notes')}
                />

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                    <Button type="button" variant="secondary" onClick={closePatientModal}>
                        Cancelar
                    </Button>
                    <Button type="submit" isLoading={isLoading}>
                        {patientModalMode === 'edit' ? 'Guardar Cambios' : 'Crear Paciente'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
