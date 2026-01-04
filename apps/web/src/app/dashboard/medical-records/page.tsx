'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    MagnifyingGlassIcon,
    DocumentTextIcon,
    CalendarDaysIcon,
    UserIcon,
    ChevronRightIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePatientMedicalRecords, usePatients } from '@/lib/hooks';
import { useAuthStore } from '@/lib/store';
import { Button, Card, EmptyState, Spinner, Avatar, Badge } from '@/components/ui/FormElements';

interface MedicalRecord {
    id: string;
    createdAt: string;
    status: string;
    chiefComplaint: string;
    diagnosis?: string;
    patient: {
        id: string;
        firstName: string;
        lastName: string;
    };
    appointment?: {
        scheduledAt: string;
    };
}

const statusLabels: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'neutral' }> = {
    DRAFT: { label: 'Borrador', variant: 'neutral' },
    IN_PROGRESS: { label: 'En Progreso', variant: 'warning' },
    COMPLETED: { label: 'Completado', variant: 'success' },
};

export default function MedicalRecordsPage() {
    const { user } = useAuthStore();
    const [search, setSearch] = useState('');
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

    const { data: patients = [], isLoading: loadingPatients } = usePatients({ search });
    const { data: records = [], isLoading: loadingRecords } = usePatientMedicalRecords(selectedPatientId || '');

    // Filter patients based on search
    const filteredPatients = patients.patients?.filter((p: { firstName: string; lastName: string }) => {
        if (!search) return true;
        const name = `${p.firstName} ${p.lastName}`.toLowerCase();
        return name.includes(search.toLowerCase());
    }) || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
                    Historia Clínica
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Busca un paciente para ver su historia clínica
                </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Patient Search Sidebar */}
                <Card className="lg:col-span-1">
                    <div className="p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                            Buscar Paciente
                        </h3>
                        <div className="relative mb-4">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Nombre del paciente..."
                                className="input pl-10"
                            />
                        </div>

                        {loadingPatients ? (
                            <div className="flex justify-center py-8">
                                <Spinner />
                            </div>
                        ) : filteredPatients.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">
                                {search ? 'No se encontraron pacientes' : 'Escribe para buscar'}
                            </p>
                        ) : (
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {filteredPatients.map((patient: { id: string; firstName: string; lastName: string; documentNumber: string }) => (
                                    <button
                                        key={patient.id}
                                        onClick={() => setSelectedPatientId(patient.id)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${selectedPatientId === patient.id
                                                ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
                                                : 'hover:bg-gray-50 dark:hover:bg-slate-800'
                                            }`}
                                    >
                                        <Avatar name={`${patient.firstName} ${patient.lastName}`} size="sm" />
                                        <div className="flex-1 text-left">
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {patient.firstName} {patient.lastName}
                                            </p>
                                            <p className="text-sm text-gray-500">DNI: {patient.documentNumber}</p>
                                        </div>
                                        <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>

                {/* Medical Records */}
                <div className="lg:col-span-2">
                    {!selectedPatientId ? (
                        <Card>
                            <EmptyState
                                icon={<DocumentTextIcon className="w-8 h-8" />}
                                title="Selecciona un paciente"
                                description="Busca y selecciona un paciente para ver su historia clínica"
                            />
                        </Card>
                    ) : loadingRecords ? (
                        <div className="flex justify-center py-12">
                            <Spinner size="lg" />
                        </div>
                    ) : records.length === 0 ? (
                        <Card>
                            <EmptyState
                                icon={<DocumentTextIcon className="w-8 h-8" />}
                                title="Sin registros"
                                description="Este paciente no tiene registros de historia clínica todavía"
                            />
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    Registros ({records.length})
                                </h3>
                                <Link href={`/dashboard/patients/${selectedPatientId}/history`}>
                                    <Button variant="secondary" size="sm">
                                        Ver Historial Completo
                                    </Button>
                                </Link>
                            </div>
                            {records.map((record: MedicalRecord) => (
                                <RecordCard key={record.id} record={record} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function RecordCard({ record }: { record: MedicalRecord }) {
    const status = statusLabels[record.status] || statusLabels.DRAFT;

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <CalendarDaysIcon className="w-5 h-5 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            {format(new Date(record.createdAt), "d 'de' MMMM yyyy", { locale: es })}
                        </span>
                    </div>
                    <Badge variant={status.variant} size="sm">
                        {status.label}
                    </Badge>
                </div>

                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {record.chiefComplaint || 'Sin motivo de consulta'}
                </h4>

                {record.diagnosis && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        <strong>Diagnóstico:</strong> {record.diagnosis}
                    </p>
                )}

                <Link href={`/dashboard/medical-records/${record.id}`}>
                    <Button variant="secondary" size="sm" className="w-full">
                        Ver Detalle
                    </Button>
                </Link>
            </div>
        </Card>
    );
}
