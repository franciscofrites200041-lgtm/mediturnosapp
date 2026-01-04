'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import {
    MagnifyingGlassIcon,
    PhoneIcon,
    CalendarDaysIcon,
    ClipboardDocumentListIcon,
    DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import { useMyPatients } from '@/lib/hooks';
import { useAuthStore, useModalStore } from '@/lib/store';
import { Button, Card, EmptyState, Spinner, Avatar, Badge } from '@/components/ui/FormElements';

interface Patient {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    birthDate?: string;
    insuranceProvider?: string;
    appointments?: Array<{
        scheduledAt: string;
        status: string;
    }>;
}

export default function MyPatientsPage() {
    const { user } = useAuthStore();
    const [search, setSearch] = useState('');
    const { openAppointmentModal, openMedicalRecordModal } = useModalStore();

    const { data: patients = [], isLoading } = useMyPatients();

    const filteredPatients = patients.filter((patient: Patient) => {
        if (!search) return true;
        const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
        return fullName.includes(search.toLowerCase()) ||
            patient.phone.includes(search);
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
                    Mis Pacientes
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Pacientes que han tenido turnos contigo
                </p>
            </div>

            {/* Search */}
            <Card padding="sm">
                <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nombre o teléfono..."
                        className="input pl-10"
                    />
                </div>
            </Card>

            {/* Patient list */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Spinner size="lg" />
                </div>
            ) : filteredPatients.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={<ClipboardDocumentListIcon className="w-8 h-8" />}
                        title="No hay pacientes"
                        description={
                            search
                                ? 'No se encontraron pacientes con esos criterios'
                                : 'Los pacientes aparecerán aquí después de que tengan turnos contigo'
                        }
                    />
                </Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredPatients.map((patient: Patient) => (
                        <PatientCard
                            key={patient.id}
                            patient={patient}
                            onSchedule={() => openAppointmentModal('create', undefined, { patientId: patient.id })}
                            onViewHistory={() => openMedicalRecordModal(patient.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function PatientCard({
    patient,
    onSchedule,
    onViewHistory,
}: {
    patient: Patient;
    onSchedule: () => void;
    onViewHistory: () => void;
}) {
    const lastAppointment = patient.appointments?.[0];
    const age = patient.birthDate
        ? Math.floor((new Date().getTime() - new Date(patient.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : null;

    return (
        <Card className="group hover:shadow-lg transition-shadow">
            <div className="p-5">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <Avatar name={`${patient.firstName} ${patient.lastName}`} size="lg" />
                    <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                            {patient.firstName} {patient.lastName}
                        </h3>
                        {age && (
                            <p className="text-sm text-gray-500">{age} años</p>
                        )}
                    </div>
                </div>

                {/* Contact */}
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <PhoneIcon className="w-4 h-4" />
                    <span>{patient.phone}</span>
                </div>

                {/* Insurance */}
                {patient.insuranceProvider && (
                    <div className="mb-3">
                        <Badge variant="info" size="sm">
                            {patient.insuranceProvider}
                        </Badge>
                    </div>
                )}

                {/* Last appointment */}
                {lastAppointment && (
                    <p className="text-xs text-gray-400 mb-4">
                        Último turno: {format(new Date(lastAppointment.scheduledAt), "d 'de' MMM", { locale: es })}
                    </p>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                    <Link href={`/dashboard/patients/${patient.id}/history`} className="flex-1">
                        <Button
                            variant="secondary"
                            size="sm"
                            className="w-full"
                            leftIcon={<ClipboardDocumentListIcon className="w-4 h-4" />}
                        >
                            Historia
                        </Button>
                    </Link>
                    <Link href={`/dashboard/patients/${patient.id}/prescriptions`} className="flex-1">
                        <Button
                            variant="secondary"
                            size="sm"
                            className="w-full"
                            leftIcon={<DocumentTextIcon className="w-4 h-4" />}
                        >
                            Recetas
                        </Button>
                    </Link>
                </div>
            </div>
        </Card>
    );
}
