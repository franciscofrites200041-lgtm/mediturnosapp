'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '@/components/ui/Modal';
import { Input, Select, Button } from '@/components/ui/FormElements';
import { useCreateUser, useUpdateUser, useUser } from '@/lib/hooks';

interface UserFormData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    specialtyId?: string;
    licenseNumber?: string;
}

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string | null;
    role: 'DOCTOR' | 'SECRETARY';
    areas?: { id: string; name: string }[];
}

export default function UserModal({ isOpen, onClose, userId, role, areas = [] }: UserModalProps) {
    const isEditing = !!userId;
    // Only fetch user if editing. If userId is null, query won't run thanks to enabled: !!id inside hook
    const { data: existingUser, isFetching } = useUser(userId || '');
    const createMutation = useCreateUser();
    const updateMutation = useUpdateUser();

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm<UserFormData>({
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
        if (isOpen && isEditing && existingUser && !isFetching) {
            setValue('firstName', existingUser.firstName);
            setValue('lastName', existingUser.lastName);
            setValue('email', existingUser.email);
            setValue('phone', existingUser.phone || '');
            if (role === 'DOCTOR') {
                setValue('specialtyId', existingUser.specialtyId || '');
                setValue('licenseNumber', existingUser.licenseNumber || '');
            }
        } else if (!isOpen) {
            reset();
        }
    }, [isOpen, isEditing, existingUser, isFetching, role, setValue, reset]);

    const onSubmit = async (data: UserFormData) => {
        const payload: any = {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone || undefined,
            password: data.password || undefined,
        };

        if (role === 'DOCTOR') {
            payload.specialtyId = data.specialtyId || undefined;
            payload.licenseNumber = data.licenseNumber || undefined;
        }

        if (isEditing && userId) {
            await updateMutation.mutateAsync({
                id: userId,
                data: payload,
            });
        } else {
            payload.role = role;
            // Password is mandatory for creation
            if (!payload.password) return;
            await createMutation.mutateAsync(payload);
        }
        onClose();
    };

    const isLoading = createMutation.isPending || updateMutation.isPending;
    const title = isEditing
        ? `Editar ${role === 'DOCTOR' ? 'Doctor' : 'Secretaria'}`
        : `Nueva ${role === 'DOCTOR' ? 'Doctor' : 'Secretaria'}`;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="lg"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Nombre"
                        required
                        placeholder="Nombre"
                        error={errors.firstName?.message}
                        {...register('firstName', { required: 'El nombre es requerido' })}
                    />
                    <Input
                        label="Apellido"
                        required
                        placeholder="Apellido"
                        error={errors.lastName?.message}
                        {...register('lastName', { required: 'El apellido es requerido' })}
                    />
                </div>

                <Input
                    type="email"
                    label="Email"
                    required
                    placeholder="email@clinica.com"
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

                {role === 'DOCTOR' && (
                    <>
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
                    </>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" isLoading={isLoading}>
                        {isEditing ? 'Guardar Cambios' : 'Crear Usuario'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
