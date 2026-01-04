'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    ArrowLeftIcon,
    PlusIcon,
    PaperAirplaneIcon,
    PrinterIcon,
    DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { usePatient, usePatientPrescriptions, useSendPrescription } from '@/lib/hooks';
import { useModalStore } from '@/lib/store';
import { Button, Card, EmptyState, Spinner, Avatar, Badge } from '@/components/ui/FormElements';
import PrescriptionModal from '@/components/prescriptions/PrescriptionModal';

interface Prescription {
    id: string;
    createdAt: string;
    status: string;
    medications: Array<{
        name: string;
        dosage: string;
        frequency: string;
        duration: string;
        instructions?: string;
    }>;
    notes?: string;
    doctor: {
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

export default function PatientPrescriptionsPage() {
    const params = useParams();
    const router = useRouter();
    const patientId = params.id as string;

    const { openPrescriptionModal } = useModalStore();
    const sendMutation = useSendPrescription();

    const { data: patient, isLoading: loadingPatient } = usePatient(patientId);
    const { data: prescriptions = [], isLoading: loadingPrescriptions } = usePatientPrescriptions(patientId);

    const handleSend = async (id: string) => {
        await sendMutation.mutateAsync(id);
    };

    const isLoading = loadingPatient || loadingPrescriptions;

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!patient) {
        return (
            <Card>
                <EmptyState
                    icon={<DocumentTextIcon className="w-8 h-8" />}
                    title="Paciente no encontrado"
                    description="El paciente que buscas no existe"
                    action={
                        <Button onClick={() => router.back()}>
                            Volver
                        </Button>
                    }
                />
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                    <ArrowLeftIcon className="w-5 h-5 text-gray-500" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
                        Recetas de {patient.firstName} {patient.lastName}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        DNI: {patient.documentNumber}
                    </p>
                </div>
                <Button
                    leftIcon={<PlusIcon className="w-5 h-5" />}
                    onClick={() => openPrescriptionModal(patientId)}
                >
                    Nueva Receta
                </Button>
            </div>

            {/* Patient info card */}
            <Card>
                <div className="p-4 flex items-center gap-4">
                    <Avatar name={`${patient.firstName} ${patient.lastName}`} size="lg" />
                    <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                            {patient.firstName} {patient.lastName}
                        </h3>
                        <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-500">
                            <span>📞 {patient.phone}</span>
                            {patient.email && <span>✉️ {patient.email}</span>}
                            {patient.insuranceProvider && (
                                <Badge variant="info" size="sm">{patient.insuranceProvider}</Badge>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Prescriptions list */}
            {prescriptions.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={<DocumentTextIcon className="w-8 h-8" />}
                        title="Sin recetas"
                        description="Este paciente no tiene recetas todavía"
                        action={
                            <Button
                                leftIcon={<PlusIcon className="w-5 h-5" />}
                                onClick={() => openPrescriptionModal(patientId)}
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

            {/* Prescription Modal */}
            <PrescriptionModal />
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
                            {format(new Date(prescription.createdAt), "EEEE, d 'de' MMMM yyyy", { locale: es })}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            Dr. {prescription.doctor?.firstName} {prescription.doctor?.lastName}
                        </p>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                </div>

                {/* Medications */}
                <div className="space-y-3 mb-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">Medicamentos:</h4>
                    {prescription.medications?.map((med, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
                            <p className="font-semibold text-gray-900 dark:text-white">{med.name}</p>
                            <div className="mt-2 grid grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <div>
                                    <span className="text-gray-400">Dosis:</span> {med.dosage}
                                </div>
                                <div>
                                    <span className="text-gray-400">Frecuencia:</span> {med.frequency}
                                </div>
                                <div>
                                    <span className="text-gray-400">Duración:</span> {med.duration}
                                </div>
                            </div>
                            {med.instructions && (
                                <p className="mt-2 text-sm text-gray-500 italic">
                                    {med.instructions}
                                </p>
                            )}
                        </div>
                    )) || (
                            <p className="text-gray-500 text-sm">No hay medicamentos registrados</p>
                        )}
                </div>

                {prescription.notes && (
                    <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                            <strong>Notas:</strong> {prescription.notes}
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-slate-700">
                    <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<PrinterIcon className="w-4 h-4" />}
                        onClick={() => window.print()}
                    >
                        Imprimir
                    </Button>
                    {prescription.status !== 'SENT' && prescription.status !== 'DISPENSED' && (
                        <Button
                            size="sm"
                            leftIcon={<PaperAirplaneIcon className="w-4 h-4" />}
                            onClick={onSend}
                            isLoading={isSending}
                        >
                            Enviar al Paciente
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );
}
