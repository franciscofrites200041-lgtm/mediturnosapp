'use client';

import { useState } from 'react';
import {
    CalendarDaysIcon,
    UserGroupIcon,
    ClockIcon,
    ChartBarIcon,
    Bars3Icon,
    XMarkIcon,
    BellIcon,
    UserCircleIcon,
    ArrowRightOnRectangleIcon,
    HomeIcon,
    UsersIcon,
    Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import Link from 'next/link';

// Sidebar navigation items
const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, current: false },
    { name: 'Agenda', href: '/dashboard/appointments', icon: CalendarDaysIcon, current: true },
    { name: 'Pacientes', href: '/dashboard/patients', icon: UsersIcon, current: false },
    { name: 'Configuración', href: '/dashboard/settings', icon: Cog6ToothIcon, current: false },
];

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={clsx(
                    'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 transform transition-transform duration-200 ease-out lg:translate-x-0',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                {/* Logo */}
                <div className="flex items-center gap-3 h-16 px-6 border-b border-gray-200 dark:border-slate-700">
                    <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                        <span className="text-white font-bold">M</span>
                    </div>
                    <span className="font-display font-bold text-xl text-gray-900 dark:text-white">
                        Medi<span className="text-primary-500">Turnos</span>
                    </span>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="ml-auto lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
                    >
                        <XMarkIcon className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="px-4 py-6 space-y-1">
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={clsx(
                                'flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all',
                                item.current
                                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white'
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.name}
                        </Link>
                    ))}
                </nav>

                {/* User section */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-slate-700">
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer transition-colors">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center text-white font-semibold">
                            SM
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                Secretaria María
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                Clínica San Rafael
                            </p>
                        </div>
                        <ArrowRightOnRectangleIcon className="w-5 h-5 text-gray-400" />
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Top bar */}
                <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-700">
                    <div className="flex items-center justify-between h-full px-4 lg:px-6">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
                        >
                            <Bars3Icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                        </button>

                        <div className="flex-1 lg:flex-none" />

                        {/* Right side actions */}
                        <div className="flex items-center gap-3">
                            <button className="relative p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                <BellIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                            </button>
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                <UserCircleIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-4 lg:p-6">{children}</main>
            </div>
        </div>
    );
}
