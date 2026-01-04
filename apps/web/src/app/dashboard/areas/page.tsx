'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useAreas, useCreateArea, useUpdateArea, useDeleteArea } from '@/lib/hooks';
import { Button, Card, EmptyState, Spinner, Input } from '@/components/ui/FormElements';
import { ConfirmDialog } from '@/components/ui/Modal';
import Modal from '@/components/ui/Modal';

interface Area {
    id: string;
    name: string;
    description?: string;
    color: string;
    defaultDuration: number;
    _count?: {
        doctors: number;
        appointments: number;
    };
}

interface AreaFormData {
    name: string;
    description: string;
    color: string;
    defaultDuration: number;
}

const presetColors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#6366F1', // Indigo
    '#14B8A6', // Teal
    '#F97316', // Orange
    '#6B7280', // Gray
];

export default function AreasPage() {
    const [deleteAreaId, setDeleteAreaId] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedArea, setSelectedArea] = useState<Area | null>(null);

    const { data: areas = [], isLoading } = useAreas();
    const deleteMutation = useDeleteArea();

    const handleDelete = async () => {
        if (deleteAreaId) {
            await deleteMutation.mutateAsync(deleteAreaId);
            setDeleteAreaId(null);
        }
    };

    const openCreateModal = () => {
        setSelectedArea(null);
        setModalOpen(true);
    };

    const openEditModal = (area: Area) => {
        setSelectedArea(area);
        setModalOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
                        Especialidades
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Configura las áreas médicas de tu clínica
                    </p>
                </div>
                <Button
                    leftIcon={<PlusIcon className="w-5 h-5" />}
                    onClick={openCreateModal}
                >
                    Nueva Especialidad
                </Button>
            </div>

            {/* Areas list */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Spinner size="lg" />
                </div>
            ) : areas.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>}
                        title="No hay especialidades"
                        description="Comienza creando las áreas médicas de tu clínica"
                        action={
                            <Button leftIcon={<PlusIcon className="w-5 h-5" />} onClick={openCreateModal}>
                                Crear Especialidad
                            </Button>
                        }
                    />
                </Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {areas.map((area: Area) => (
                        <Card key={area.id} className="group hover:shadow-lg transition-shadow">
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                                            style={{ backgroundColor: area.color }}
                                        >
                                            {area.name[0]}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                                {area.name}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                {area.defaultDuration} min por turno
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => openEditModal(area)}
                                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                                        >
                                            <PencilIcon className="w-4 h-4 text-gray-500" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteAreaId(area.id)}
                                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                        >
                                            <TrashIcon className="w-4 h-4 text-red-500" />
                                        </button>
                                    </div>
                                </div>

                                {area.description && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                        {area.description}
                                    </p>
                                )}

                                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-700 text-sm text-gray-500">
                                    <span>{area._count?.doctors || 0} doctores</span>
                                    <span>{area._count?.appointments || 0} turnos</span>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Area Modal */}
            <AreaModal
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setSelectedArea(null);
                }}
                area={selectedArea}
            />

            {/* Delete confirmation */}
            <ConfirmDialog
                isOpen={!!deleteAreaId}
                onClose={() => setDeleteAreaId(null)}
                onConfirm={handleDelete}
                title="Eliminar Especialidad"
                message="¿Estás seguro de que deseas eliminar esta especialidad?"
                confirmText="Eliminar"
                variant="danger"
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}

function AreaModal({
    isOpen,
    onClose,
    area,
}: {
    isOpen: boolean;
    onClose: () => void;
    area: Area | null;
}) {
    const isEditing = !!area;
    const createMutation = useCreateArea();
    const updateMutation = useUpdateArea();

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors },
    } = useForm<AreaFormData>({
        defaultValues: {
            name: area?.name || '',
            description: area?.description || '',
            color: area?.color || '#3B82F6',
            defaultDuration: area?.defaultDuration || 30,
        },
    });

    const selectedColor = watch('color');

    const onSubmit = async (data: AreaFormData) => {
        if (isEditing && area) {
            await updateMutation.mutateAsync({ id: area.id, data });
        } else {
            await createMutation.mutateAsync(data);
        }
        onClose();
        reset();
    };

    const isLoading = createMutation.isPending || updateMutation.isPending;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Editar Especialidad' : 'Nueva Especialidad'}
            size="md"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                    label="Nombre"
                    required
                    placeholder="Ej: Cardiología"
                    error={errors.name?.message}
                    {...register('name', { required: 'El nombre es requerido' })}
                />

                <Input
                    label="Descripción"
                    placeholder="Descripción opcional..."
                    {...register('description')}
                />

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Color
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {presetColors.map((color) => (
                            <button
                                key={color}
                                type="button"
                                onClick={() => setValue('color', color)}
                                className={`w-8 h-8 rounded-full transition-transform ${selectedColor === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-110'}`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                </div>

                <Input
                    type="number"
                    label="Duración por Defecto (minutos)"
                    placeholder="30"
                    {...register('defaultDuration', { valueAsNumber: true })}
                />

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" isLoading={isLoading}>
                        {isEditing ? 'Guardar Cambios' : 'Crear Especialidad'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
