'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Dialog, Transition, Menu } from '@headlessui/react';
import {
    Bars3Icon,
    XMarkIcon,
    HomeIcon,
    CalendarDaysIcon,
    UsersIcon,
    UserGroupIcon,
    ClipboardDocumentListIcon,
    DocumentTextIcon,
    Cog6ToothIcon,
    ArrowRightOnRectangleIcon,
    ChevronDownIcon,
    BuildingOffice2Icon,
    HeartIcon,
    UserCircleIcon,
    ClockIcon,
    ChartBarIcon,
    ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore, useUIStore } from '@/lib/store';
import clsx from 'clsx';

// Navigation items based on roles
const getNavigation = (role: string) => {
    const baseNav = [
        { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
        { name: 'Mensajes', href: '/dashboard/inbox', icon: ChatBubbleLeftRightIcon },
        { name: 'Turnos', href: '/dashboard/appointments', icon: CalendarDaysIcon },
    ];

    const secretaryNav = [
        ...baseNav,
        { name: 'Pacientes', href: '/dashboard/patients', icon: UsersIcon },
    ];

    const doctorNav = [
        { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
        { name: 'Mi Agenda', href: '/dashboard/my-agenda', icon: CalendarDaysIcon },
        { name: 'Mis Pacientes', href: '/dashboard/my-patients', icon: UsersIcon },
        { name: 'Historia Clínica', href: '/dashboard/medical-records', icon: ClipboardDocumentListIcon },
        { name: 'Recetas', href: '/dashboard/prescriptions', icon: DocumentTextIcon },
    ];

    const adminNav = [
        ...secretaryNav,
        { name: 'Personal', href: '/dashboard/staff', icon: UserGroupIcon },
        { name: 'Especialidades', href: '/dashboard/areas', icon: BuildingOffice2Icon },
        { name: 'Horarios', href: '/dashboard/schedules', icon: ClockIcon },
        { name: 'Reportes', href: '/dashboard/reports', icon: ChartBarIcon },
        { name: 'Configuración', href: '/dashboard/settings', icon: Cog6ToothIcon },
    ];

    const superAdminNav = [
        { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
        { name: 'Clínicas', href: '/dashboard/clinics', icon: BuildingOffice2Icon },
        { name: 'Facturación', href: '/dashboard/billing', icon: DocumentTextIcon },
        { name: 'Usuarios', href: '/dashboard/users', icon: UserGroupIcon },
    ];

    switch (role) {
        case 'SUPER_ADMIN':
            return superAdminNav;
        case 'CLINIC_ADMIN':
            return adminNav;
        case 'DOCTOR':
            return doctorNav;
        case 'SECRETARY':
        default:
            return secretaryNav;
    }
};

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, clinic, logout } = useAuthStore();
    const { sidebarOpen, setSidebarOpen } = useUIStore();

    const navigation = getNavigation(user?.role || 'SECRETARY');

    const handleLogout = () => {
        logout();
        router.push('/auth/login');
    };

    return (
        <>
            {/* Mobile sidebar */}
            <Transition.Root show={sidebarOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
                    <Transition.Child
                        as={Fragment}
                        enter="transition-opacity ease-linear duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="transition-opacity ease-linear duration-300"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 flex">
                        <Transition.Child
                            as={Fragment}
                            enter="transition ease-in-out duration-300 transform"
                            enterFrom="-translate-x-full"
                            enterTo="translate-x-0"
                            leave="transition ease-in-out duration-300 transform"
                            leaveFrom="translate-x-0"
                            leaveTo="-translate-x-full"
                        >
                            <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                                <Transition.Child
                                    as={Fragment}
                                    enter="ease-in-out duration-300"
                                    enterFrom="opacity-0"
                                    enterTo="opacity-100"
                                    leave="ease-in-out duration-300"
                                    leaveFrom="opacity-100"
                                    leaveTo="opacity-0"
                                >
                                    <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                                        <button
                                            type="button"
                                            className="-m-2.5 p-2.5"
                                            onClick={() => setSidebarOpen(false)}
                                        >
                                            <XMarkIcon className="h-6 w-6 text-white" />
                                        </button>
                                    </div>
                                </Transition.Child>

                                <SidebarContent
                                    navigation={navigation}
                                    pathname={pathname}
                                    user={user}
                                    clinic={clinic}
                                    onLogout={handleLogout}
                                />
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition.Root>

            {/* Desktop sidebar */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
                <SidebarContent
                    navigation={navigation}
                    pathname={pathname}
                    user={user}
                    clinic={clinic}
                    onLogout={handleLogout}
                />
            </div>
        </>
    );
}

function SidebarContent({
    navigation,
    pathname,
    user,
    clinic,
    onLogout,
}: {
    navigation: { name: string; href: string; icon: React.ComponentType<{ className?: string }> }[];
    pathname: string;
    user: { firstName: string; lastName: string; email: string; role: string; avatarUrl?: string } | null;
    clinic: { name: string; logoUrl?: string } | null;
    onLogout: () => void;
}) {
    return (
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 px-6 pb-4">
            {/* Logo */}
            <div className="flex h-16 shrink-0 items-center gap-3 border-b border-gray-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
                    <HeartIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="font-display font-bold text-lg text-gray-900 dark:text-white">MediTurnos</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[140px]">
                        {clinic?.name || 'Mi Clínica'}
                    </p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                        <ul role="list" className="-mx-2 space-y-1">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                                return (
                                    <li key={item.name}>
                                        <Link
                                            href={item.href}
                                            className={clsx(
                                                'group flex gap-x-3 rounded-xl p-3 text-sm font-medium leading-6 transition-all duration-200',
                                                isActive
                                                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                                            )}
                                        >
                                            <item.icon
                                                className={clsx(
                                                    'h-6 w-6 shrink-0',
                                                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-primary-500'
                                                )}
                                            />
                                            {item.name}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </li>

                    {/* User menu */}
                    <li className="mt-auto">
                        <Menu as="div" className="relative">
                            <Menu.Button className="flex items-center gap-x-3 w-full p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white font-semibold">
                                    {user?.avatarUrl ? (
                                        <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <span>{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
                                    )}
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {user?.firstName} {user?.lastName}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                        {user?.role?.toLowerCase().replace('_', ' ')}
                                    </p>
                                </div>
                                <ChevronDownIcon className="w-5 h-5 text-gray-400" />
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
                                <Menu.Items className="absolute bottom-full mb-2 left-0 w-full origin-bottom-left rounded-xl bg-white dark:bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none p-2">
                                    <Menu.Item>
                                        {({ active }) => (
                                            <Link
                                                href="/dashboard/profile"
                                                className={clsx(
                                                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                                                    active ? 'bg-gray-100 dark:bg-slate-700' : ''
                                                )}
                                            >
                                                <UserCircleIcon className="w-5 h-5 text-gray-400" />
                                                Mi Perfil
                                            </Link>
                                        )}
                                    </Menu.Item>
                                    <Menu.Item>
                                        {({ active }) => (
                                            <button
                                                onClick={onLogout}
                                                className={clsx(
                                                    'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-red-600',
                                                    active ? 'bg-red-50 dark:bg-red-900/20' : ''
                                                )}
                                            >
                                                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                                                Cerrar Sesión
                                            </button>
                                        )}
                                    </Menu.Item>
                                </Menu.Items>
                            </Transition>
                        </Menu>
                    </li>
                </ul>
            </nav>
        </div>
    );
}

// Header component for mobile
export function Header() {
    const { setSidebarOpen } = useUIStore();
    const { user, clinic } = useAuthStore();

    return (
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 sm:gap-x-6 sm:px-6 lg:hidden">
            <button
                type="button"
                className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-300"
                onClick={() => setSidebarOpen(true)}
            >
                <Bars3Icon className="h-6 w-6" />
            </button>

            <div className="flex flex-1 items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                        <HeartIcon className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-display font-semibold text-gray-900 dark:text-white">
                        {clinic?.name || 'MediTurnos'}
                    </span>
                </div>

                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white text-xs font-semibold">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
            </div>
        </div>
    );
}
