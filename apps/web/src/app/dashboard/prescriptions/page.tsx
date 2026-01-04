'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    MagnifyingGlassIcon,
    DocumentTextIcon,
    PlusIcon,
    PaperAirplaneIcon,
    PrinterIcon,
    UserIcon,
} from '@heroicons/react/24/outline';
import { usePatientPrescriptions, usePatients, useSendPrescription } from '@/lib/hooks';
import { useAuthStore, useModalStore } from '@/lib/store';
import { Button, Card, EmptyState, Spinner, Avatar, Badge } from '@/components/ui/FormElements';

interface Prescription {
    id: string;
    createdAt: string;
    status: string;
    medications: Array<{
        name: string;
        dosage: string;
        frequency: string;
        duration: string;
    }>;
    notes?: string;
    patient: {
        id: string;
        firstName: string;
        lastName: string;
    };
}

const statusLabels: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'neutral' }> = {
    DRAFT: { label: 'Borrador', variant: 'neutral' },
    SIGNED: { label: 'Firmada', variant: 'info' },
    SENT: { label: 'Enviada', variant: 'success' },
    DISPENSED: { label: 'Dispensada', variant: 'success' },
};

export default function PrescriptionsPage() {
    const { user } = useAuthStore();
    const [search, setSearch] = useState('');
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const { openPrescriptionModal } = useModalStore();
    const sendMutation = useSendPrescription();

    const { data: patients = [], isLoading: loadingPatients } = usePatients({ search });
    const { data: prescriptions = [], isLoading: loadingPrescriptions } = usePatientPrescriptions(selectedPatientId || '');

    const handleSend = async (id: string) => {
        await sendMutation.mutateAsync(id);
    };

    // Filter patients based on search
    const filteredPatients = patients.patients?.filter((p: { firstName: string; lastName: string }) => {
        if (!search) return true;
        const name = `${p.firstName} ${p.lastName}`.toLowerCase();
        return name.includes(search.toLowerCase());
    }) || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
                        Recetas
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Gestiona las recetas de tus pacientes
                    </p>
                </div>
                {selectedPatientId && (
                    <Button
                        leftIcon={<PlusIcon className="w-5 h-5" />}
                        onClick={() => openPrescriptionModal(selectedPatientId)}
                    >
                        Nueva Receta
                    </Button>
                )}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Patient Search Sidebar */}
                <Card className="lg:col-span-1">
                    <div className="p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                            Seleccionar Paciente
                        </h3>
                        <div className="relative mb-4">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar paciente..."
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
                                {filteredPatients.map((patient: { id: string; firstName: string; lastName: string }) => (
                                    <button
                                        key={patient.id}
                                        onClick={() => setSelectedPatientId(patient.id)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${selectedPatientId === patient.id
                                            ? 'bg-primary-50 dark:bg-primary-900/20'
                                            : 'hover:bg-gray-50 dark:hover:bg-slate-800'
                                            }`}
                                    >
                                        <Avatar name={`${patient.firstName} ${patient.lastName}`} size="sm" />
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {patient.firstName} {patient.lastName}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>

                {/* Prescriptions List */}
                <div className="lg:col-span-2">
                    {!selectedPatientId ? (
                        <Card>
                            <EmptyState
                                icon={<DocumentTextIcon className="w-8 h-8" />}
                                title="Selecciona un paciente"
                                description="Busca y selecciona un paciente para ver o crear recetas"
                            />
                        </Card>
                    ) : loadingPrescriptions ? (
                        <div className="flex justify-center py-12">
                            <Spinner size="lg" />
                        </div>
                    ) : prescriptions.length === 0 ? (
                        <Card>
                            <EmptyState
                                icon={<DocumentTextIcon className="w-8 h-8" />}
                                title="Sin recetas"
                                description="Este paciente no tiene recetas todavía"
                                action={
                                    <Button
                                        leftIcon={<PlusIcon className="w-5 h-5" />}
                                        onClick={() => openPrescriptionModal(selectedPatientId)}
                                    >
                                        Crear Receta
                                    </Button>
                                }
                            />
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {prescriptions.map((prescription: Prescription) => (
                                <PrescriptionCard
                                    key={prescription.id}
                                    prescription={prescription}
                                    onSend={() => handleSend(prescription.id)}
                                    isSending={sendMutation.isPending}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function PrescriptionCard({
    prescription,
    onSend,
    isSending,
}: {
    prescription: Prescription;
    onSend: () => void;
    isSending: boolean;
}) {
    const status = statusLabels[prescription.status] || statusLabels.DRAFT;

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-sm text-gray-500">
                            {format(new Date(prescription.createdAt), "d 'de' MMMM yyyy", { locale: es })}
                        </p>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                </div>

                {/* Medications */}
                <div className="space-y-3 mb-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">Medicamentos:</h4>
                    {prescription.medications?.map((med, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3">
                            <p className="font-medium text-gray-900 dark:text-white">{med.name}</p>
                            <p className="text-sm text-gray-500">
                                {med.dosage} - {med.frequency} - {med.duration}
                            </p>
                        </div>
                    )) || (
                            <p className="text-gray-500 text-sm">No hay medicamentos registrados</p>
                        )}
                </div>

                {prescription.notes && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        <strong>Notas:</strong> {prescription.notes}
                    </p>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<PrinterIcon className="w-4 h-4" />}
                        onClick={() => window.print()}
                    >
                        Imprimir
                    </Button>
                    {prescription.status !== 'SENT' && (
                        <Button
                            size="sm"
                            leftIcon={<PaperAirplaneIcon className="w-4 h-4" />}
                            onClick={onSend}
                            isLoading={isSending}
                        >
                            Enviar
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );
}
