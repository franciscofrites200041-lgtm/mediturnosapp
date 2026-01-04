'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
    BuildingOffice2Icon,
    BellIcon,
    LinkIcon,
    ShieldCheckIcon,
    PhotoIcon,
    CreditCardIcon,
    ChatBubbleLeftRightIcon,
    SparklesIcon,
    CheckCircleIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/lib/store';
import { Button, Card, Input, Textarea, Select } from '@/components/ui/FormElements';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { billingApi, whatsappApi } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

type SettingsTab = 'general' | 'whatsapp' | 'notifications' | 'integrations' | 'security' | 'billing';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const { clinic, user } = useAuthStore();

    // Check if clinic's plan includes WhatsApp (PROFESSIONAL or ENTERPRISE)
    const isPlanWithWhatsApp = clinic?.subscriptionPlan === 'PROFESSIONAL' || clinic?.subscriptionPlan === 'ENTERPRISE';

    const tabs = [
        { id: 'general' as const, name: 'General', icon: BuildingOffice2Icon },
        { id: 'whatsapp' as const, name: 'WhatsApp Bot', icon: ChatBubbleLeftRightIcon, premium: true, enabled: isPlanWithWhatsApp },
        { id: 'billing' as const, name: 'Facturación', icon: CreditCardIcon },
        { id: 'notifications' as const, name: 'Notificaciones', icon: BellIcon },
        { id: 'integrations' as const, name: 'Integraciones', icon: LinkIcon },
        { id: 'security' as const, name: 'Seguridad', icon: ShieldCheckIcon },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
                    Configuración
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Administra la configuración de tu clínica
                </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Tabs */}
                <Card className="lg:w-64 shrink-0 p-2">
                    <nav className="space-y-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={clsx(
                                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors relative',
                                    activeTab === tab.id
                                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                                )}
                            >
                                <tab.icon className="w-5 h-5" />
                                <span className="font-medium">{tab.name}</span>
                                {'premium' in tab && tab.premium && (
                                    <span className="ml-auto flex items-center gap-1 text-xs">
                                        {tab.enabled ? (
                                            <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full font-medium">
                                                ✓
                                            </span>
                                        ) : (
                                            <span className="px-1.5 py-0.5 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-600 dark:text-amber-400 rounded-full font-medium flex items-center gap-1">
                                                <SparklesIcon className="w-3 h-3" />
                                                PRO
                                            </span>
                                        )}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>
                </Card>

                {/* Content */}
                <div className="flex-1">
                    {activeTab === 'general' && <GeneralSettings clinic={clinic} />}
                    {activeTab === 'whatsapp' && <WhatsAppBotSettings isPlanEnabled={isPlanWithWhatsApp} />}
                    {activeTab === 'billing' && <BillingSettings />}
                    {activeTab === 'notifications' && <NotificationSettings />}
                    {activeTab === 'integrations' && <IntegrationSettings clinic={clinic} />}
                    {activeTab === 'security' && <SecuritySettings />}
                </div>
            </div>
        </div>
    );
}

function GeneralSettings({ clinic }: { clinic: { name: string; email?: string; phone?: string; address?: string; city?: string; timezone?: string } | null }) {
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            name: clinic?.name || '',
            email: clinic?.email || '',
            phone: clinic?.phone || '',
            address: clinic?.address || '',
            city: clinic?.city || '',
            timezone: clinic?.timezone || 'America/Argentina/Buenos_Aires',
        },
    });

    const onSubmit = async (data: Record<string, string>) => {
        setIsLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success('Configuración guardada');
        setIsLoading(false);
    };

    return (
        <Card>
            <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                    Información de la Clínica
                </h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Logo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Logo
                        </label>
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                                <PhotoIcon className="w-8 h-8 text-gray-400" />
                            </div>
                            <div>
                                <Button type="button" variant="secondary" size="sm">
                                    Subir Logo
                                </Button>
                                <p className="text-xs text-gray-500 mt-1">PNG, JPG hasta 2MB</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Nombre de la Clínica"
                            required
                            {...register('name', { required: 'El nombre es requerido' })}
                        />
                        <Input
                            type="email"
                            label="Email"
                            {...register('email')}
                        />
                        <Input
                            label="Teléfono"
                            {...register('phone')}
                        />
                        <Input
                            label="Ciudad"
                            {...register('city')}
                        />
                    </div>

                    <Input
                        label="Dirección"
                        {...register('address')}
                    />

                    <Select
                        label="Zona Horaria"
                        options={[
                            { value: 'America/Argentina/Buenos_Aires', label: 'Argentina (GMT-3)' },
                            { value: 'America/Santiago', label: 'Chile (GMT-4)' },
                            { value: 'America/Bogota', label: 'Colombia (GMT-5)' },
                            { value: 'America/Mexico_City', label: 'México (GMT-6)' },
                            { value: 'Europe/Madrid', label: 'España (GMT+1)' },
                        ]}
                        {...register('timezone')}
                    />

                    <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-slate-700">
                        <Button type="submit" isLoading={isLoading}>
                            Guardar Cambios
                        </Button>
                    </div>
                </form>
            </div>
        </Card>
    );
}

function NotificationSettings() {
    const [isLoading, setIsLoading] = useState(false);

    const onSave = async () => {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success('Preferencias guardadas');
        setIsLoading(false);
    };

    return (
        <Card>
            <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                    Preferencias de Notificaciones
                </h2>

                <div className="space-y-6">
                    <NotificationOption
                        title="Recordatorios de Turnos"
                        description="Enviar recordatorios automáticos a los pacientes"
                        defaultChecked={true}
                    />
                    <NotificationOption
                        title="Confirmación de Turno"
                        description="Solicitar confirmación de asistencia"
                        defaultChecked={true}
                    />
                    <NotificationOption
                        title="Cancelaciones"
                        description="Notificar al paciente cuando se cancela un turno"
                        defaultChecked={true}
                    />
                    <NotificationOption
                        title="Recetas por WhatsApp"
                        description="Enviar recetas digitales vía WhatsApp"
                        defaultChecked={false}
                    />

                    <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
                        <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                            Tiempo de Anticipación
                        </h3>
                        <Select
                            label="Enviar recordatorio"
                            options={[
                                { value: '1', label: '1 hora antes' },
                                { value: '2', label: '2 horas antes' },
                                { value: '24', label: '24 horas antes' },
                                { value: '48', label: '48 horas antes' },
                            ]}
                        />
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-slate-700">
                        <Button onClick={onSave} isLoading={isLoading}>
                            Guardar Preferencias
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
}

function NotificationOption({
    title,
    description,
    defaultChecked,
}: {
    title: string;
    description: string;
    defaultChecked: boolean;
}) {
    const [enabled, setEnabled] = useState(defaultChecked);

    return (
        <div className="flex items-center justify-between">
            <div>
                <p className="font-medium text-gray-900 dark:text-white">{title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            </div>
            <button
                onClick={() => setEnabled(!enabled)}
                className={clsx(
                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                    enabled ? 'bg-primary-500' : 'bg-gray-200 dark:bg-slate-600'
                )}
            >
                <span
                    className={clsx(
                        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                        enabled ? 'translate-x-5' : 'translate-x-0'
                    )}
                />
            </button>
        </div>
    );
}

function IntegrationSettings({ clinic }: { clinic: { webhookUrl?: string; apiKey?: string } | null }) {
    const [showApiKey, setShowApiKey] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // n8n
    const { register, handleSubmit } = useForm({
        defaultValues: {
            webhookUrl: clinic?.webhookUrl || '',
        },
    });

    const onSubmit = async (data: Record<string, string>) => {
        setIsLoading(true);
        // Simulate API call for main clinic settings
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success('Webhook configurado');
        setIsLoading(false);
    };

    const generateApiKey = () => {
        toast.success('Nueva API Key generada');
    };

    // WhatsApp
    const { data: waConfig, isLoading: isLoadingWa } = useQuery({
        queryKey: ['whatsapp-config'],
        queryFn: whatsappApi.getConfig,
    });

    const { register: registerWa, handleSubmit: handleSubmitWa, formState: { isSubmitting: isSubmittingWa } } = useForm({
        values: {
            phoneNumber: waConfig?.phoneNumber || '',
            phoneNumberId: waConfig?.phoneNumberId || '',
            wabaId: waConfig?.wabaId || '',
            accessToken: waConfig?.accessToken || '',
        }
    });

    const onSaveWa = async (data: any) => {
        try {
            await whatsappApi.updateConfig(data);
            toast.success('Configuración de WhatsApp guardada');
        } catch (error) {
            toast.error('Error al guardar configuración de WhatsApp');
        }
    };

    return (
        <div className="space-y-6">
            {/* WhatsApp Integration */}
            <Card>
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <span className="text-xl">💬</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                WhatsApp Cloud API
                            </h2>
                            <p className="text-sm text-gray-500">Conecta tu número de WhatsApp Business</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmitWa(onSaveWa)} className="space-y-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4 text-sm text-blue-800 dark:text-blue-200">
                            Necesitas una cuenta en Meta For Developers y configurar un "App" con el producto WhatsApp.
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Phone Number Display Name"
                                placeholder="+54 9 11 1234 5678"
                                {...registerWa('phoneNumber', { required: true })}
                            />
                            <Input
                                label="Phone Number ID"
                                placeholder="1059..."
                                {...registerWa('phoneNumberId', { required: true })}
                            />
                        </div>

                        <Input
                            label="WhatsApp Business Account ID (WABA)"
                            placeholder="1098..."
                            {...registerWa('wabaId', { required: true })}
                        />

                        <Input
                            type="password"
                            label="System User Access Token"
                            placeholder="EAAG..."
                            hint="Token permanente generado desde el Business Manager"
                            {...registerWa('accessToken', { required: true })}
                        />

                        <div className="flex justify-end pt-2">
                            <Button type="submit" isLoading={isSubmittingWa}>
                                Guardar Credenciales WhatsApp
                            </Button>
                        </div>
                    </form>
                </div>
            </Card>

            {/* n8n Integration */}
            <Card>
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                            <span className="text-xl">🔗</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Webhooks Generales (n8n)
                            </h2>
                            <p className="text-sm text-gray-500">Notificar eventos del sistema a otros servicios</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <Input
                            label="URL del Webhook"
                            placeholder="https://tu-n8n.com/webhook/..."
                            hint="La URL donde se enviarán las notificaciones de eventos"
                            {...register('webhookUrl')}
                        />

                        <div className="flex justify-end">
                            <Button type="submit" isLoading={isLoading}>
                                Guardar Webhook
                            </Button>
                        </div>
                    </form>
                </div>
            </Card>

            {/* API Key */}
            <Card>
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        API Key
                    </h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Usa esta API Key para autenticar las peticiones desde n8n
                    </p>

                    <div className="flex items-center gap-3">
                        <div className="flex-1 p-3 bg-gray-100 dark:bg-slate-700 rounded-lg font-mono text-sm">
                            {showApiKey ? 'mt_abc123xyz789...' : '••••••••••••••••••'}
                        </div>
                        <Button variant="secondary" onClick={() => setShowApiKey(!showApiKey)}>
                            {showApiKey ? 'Ocultar' : 'Mostrar'}
                        </Button>
                        <Button variant="secondary" onClick={generateApiKey}>
                            Regenerar
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}

function SecuritySettings() {
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, watch, formState: { errors } } = useForm<{
        currentPassword: string;
        newPassword: string;
        confirmPassword: string;
    }>();

    const newPassword = watch('newPassword');

    const onSubmit = async (data: Record<string, string>) => {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success('Contraseña actualizada');
        setIsLoading(false);
    };

    return (
        <Card>
            <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                    Cambiar Contraseña
                </h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
                    <Input
                        type="password"
                        label="Contraseña Actual"
                        required
                        {...register('currentPassword', { required: 'Ingresa tu contraseña actual' })}
                    />
                    <Input
                        type="password"
                        label="Nueva Contraseña"
                        required
                        {...register('newPassword', {
                            required: 'Ingresa la nueva contraseña',
                            minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                        })}
                    />
                    <Input
                        type="password"
                        label="Confirmar Nueva Contraseña"
                        required
                        error={errors.confirmPassword?.message}
                        {...register('confirmPassword', {
                            required: 'Confirma la contraseña',
                            validate: (value) => value === newPassword || 'Las contraseñas no coinciden',
                        })}
                    />

                </form>
            </div>
        </Card>
    );
}

function BillingSettings() {
    const [subscribingTo, setSubscribingTo] = useState<string | null>(null);

    const { data: plans, isLoading: isLoadingPlans } = useQuery({
        queryKey: ['plans'],
        queryFn: billingApi.getPlans,
    });

    const { data: subscription, isLoading: isLoadingSub } = useQuery({
        queryKey: ['subscription'],
        queryFn: billingApi.getCurrentSubscription,
    });

    const handleSubscribe = async (planId: string) => {
        setSubscribingTo(planId);
        try {
            const { initPoint } = await billingApi.createSubscription(planId);
            // Redirect to Mercado Pago
            window.location.href = initPoint;
        } catch (error) {
            toast.error('Error al iniciar suscripción');
            setSubscribingTo(null);
        }
    };

    if (isLoadingPlans || isLoadingSub) {
        return (
            <Card>
                <div className="p-8 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </Card>
        );
    }

    const currentPlan = subscription?.plan || 'BASIC'; // Default to basic if no sub (e.g. trial)
    const isTrial = subscription?.status === 'TRIAL';

    // Format dates
    const trialEnds = subscription?.trialEndsAt ? new Date(subscription.trialEndsAt).toLocaleDateString() : null;
    const nextPayment = subscription?.subscription?.nextPaymentDate ? new Date(subscription.subscription.nextPaymentDate).toLocaleDateString() : null;

    return (
        <div className="space-y-6">
            {/* Status Card */}
            <Card>
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Tu Suscripción
                            </h2>
                            <p className="text-sm text-gray-500">
                                {isTrial
                                    ? `Estás en el período de prueba hasta el ${trialEnds}`
                                    : `Suscripción activa. Próximo cobro: ${nextPayment || 'N/A'}`
                                }
                            </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${isTrial ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                            }`}>
                            {isTrial ? 'Período de Prueba' : subscription?.status || 'Activo'}
                        </div>
                    </div>

                    <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Plan Actual</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                                    {plans?.find((p: any) => p.id === currentPlan)?.name || currentPlan}
                                </p>
                            </div>
                            {/* MP Icon or similar */}
                            <div className="text-right">
                                <p className="text-sm text-gray-500">Gestionado por</p>
                                <p className="font-semibold text-sky-500">Mercado Pago</p>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Plans */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans?.map((plan: any) => {
                    const isCurrent = currentPlan === plan.id;
                    return (
                        <Card key={plan.id} className={`relative overflow-hidden ${isCurrent ? 'ring-2 ring-primary-500' : ''}`}>
                            {isCurrent && (
                                <div className="absolute top-0 right-0 bg-primary-500 text-white text-xs px-2 py-1 rounded-bl-lg font-medium">
                                    Actual
                                </div>
                            )}
                            <div className="p-6 flex flex-col h-full">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    {plan.name.split('(')[0]}
                                </h3>
                                <p className="text-sm text-gray-500 mb-4 min-h-[40px]">
                                    {plan.description}
                                </p>

                                <div className="mb-6">
                                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                        ${parseInt(plan.price).toLocaleString()}
                                    </span>
                                    <span className="text-gray-500">/mes</span>
                                </div>

                                <ul className="space-y-3 mb-8 flex-1">
                                    {/* Features could be dynamic, for now we deduce from ID */}
                                    <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                                        {plan.id === 'BASIC' ? 'Hasta 3 médicos' :
                                            plan.id === 'PROFESSIONAL' ? 'Hasta 10 médicos' : 'Médicos ilimitados'}
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                                        {plan.id === 'BASIC' ? 'Sin WhatsApp' : 'Integración WhatsApp'}
                                    </li>
                                </ul>

                                <Button
                                    onClick={() => handleSubscribe(plan.id)}
                                    disabled={isCurrent || subscribingTo !== null}
                                    isLoading={subscribingTo === plan.id}
                                    variant={isCurrent ? 'secondary' : 'primary'}
                                    className="w-full"
                                >
                                    {isCurrent ? 'Plan Actual' : 'Suscribirse'}
                                </Button>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

// =============================================================================
// WHATSAPP BOT SETTINGS - PREMIUM FEATURE
// =============================================================================

function WhatsAppBotSettings({ isPlanEnabled }: { isPlanEnabled: boolean }) {
    const queryClient = useQueryClient();

    // Fetch config
    const { data: config, isLoading, error } = useQuery({
        queryKey: ['whatsapp-config'],
        queryFn: whatsappApi.getConfig,
        enabled: isPlanEnabled,
        retry: false,
    });

    // Mutation for bot settings
    const updateBotMutation = useMutation({
        mutationFn: whatsappApi.updateBotSettings,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['whatsapp-config'] });
            toast.success('Configuración del bot actualizada');
        },
        onError: () => {
            toast.error('Error al actualizar configuración');
        },
    });

    // Mutation for API credentials
    const updateConfigMutation = useMutation({
        mutationFn: whatsappApi.updateConfig,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['whatsapp-config'] });
            toast.success('Credenciales de WhatsApp guardadas');
        },
        onError: () => {
            toast.error('Error al guardar credenciales');
        },
    });

    const [isBotEnabled, setIsBotEnabled] = useState(config?.isBotEnabled ?? true);
    const [welcomeMessage, setWelcomeMessage] = useState(config?.welcomeMessage || '');
    const [showApiConfig, setShowApiConfig] = useState(false);

    // API Config form
    const { register: registerApi, handleSubmit: handleApiSubmit } = useForm({
        values: {
            phoneNumber: config?.phoneNumber || '',
            phoneNumberId: config?.phoneNumberId || '',
            wabaId: config?.wabaId || '',
            accessToken: '',
        }
    });

    // Update local state when config loads
    useState(() => {
        if (config) {
            setIsBotEnabled(config.isBotEnabled ?? true);
            setWelcomeMessage(config.welcomeMessage || '');
        }
    });

    // If plan doesn't include WhatsApp, show upgrade prompt
    if (!isPlanEnabled) {
        return (
            <Card className="overflow-hidden">
                <div className="relative">
                    {/* Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10 dark:from-green-500/20 dark:via-emerald-500/20 dark:to-teal-500/20" />

                    <div className="relative p-8 text-center">
                        {/* WhatsApp Icon */}
                        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-green-500/30">
                            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            Bot de WhatsApp
                        </h2>

                        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                            Permite a tus pacientes agendar turnos, consultar disponibilidad y recibir recordatorios automáticos por WhatsApp.
                        </p>

                        {/* Feature List */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8 text-left max-w-lg mx-auto">
                            {[
                                'Reserva de turnos 24/7',
                                'Recordatorios automáticos',
                                'Cancelación por chat',
                                'Envío de recetas',
                                'Confirmación de turnos',
                                'Soporte multi-idioma',
                            ].map((feature) => (
                                <div key={feature} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <CheckCircleIcon className="w-5 h-5 text-green-500 shrink-0" />
                                    {feature}
                                </div>
                            ))}
                        </div>

                        {/* Upgrade CTA */}
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 mb-6">
                            <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-400 font-medium mb-2">
                                <SparklesIcon className="w-5 h-5" />
                                Disponible en planes Professional y Enterprise
                            </div>
                            <p className="text-sm text-amber-600/80 dark:text-amber-500/80">
                                Actualiza tu plan para desbloquear esta funcionalidad
                            </p>
                        </div>

                        <Button
                            size="lg"
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                            onClick={() => window.location.href = '#billing'}
                        >
                            Ver Planes
                        </Button>
                    </div>
                </div>
            </Card>
        );
    }

    // If no config exists yet
    const isConfigured = !!config?.phoneNumberId;

    if (isLoading) {
        return (
            <Card>
                <div className="p-8 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Status Card */}
            <Card className="overflow-hidden">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
                                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Bot de WhatsApp
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {isConfigured ? config?.phoneNumber : 'No configurado'}
                                </p>
                            </div>
                        </div>

                        {/* Bot Toggle */}
                        {isConfigured && (
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-500">
                                    {isBotEnabled ? 'Activo' : 'Inactivo'}
                                </span>
                                <button
                                    onClick={() => {
                                        const newValue = !isBotEnabled;
                                        setIsBotEnabled(newValue);
                                        updateBotMutation.mutate({ isBotEnabled: newValue });
                                    }}
                                    className={clsx(
                                        'relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                                        isBotEnabled ? 'bg-green-500' : 'bg-gray-200 dark:bg-slate-600'
                                    )}
                                >
                                    <span
                                        className={clsx(
                                            'pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                                            isBotEnabled ? 'translate-x-7' : 'translate-x-0'
                                        )}
                                    />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Status Indicators */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className={clsx(
                            'p-4 rounded-xl border-2',
                            isConfigured
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                : 'bg-gray-50 dark:bg-slate-700/50 border-gray-200 dark:border-slate-600'
                        )}>
                            <div className="flex items-center gap-2 mb-1">
                                {isConfigured ? (
                                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                ) : (
                                    <XCircleIcon className="w-5 h-5 text-gray-400" />
                                )}
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">API</span>
                            </div>
                            <p className="text-xs text-gray-500">{isConfigured ? 'Conectado' : 'Pendiente'}</p>
                        </div>

                        <div className={clsx(
                            'p-4 rounded-xl border-2',
                            isBotEnabled && isConfigured
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                : 'bg-gray-50 dark:bg-slate-700/50 border-gray-200 dark:border-slate-600'
                        )}>
                            <div className="flex items-center gap-2 mb-1">
                                {isBotEnabled && isConfigured ? (
                                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                ) : (
                                    <XCircleIcon className="w-5 h-5 text-gray-400" />
                                )}
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Bot</span>
                            </div>
                            <p className="text-xs text-gray-500">{isBotEnabled ? 'Activo' : 'Inactivo'}</p>
                        </div>

                        <div className="p-4 rounded-xl border-2 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Hoy</span>
                            </div>
                            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">0</p>
                            <p className="text-xs text-gray-500">mensajes</p>
                        </div>

                        <div className="p-4 rounded-xl border-2 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Turnos</span>
                            </div>
                            <p className="text-lg font-bold text-purple-600 dark:text-purple-400">0</p>
                            <p className="text-xs text-gray-500">vía WhatsApp</p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Welcome Message */}
            <Card>
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Mensaje de Bienvenida
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Este mensaje se envía cuando un paciente inicia una conversación con tu bot.
                    </p>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Editor */}
                        <div>
                            <Textarea
                                value={welcomeMessage}
                                onChange={(e) => setWelcomeMessage(e.target.value)}
                                rows={6}
                                placeholder="¡Hola! 👋 Bienvenido a [Nombre de tu Clínica].

¿Qué deseas hacer hoy?

1️⃣ Agendar un turno
2️⃣ Cancelar un turno
3️⃣ Consultar mis turnos
4️⃣ Hablar con recepción"
                                className="font-mono text-sm"
                            />
                            <div className="flex justify-between items-center mt-3">
                                <p className="text-xs text-gray-500">
                                    Usa emojis para hacerlo más amigable 😊
                                </p>
                                <Button
                                    size="sm"
                                    onClick={() => updateBotMutation.mutate({ welcomeMessage })}
                                    isLoading={updateBotMutation.isPending}
                                >
                                    Guardar
                                </Button>
                            </div>
                        </div>

                        {/* Phone Preview */}
                        <div className="hidden lg:block">
                            <div className="bg-gray-900 rounded-[2.5rem] p-3 max-w-[280px] mx-auto shadow-xl">
                                <div className="bg-[#0B141A] rounded-[2rem] overflow-hidden">
                                    {/* Header */}
                                    <div className="bg-[#1F2C34] px-4 py-3 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
                                            C
                                        </div>
                                        <div>
                                            <p className="text-white font-medium text-sm">Clínica</p>
                                            <p className="text-gray-400 text-xs">en línea</p>
                                        </div>
                                    </div>

                                    {/* Chat */}
                                    <div className="p-3 min-h-[300px] bg-[url('/whatsapp-bg.png')] bg-repeat" style={{ backgroundColor: '#0B141A' }}>
                                        {/* Message Bubble */}
                                        <div className="bg-[#005C4B] rounded-lg rounded-tl-none p-3 max-w-[90%] relative">
                                            <p className="text-white text-sm whitespace-pre-wrap">
                                                {welcomeMessage || '¡Hola! 👋 Bienvenido a nuestra clínica.\n\n¿Qué deseas hacer hoy?'}
                                            </p>
                                            <p className="text-right text-[10px] text-gray-400 mt-1">
                                                12:00 ✓✓
                                            </p>
                                        </div>
                                    </div>

                                    {/* Input */}
                                    <div className="bg-[#1F2C34] px-3 py-2 flex items-center gap-2">
                                        <div className="flex-1 bg-[#2A3942] rounded-full px-4 py-2">
                                            <p className="text-gray-500 text-sm">Mensaje</p>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* API Configuration */}
            <Card>
                <div className="p-6">
                    <button
                        onClick={() => setShowApiConfig(!showApiConfig)}
                        className="w-full flex items-center justify-between"
                    >
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Configuración de API
                            </h3>
                            <p className="text-sm text-gray-500">
                                Credenciales de Meta Cloud API
                            </p>
                        </div>
                        <svg
                            className={clsx('w-5 h-5 text-gray-400 transition-transform', showApiConfig && 'rotate-180')}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {showApiConfig && (
                        <form
                            onSubmit={handleApiSubmit((data) => updateConfigMutation.mutate(data))}
                            className="mt-6 space-y-4 border-t pt-6 dark:border-slate-700"
                        >
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                                💡 Necesitas una cuenta en <a href="https://developers.facebook.com" target="_blank" rel="noopener" className="underline">Meta for Developers</a> con la API de WhatsApp Business configurada.
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Número de WhatsApp"
                                    placeholder="+54 9 11 1234 5678"
                                    {...registerApi('phoneNumber', { required: true })}
                                />
                                <Input
                                    label="Phone Number ID"
                                    placeholder="1059..."
                                    {...registerApi('phoneNumberId', { required: true })}
                                />
                            </div>

                            <Input
                                label="WhatsApp Business Account ID (WABA)"
                                placeholder="1098..."
                                {...registerApi('wabaId', { required: true })}
                            />

                            <Input
                                type="password"
                                label="Access Token"
                                placeholder="EAAG..."
                                hint="Token permanente generado desde Business Manager"
                                {...registerApi('accessToken')}
                            />

                            <div className="flex justify-end">
                                <Button type="submit" isLoading={updateConfigMutation.isPending}>
                                    Guardar Credenciales
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </Card>
        </div>
    );
}
