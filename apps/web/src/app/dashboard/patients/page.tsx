'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    PhoneIcon,
    EnvelopeIcon,
    UserIcon,
    EllipsisVerticalIcon,
    PencilIcon,
    TrashIcon,
    CalendarDaysIcon,
    ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { usePatients, useDeletePatient } from '@/lib/hooks';
import { useModalStore } from '@/lib/store';
import { Button, Badge, Card, EmptyState, Spinner, Avatar } from '@/components/ui/FormElements';
import { ConfirmDialog } from '@/components/ui/Modal';
import PatientModal from '@/components/patients/PatientModal';
import clsx from 'clsx';

interface Patient {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
    documentNumber: string;
    birthDate?: string;
    gender?: string;
    insuranceProvider?: string;
    createdAt: string;
    _count?: {
        appointments: number;
    };
}

export default function PatientsPage() {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [deletePatientId, setDeletePatientId] = useState<string | null>(null);

    const { openPatientModal } = useModalStore();
    const { data, isLoading, error } = usePatients({ search, page, limit: 20 });
    const deleteMutation = useDeletePatient();

    const patients: Patient[] = data?.patients || [];
    const totalPages = data?.totalPages || 1;

    const handleDelete = async () => {
        if (deletePatientId) {
            await deleteMutation.mutateAsync(deletePatientId);
            setDeletePatientId(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
                        Pacientes
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Gestiona los pacientes de tu clínica
                    </p>
                </div>
                <Button
                    leftIcon={<PlusIcon className="w-5 h-5" />}
                    onClick={() => openPatientModal('create')}
                >
                    Nuevo Paciente
                </Button>
            </div>

            {/* Search and filters */}
            <Card padding="sm">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por nombre, DNI o teléfono..."
                            className="input pl-10"
                        />
                    </div>
                    <Button variant="secondary" leftIcon={<FunnelIcon className="w-5 h-5" />}>
                        Filtros
                    </Button>
                </div>
            </Card>

            {/* Patients list */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Spinner size="lg" />
                </div>
            ) : patients.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={<UserIcon className="w-8 h-8" />}
                        title="No hay pacientes"
                        description={
                            search
                                ? 'No se encontraron pacientes con esos criterios'
                                : 'Comienza agregando tu primer paciente'
                        }
                        action={
                            !search && (
                                <Button leftIcon={<PlusIcon className="w-5 h-5" />} onClick={() => openPatientModal('create')}>
                                    Agregar Paciente
                                </Button>
                            )
                        }
                    />
                </Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {patients.map((patient) => (
                        <PatientCard
                            key={patient.id}
                            patient={patient}
                            onEdit={() => openPatientModal('edit', patient.id)}
                            onDelete={() => setDeletePatientId(patient.id)}
                        />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => setPage((p) => p - 1)}
                    >
                        Anterior
                    </Button>
                    <span className="flex items-center px-4 text-sm text-gray-500">
                        Página {page} de {totalPages}
                    </span>
                    <Button
                        variant="secondary"
                        size="sm"
                        disabled={page === totalPages}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Siguiente
                    </Button>
                </div>
            )}

            {/* Patient Modal */}
            <PatientModal />

            {/* Delete confirmation */}
            <ConfirmDialog
                isOpen={!!deletePatientId}
                onClose={() => setDeletePatientId(null)}
                onConfirm={handleDelete}
                title="Eliminar Paciente"
                message="¿Estás seguro de que deseas eliminar este paciente? Esta acción no se puede deshacer."
                confirmText="Eliminar"
                variant="danger"
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}

function PatientCard({
    patient,
    onEdit,
    onDelete,
}: {
    patient: Patient;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const { openAppointmentModal } = useModalStore();

    return (
        <Card className="group hover:shadow-lg transition-shadow duration-300">
            <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Avatar name={`${patient.firstName} ${patient.lastName}`} size="lg" />
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                {patient.firstName} {patient.lastName}
                            </h3>
                            <p className="text-sm text-gray-500">DNI: {patient.documentNumber}</p>
                        </div>
                    </div>

                    {/* Actions menu */}
                    <Menu as="div" className="relative">
                        <Menu.Button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                            <EllipsisVerticalIcon className="w-5 h-5 text-gray-500" />
                        </Menu.Button>
                        <Transition
                            as={Fragment}
                            enter="transition ease-out duration-100"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                        >
                            <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl bg-white dark:bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none p-2 z-10">
                                <Menu.Item>
                                    {({ active }) => (
                                        <button
                                            onClick={() => openAppointmentModal('create', undefined, { patientId: patient.id })}
                                            className={clsx(
                                                'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm',
                                                active && 'bg-gray-100 dark:bg-slate-700'
                                            )}
                                        >
                                            <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
                                            Agendar Turno
                                        </button>
                                    )}
                                </Menu.Item>
                                <Menu.Item>
                                    {({ active }) => (
                                        <Link
                                            href={`/dashboard/patients/${patient.id}/history`}
                                            className={clsx(
                                                'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm',
                                                active && 'bg-gray-100 dark:bg-slate-700'
                                            )}
                                        >
                                            <ClipboardDocumentListIcon className="w-4 h-4 text-gray-400" />
                                            Ver Historia Clínica
                                        </Link>
                                    )}
                                </Menu.Item>
                                <Menu.Item>
                                    {({ active }) => (
                                        <button
                                            onClick={onEdit}
                                            className={clsx(
                                                'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm',
                                                active && 'bg-gray-100 dark:bg-slate-700'
                                            )}
                                        >
                                            <PencilIcon className="w-4 h-4 text-gray-400" />
                                            Editar
                                        </button>
                                    )}
                                </Menu.Item>
                                <Menu.Item>
                                    {({ active }) => (
                                        <button
                                            onClick={onDelete}
                                            className={clsx(
                                                'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-red-600',
                                                active && 'bg-red-50 dark:bg-red-900/20'
                                            )}
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                            Eliminar
                                        </button>
                                    )}
                                </Menu.Item>
                            </Menu.Items>
                        </Transition>
                    </Menu>
                </div>

                {/* Contact info */}
                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <PhoneIcon className="w-4 h-4" />
                        <span>{patient.phone}</span>
                    </div>
                    {patient.email && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <EnvelopeIcon className="w-4 h-4" />
                            <span className="truncate">{patient.email}</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                    {patient.insuranceProvider ? (
                        <Badge variant="info" size="sm">
                            {patient.insuranceProvider}
                        </Badge>
                    ) : (
                        <Badge variant="neutral" size="sm">
                            Particular
                        </Badge>
                    )}
                    <span className="text-xs text-gray-400">
                        {patient._count?.appointments || 0} turnos
                    </span>
                </div>
            </div>
        </Card>
    );
}
