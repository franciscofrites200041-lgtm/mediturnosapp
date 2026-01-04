'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    PencilIcon,
    TrashIcon,
    UserIcon,
    UserGroupIcon,
    EllipsisVerticalIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Menu, Transition, Tab } from '@headlessui/react';
import { Fragment } from 'react';
import Link from 'next/link';
import { useUsers, useDeleteUser, useAreas } from '@/lib/hooks';
import { useAuthStore } from '@/lib/store';
import { Button, Card, EmptyState, Spinner, Avatar } from '@/components/ui/FormElements';
import { ConfirmDialog } from '@/components/ui/Modal';
import UserModal from '@/components/users/UserModal';
import { usersApi } from '@/lib/api';
import clsx from 'clsx';
import toast from 'react-hot-toast';

interface UserItem {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    role: 'DOCTOR' | 'SECRETARY';
    licenseNumber?: string;
    avatarUrl?: string;
    specialty?: {
        id: string;
        name: string;
        color: string;
    };
}

const PLAN_LIMITS: Record<string, { doctors: number; secretaries: number }> = {
    BASIC: { doctors: 1, secretaries: 1 },
    PROFESSIONAL: { doctors: 5, secretaries: 3 },
    ENTERPRISE: { doctors: 15, secretaries: 5 },
    // Treat TRIAL as PROFESSIONAL
    null: { doctors: 5, secretaries: 3 },
};

export default function StaffPage() {
    const { clinic } = useAuthStore();
    const [search, setSearch] = useState('');
    const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
    const [userModalOpen, setUserModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    // 0 = Doctors, 1 = Secretaries
    const [selectedTab, setSelectedTab] = useState(0);

    const { data: allUsers = [], isLoading } = useQuery({
        queryKey: ['users', 'staff'],
        queryFn: () => usersApi.getAll(), // Fetches all users for the clinic
    });

    const { data: areas = [] } = useAreas();
    const deleteMutation = useDeleteUser();

    // Filter by role
    const doctors = allUsers.filter((u: UserItem) => u.role === 'DOCTOR');
    const secretaries = allUsers.filter((u: UserItem) => u.role === 'SECRETARY');

    const currentRole = selectedTab === 0 ? 'DOCTOR' : 'SECRETARY';
    const currentList = selectedTab === 0 ? doctors : secretaries;

    // Filter by search
    const filteredList = currentList.filter((user: UserItem) => {
        const searchLower = search.toLowerCase();
        return (
            user.firstName.toLowerCase().includes(searchLower) ||
            user.lastName.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower) ||
            user.specialty?.name.toLowerCase().includes(searchLower)
        );
    });

    // Check limits
    const planName = clinic?.subscriptionPlan || 'BASIC'; // Fallback
    // Handle TRIAL status same as plan or default to PROFESSIONAL if null
    const effectivePlan = clinic?.subscriptionStatus === 'TRIAL' ? 'PROFESSIONAL' : planName;
    const limits = PLAN_LIMITS[effectivePlan] || PLAN_LIMITS['BASIC'];

    const currentCount = selectedTab === 0 ? doctors.length : secretaries.length;
    const maxLimit = selectedTab === 0 ? limits.doctors : limits.secretaries;
    const canAddMore = currentCount < maxLimit;

    const handleDelete = async () => {
        if (deleteUserId) {
            await deleteMutation.mutateAsync(deleteUserId);
            setDeleteUserId(null);
        }
    };

    const openEditModal = (userId: string) => {
        setSelectedUserId(userId);
        setUserModalOpen(true);
    };

    const openCreateModal = () => {
        if (!canAddMore) {
            toast.error(`Has alcanzado el límite de ${selectedTab === 0 ? 'doctores' : 'secretarias'} para tu plan ${effectivePlan}. Actualiza tu plan para agregar más.`);
            return;
        }
        setSelectedUserId(null);
        setUserModalOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
                        Personal
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Gestiona doctores y secretarias de tu clínica
                    </p>
                </div>
            </div>

            {/* Plan Limits Banner */}
            {(!canAddMore || currentCount >= maxLimit * 0.8) && (
                <div className={clsx(
                    "rounded-lg p-4 flex items-start gap-3 border",
                    !canAddMore
                        ? "bg-red-50 border-red-100 text-red-800 dark:bg-red-900/10 dark:border-red-900/30 dark:text-red-300"
                        : "bg-yellow-50 border-yellow-100 text-yellow-800 dark:bg-yellow-900/10 dark:border-yellow-900/30 dark:text-yellow-300"
                )}>
                    <ExclamationTriangleIcon className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-sm">
                            {!canAddMore ? 'Límite del plan alcanzado' : 'Estás cerca del límite de tu plan'}
                        </h3>
                        <p className="text-sm opacity-90 mt-1">
                            Tu plan <strong>{effectivePlan}</strong> permite hasta <strong>{maxLimit}</strong> {selectedTab === 0 ? 'doctores' : 'secretarias'}.
                            Actualmente tienes <strong>{currentCount}</strong>.
                            {!canAddMore && (
                                <Link href="/dashboard/settings" className="ml-1 underline font-medium hover:text-red-900 dark:hover:text-red-200">
                                    Actualizar Plan
                                </Link>
                            )}
                        </p>
                    </div>
                </div>
            )}

            {/* Tabs & Actions */}
            <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-200 dark:border-slate-700 pb-4">
                    <Tab.List className="flex space-x-2 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
                        {['Doctores', 'Secretarias'].map((category) => (
                            <Tab
                                key={category}
                                className={({ selected }) =>
                                    clsx(
                                        'w-full sm:w-auto px-6 py-2.5 text-sm font-medium leading-5 rounded-lg transition-all focus:outline-none focus:ring-2 ring-primary-400 ring-offset-2 ring-offset-gray-100 dark:ring-offset-slate-900',
                                        selected
                                            ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white shadow-sm'
                                            : 'text-gray-500 hover:text-gray-900 hover:bg-white/50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-slate-700/50'
                                    )
                                }
                            >
                                {category}
                            </Tab>
                        ))}
                    </Tab.List>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={`Buscar ${selectedTab === 0 ? 'doctores' : 'secretarias'}...`}
                                className="input pl-10 h-10 text-sm"
                            />
                        </div>
                        <Button
                            leftIcon={<PlusIcon className="w-5 h-5" />}
                            onClick={openCreateModal}
                            disabled={!canAddMore}
                            className={!canAddMore ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                            <span className="hidden sm:inline">Nuevo </span>
                            {selectedTab === 0 ? 'Doctor' : 'Secretaria'}
                        </Button>
                    </div>
                </div>

                <Tab.Panels className="mt-4">
                    {/* Doctors Panel */}
                    <Tab.Panel>
                        <StaffGrid
                            users={filteredList}
                            isLoading={isLoading}
                            role="DOCTOR"
                            onEdit={openEditModal}
                            onDelete={setDeleteUserId}
                            emptyTitle="No hay doctores"
                            emptyDesc={search ? "No se encontraron resultados" : "Agrega profesionales médicos a tu clínica"}
                            canAdd={canAddMore}
                            onAdd={openCreateModal}
                        />
                    </Tab.Panel>

                    {/* Secretaries Panel */}
                    <Tab.Panel>
                        <StaffGrid
                            users={filteredList}
                            isLoading={isLoading}
                            role="SECRETARY"
                            onEdit={openEditModal}
                            onDelete={setDeleteUserId}
                            emptyTitle="No hay secretarias"
                            emptyDesc={search ? "No se encontraron resultados" : "Agrega personal administrativo"}
                            canAdd={canAddMore}
                            onAdd={openCreateModal}
                        />
                    </Tab.Panel>
                </Tab.Panels>
            </Tab.Group>

            {/* User Modal */}
            <UserModal
                isOpen={userModalOpen}
                onClose={() => {
                    setUserModalOpen(false);
                    setSelectedUserId(null);
                }}
                userId={selectedUserId}
                role={currentRole}
                areas={areas}
            />

            {/* Delete confirmation */}
            <ConfirmDialog
                isOpen={!!deleteUserId}
                onClose={() => setDeleteUserId(null)}
                onConfirm={handleDelete}
                title="Eliminar Usuario"
                message="¿Estás seguro de que deseas eliminar este usuario? Perderá acceso al sistema inmediatamente."
                confirmText="Eliminar"
                variant="danger"
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}

function StaffGrid({ users, isLoading, role, onEdit, onDelete, emptyTitle, emptyDesc, canAdd, onAdd }: any) {
    if (isLoading) {
        return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
    }

    if (users.length === 0) {
        return (
            <Card>
                <EmptyState
                    icon={role === 'DOCTOR'
                        ? <UserGroupIcon className="w-12 h-12 text-gray-400" />
                        : <UserIcon className="w-12 h-12 text-gray-400" />
                    }
                    title={emptyTitle}
                    description={emptyDesc}
                    action={canAdd && (
                        <Button leftIcon={<PlusIcon className="w-5 h-5" />} onClick={onAdd}>
                            Agregar {role === 'DOCTOR' ? 'Doctor' : 'Secretaria'}
                        </Button>
                    )}
                />
            </Card>
        );
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {users.map((user: UserItem) => (
                <UserCard
                    key={user.id}
                    user={user}
                    onEdit={() => onEdit(user.id)}
                    onDelete={() => onDelete(user.id)}
                />
            ))}
        </div>
    );
}

function UserCard({ user, onEdit, onDelete }: { user: UserItem; onEdit: () => void; onDelete: () => void }) {
    return (
        <Card className="group hover:shadow-lg transition-shadow duration-300">
            <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Avatar
                            src={user.avatarUrl}
                            name={`${user.firstName} ${user.lastName}`}
                            size="lg"
                        />
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                {user.firstName} {user.lastName}
                            </h3>
                            <p className="text-xs text-gray-500 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-full inline-block mt-1">
                                {user.role === 'DOCTOR' ? 'Doctor' : 'Secretaria'}
                            </p>
                        </div>
                    </div>

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

                {user.specialty && (
                    <div className="mb-4">
                        <span className="flex items-center text-xs font-medium text-gray-600 dark:text-gray-300">
                            <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: user.specialty.color }} />
                            {user.specialty.name}
                        </span>
                    </div>
                )}

                <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                    <p className="truncate" title={user.email}>{user.email}</p>
                    {user.phone && <p>{user.phone}</p>}
                </div>
            </div>
        </Card>
    );
}
