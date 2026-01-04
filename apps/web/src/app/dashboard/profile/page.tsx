'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
    UserCircleIcon,
    KeyIcon,
    BellIcon,
    ShieldCheckIcon,
    CameraIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/lib/store';
import { authApi } from '@/lib/api';
import { Card, Button, Input } from '@/components/ui/FormElements';
import toast from 'react-hot-toast';

interface ProfileFormData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
}

interface PasswordFormData {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export default function ProfilePage() {
    const { user, setUser } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'notifications'>('profile');
    const [isUpdating, setIsUpdating] = useState(false);

    const tabs = [
        { id: 'profile', label: 'Mi Perfil', icon: UserCircleIcon },
        { id: 'password', label: 'Contraseña', icon: KeyIcon },
        { id: 'notifications', label: 'Notificaciones', icon: BellIcon },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
                    Mi Perfil
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Administra tu información personal y preferencias
                </p>
            </div>

            <div className="grid lg:grid-cols-4 gap-6">
                {/* Sidebar */}
                <Card className="lg:col-span-1 h-fit">
                    <div className="p-4">
                        {/* Avatar */}
                        <div className="flex flex-col items-center mb-6 pb-6 border-b border-gray-100 dark:border-slate-700">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white text-3xl font-bold">
                                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                                </div>
                                <button className="absolute bottom-0 right-0 p-2 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                                    <CameraIcon className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>
                            <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">
                                {user?.firstName} {user?.lastName}
                            </h3>
                            <p className="text-sm text-gray-500 capitalize">
                                {user?.role?.toLowerCase().replace('_', ' ')}
                            </p>
                        </div>

                        {/* Navigation */}
                        <nav className="space-y-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${activeTab === tab.id
                                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    <tab.icon className="w-5 h-5" />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                </Card>

                {/* Content */}
                <div className="lg:col-span-3">
                    {activeTab === 'profile' && <ProfileTab user={user} />}
                    {activeTab === 'password' && <PasswordTab />}
                    {activeTab === 'notifications' && <NotificationsTab />}
                </div>
            </div>
        </div>
    );
}

function ProfileTab({ user }: { user: any }) {
    const { setUser } = useAuthStore();
    const [isUpdating, setIsUpdating] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ProfileFormData>({
        defaultValues: {
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            email: user?.email || '',
            phone: user?.phone || '',
        },
    });

    const onSubmit = async (data: ProfileFormData) => {
        setIsUpdating(true);
        try {
            // API call would go here
            toast.success('Perfil actualizado correctamente');
            setUser({ ...user, ...data });
        } catch (error) {
            toast.error('Error al actualizar el perfil');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <Card>
            <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                    Información Personal
                </h2>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <Input
                            label="Nombre"
                            {...register('firstName', { required: 'El nombre es requerido' })}
                            error={errors.firstName?.message}
                        />
                        <Input
                            label="Apellido"
                            {...register('lastName', { required: 'El apellido es requerido' })}
                            error={errors.lastName?.message}
                        />
                    </div>
                    <Input
                        type="email"
                        label="Email"
                        {...register('email', { required: 'El email es requerido' })}
                        error={errors.email?.message}
                        disabled
                    />
                    <Input
                        label="Teléfono"
                        {...register('phone')}
                    />

                    <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
                        <Button type="submit" isLoading={isUpdating}>
                            Guardar Cambios
                        </Button>
                    </div>
                </form>
            </div>
        </Card>
    );
}

function PasswordTab() {
    const [isUpdating, setIsUpdating] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm<PasswordFormData>();

    const newPassword = watch('newPassword');

    const onSubmit = async (data: PasswordFormData) => {
        setIsUpdating(true);
        try {
            await authApi.changePassword(data.currentPassword, data.newPassword);
            toast.success('Contraseña actualizada correctamente');
            reset();
        } catch (error: any) {
            toast.error(error.message || 'Error al cambiar la contraseña');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <Card>
            <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                    Cambiar Contraseña
                </h2>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-md">
                    <Input
                        type="password"
                        label="Contraseña Actual"
                        {...register('currentPassword', { required: 'La contraseña actual es requerida' })}
                        error={errors.currentPassword?.message}
                    />
                    <Input
                        type="password"
                        label="Nueva Contraseña"
                        {...register('newPassword', {
                            required: 'La nueva contraseña es requerida',
                            minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                        })}
                        error={errors.newPassword?.message}
                    />
                    <Input
                        type="password"
                        label="Confirmar Nueva Contraseña"
                        {...register('confirmPassword', {
                            required: 'Confirma la nueva contraseña',
                            validate: (value) => value === newPassword || 'Las contraseñas no coinciden',
                        })}
                        error={errors.confirmPassword?.message}
                    />

                    <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
                        <Button type="submit" isLoading={isUpdating}>
                            Cambiar Contraseña
                        </Button>
                    </div>
                </form>
            </div>
        </Card>
    );
}

function NotificationsTab() {
    const [settings, setSettings] = useState({
        emailAppointments: true,
        emailReminders: true,
        emailMarketing: false,
        pushAppointments: true,
        pushReminders: true,
    });

    const toggleSetting = (key: keyof typeof settings) => {
        setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
        toast.success('Preferencias actualizadas');
    };

    return (
        <Card>
            <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                    Preferencias de Notificaciones
                </h2>

                <div className="space-y-6">
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
                            Notificaciones por Email
                        </h3>
                        <div className="space-y-4">
                            <NotificationToggle
                                label="Nuevos turnos"
                                description="Recibir notificación cuando se agenda un nuevo turno"
                                enabled={settings.emailAppointments}
                                onChange={() => toggleSetting('emailAppointments')}
                            />
                            <NotificationToggle
                                label="Recordatorios"
                                description="Recordatorios de turnos próximos"
                                enabled={settings.emailReminders}
                                onChange={() => toggleSetting('emailReminders')}
                            />
                            <NotificationToggle
                                label="Novedades"
                                description="Información sobre nuevas funcionalidades"
                                enabled={settings.emailMarketing}
                                onChange={() => toggleSetting('emailMarketing')}
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 dark:border-slate-700">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
                            Notificaciones Push
                        </h3>
                        <div className="space-y-4">
                            <NotificationToggle
                                label="Nuevos turnos"
                                description="Notificación push cuando se agenda un turno"
                                enabled={settings.pushAppointments}
                                onChange={() => toggleSetting('pushAppointments')}
                            />
                            <NotificationToggle
                                label="Recordatorios"
                                description="Recordatorio 30 minutos antes del turno"
                                enabled={settings.pushReminders}
                                onChange={() => toggleSetting('pushReminders')}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}

function NotificationToggle({
    label,
    description,
    enabled,
    onChange,
}: {
    label: string;
    description: string;
    enabled: boolean;
    onChange: () => void;
}) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <p className="font-medium text-gray-900 dark:text-white">{label}</p>
                <p className="text-sm text-gray-500">{description}</p>
            </div>
            <button
                type="button"
                onClick={onChange}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${enabled ? 'bg-primary-500' : 'bg-gray-200 dark:bg-slate-600'
                    }`}
            >
                <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                />
            </button>
        </div>
    );
}
