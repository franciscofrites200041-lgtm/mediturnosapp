'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '@/components/ui/Modal';
import { Input, Select, Button } from '@/components/ui/FormElements';
import { useCreateUser, useUpdateUser, useUser } from '@/lib/hooks';

interface DoctorFormData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    specialtyId: string;
    licenseNumber: string;
}

interface DoctorModalProps {
    isOpen: boolean;
    onClose: () => void;
    doctorId: string | null;
    areas: { id: string; name: string }[];
}

export default function DoctorModal({ isOpen, onClose, doctorId, areas }: DoctorModalProps) {
    const isEditing = !!doctorId;
    const { data: existingDoctor } = useUser(doctorId || '');
    const createMutation = useCreateUser();
    const updateMutation = useUpdateUser();

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm<DoctorFormData>({
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            password: '',
            specialtyId: '',
            licenseNumber: '',
        },
    });

    useEffect(() => {
        if (isOpen && isEditing && existingDoctor) {
            setValue('firstName', existingDoctor.firstName);
            setValue('lastName', existingDoctor.lastName);
            setValue('email', existingDoctor.email);
            setValue('phone', existingDoctor.phone || '');
            setValue('specialtyId', existingDoctor.specialtyId || '');
            setValue('licenseNumber', existingDoctor.licenseNumber || '');
        } else if (!isOpen) {
            reset();
        }
    }, [isOpen, isEditing, existingDoctor, setValue, reset]);

    const onSubmit = async (data: DoctorFormData) => {
        if (isEditing && doctorId) {
            await updateMutation.mutateAsync({
                id: doctorId,
                data: {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    phone: data.phone || undefined,
                    specialtyId: data.specialtyId || undefined,
                    licenseNumber: data.licenseNumber || undefined,
                    password: data.password || undefined,
                },
            });
        } else {
            await createMutation.mutateAsync({
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                password: data.password,
                phone: data.phone || undefined,
                role: 'DOCTOR',
                specialtyId: data.specialtyId || undefined,
                licenseNumber: data.licenseNumber || undefined,
            });
        }
        onClose();
    };

    const isLoading = createMutation.isPending || updateMutation.isPending;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Editar Doctor' : 'Nuevo Doctor'}
            size="lg"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Nombre"
                        required
                        placeholder="Carlos"
                        error={errors.firstName?.message}
                        {...register('firstName', { required: 'El nombre es requerido' })}
                    />
                    <Input
                        label="Apellido"
                        required
                        placeholder="López"
                        error={errors.lastName?.message}
                        {...register('lastName', { required: 'El apellido es requerido' })}
                    />
                </div>

                <Input
                    type="email"
                    label="Email"
                    required
                    placeholder="doctor@clinica.com"
                    error={errors.email?.message}
                    {...register('email', {
                        required: 'El email es requerido',
                        pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Email inválido',
                        },
                    })}
                />

                <Input
                    label="Teléfono"
                    placeholder="+54 11 1234-5678"
                    {...register('phone')}
                />

                {!isEditing && (
                    <Input
                        type="password"
                        label="Contraseña"
                        required
                        placeholder="••••••••"
                        error={errors.password?.message}
                        {...register('password', {
                            required: !isEditing && 'La contraseña es requerida',
                            minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                        })}
                    />
                )}

                {isEditing && (
                    <Input
                        type="password"
                        label="Nueva Contraseña (opcional)"
                        placeholder="Dejar vacío para no cambiar"
                        {...register('password')}
                    />
                )}

                <Select
                    label="Especialidad"
                    required
                    placeholder="Seleccionar especialidad"
                    options={areas.map((area) => ({ value: area.id, label: area.name }))}
                    error={errors.specialtyId?.message}
                    {...register('specialtyId', { required: 'Selecciona una especialidad' })}
                />

                <Input
                    label="Número de Matrícula"
                    placeholder="M.N. 123456"
                    {...register('licenseNumber')}
                />

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" isLoading={isLoading}>
                        {isEditing ? 'Guardar Cambios' : 'Crear Doctor'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
