'use client';

import { useState } from 'react';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    PencilIcon,
    TrashIcon,
    ClockIcon,
    CalendarDaysIcon,
    EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Link from 'next/link';
import { useDoctors, useDeleteUser, useAreas } from '@/lib/hooks';
import { useModalStore } from '@/lib/store';
import { Button, Badge, Card, EmptyState, Spinner, Avatar } from '@/components/ui/FormElements';
import { ConfirmDialog } from '@/components/ui/Modal';
import DoctorModal from '@/components/doctors/DoctorModal';
import clsx from 'clsx';

interface Doctor {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    licenseNumber?: string;
    avatarUrl?: string;
    specialty?: {
        id: string;
        name: string;
        color: string;
    };
    _count?: {
        appointments: number;
    };
}

export default function DoctorsPage() {
    const [search, setSearch] = useState('');
    const [deleteDoctorId, setDeleteDoctorId] = useState<string | null>(null);
    const [doctorModalOpen, setDoctorModalOpen] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);

    const { data: doctors = [], isLoading } = useDoctors();
    const { data: areas = [] } = useAreas();
    const deleteMutation = useDeleteUser();

    const filteredDoctors = doctors.filter((doctor: Doctor) => {
        const searchLower = search.toLowerCase();
        return (
            doctor.firstName.toLowerCase().includes(searchLower) ||
            doctor.lastName.toLowerCase().includes(searchLower) ||
            doctor.email.toLowerCase().includes(searchLower) ||
            doctor.specialty?.name.toLowerCase().includes(searchLower)
        );
    });

    const handleDelete = async () => {
        if (deleteDoctorId) {
            await deleteMutation.mutateAsync(deleteDoctorId);
            setDeleteDoctorId(null);
        }
    };

    const openEditModal = (doctorId: string) => {
        setSelectedDoctor(doctorId);
        setDoctorModalOpen(true);
    };

    const openCreateModal = () => {
        setSelectedDoctor(null);
        setDoctorModalOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
                        Doctores
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Gestiona los médicos de tu clínica
                    </p>
                </div>
                <Button
                    leftIcon={<PlusIcon className="w-5 h-5" />}
                    onClick={openCreateModal}
                >
                    Nuevo Doctor
                </Button>
            </div>

            {/* Search */}
            <Card padding="sm">
                <div className="relative max-w-md">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nombre, email o especialidad..."
                        className="input pl-10"
                    />
                </div>
            </Card>

            {/* Doctors list */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Spinner size="lg" />
                </div>
            ) : filteredDoctors.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>}
                        title="No hay doctores"
                        description={
                            search
                                ? 'No se encontraron doctores con esos criterios'
                                : 'Comienza agregando tu primer doctor'
                        }
                        action={
                            !search && (
                                <Button leftIcon={<PlusIcon className="w-5 h-5" />} onClick={openCreateModal}>
                                    Agregar Doctor
                                </Button>
                            )
                        }
                    />
                </Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredDoctors.map((doctor: Doctor) => (
                        <DoctorCard
                            key={doctor.id}
                            doctor={doctor}
                            onEdit={() => openEditModal(doctor.id)}
                            onDelete={() => setDeleteDoctorId(doctor.id)}
                        />
                    ))}
                </div>
            )}

            {/* Doctor Modal */}
            <DoctorModal
                isOpen={doctorModalOpen}
                onClose={() => {
                    setDoctorModalOpen(false);
                    setSelectedDoctor(null);
                }}
                doctorId={selectedDoctor}
                areas={areas}
            />

            {/* Delete confirmation */}
            <ConfirmDialog
                isOpen={!!deleteDoctorId}
                onClose={() => setDeleteDoctorId(null)}
                onConfirm={handleDelete}
                title="Eliminar Doctor"
                message="¿Estás seguro de que deseas eliminar este doctor? Se eliminarán también sus horarios configurados."
                confirmText="Eliminar"
                variant="danger"
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}

function DoctorCard({
    doctor,
    onEdit,
    onDelete,
}: {
    doctor: Doctor;
    onEdit: () => void;
    onDelete: () => void;
}) {
    return (
        <Card className="group hover:shadow-lg transition-shadow duration-300">
            <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Avatar
                            src={doctor.avatarUrl}
                            name={`${doctor.firstName} ${doctor.lastName}`}
                            size="lg"
                        />
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                Dr. {doctor.firstName} {doctor.lastName}
                            </h3>
                            {doctor.licenseNumber && (
                                <p className="text-sm text-gray-500">M.N. {doctor.licenseNumber}</p>
                            )}
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
                                        <Link
                                            href={`/dashboard/schedules?doctorId=${doctor.id}`}
                                            className={clsx(
                                                'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm',
                                                active && 'bg-gray-100 dark:bg-slate-700'
                                            )}
                                        >
                                            <ClockIcon className="w-4 h-4 text-gray-400" />
                                            Ver Horarios
                                        </Link>
                                    )}
                                </Menu.Item>
                                <Menu.Item>
                                    {({ active }) => (
                                        <Link
                                            href={`/dashboard/appointments?doctorId=${doctor.id}`}
                                            className={clsx(
                                                'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm',
                                                active && 'bg-gray-100 dark:bg-slate-700'
                                            )}
                                        >
                                            <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
                                            Ver Turnos
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

                {/* Specialty */}
                {doctor.specialty && (
                    <div className="mb-4">
                        <Badge
                            variant="info"
                            size="sm"
                        >
                            <span
                                className="w-2 h-2 rounded-full mr-1.5"
                                style={{ backgroundColor: doctor.specialty.color }}
                            />
                            {doctor.specialty.name}
                        </Badge>
                    </div>
                )}

                {/* Contact */}
                <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                    <p>{doctor.email}</p>
                    {doctor.phone && <p>{doctor.phone}</p>}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                    <span className="text-xs text-gray-400">
                        {doctor._count?.appointments || 0} turnos totales
                    </span>
                    <Link
                        href={`/dashboard/schedules?doctorId=${doctor.id}`}
                        className="text-sm text-primary-600 hover:underline"
                    >
                        Configurar horarios →
                    </Link>
                </div>
            </div>
        </Card>
    );
}
