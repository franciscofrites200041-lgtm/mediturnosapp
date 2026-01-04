'use client';

import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    ArrowLeftIcon,
    DocumentTextIcon,
    CalendarDaysIcon,
    ClipboardDocumentListIcon,
    HeartIcon,
} from '@heroicons/react/24/outline';
import { usePatient, usePatientMedicalRecords } from '@/lib/hooks';
import { useModalStore } from '@/lib/store';
import { Button, Card, EmptyState, Spinner, Avatar, Badge } from '@/components/ui/FormElements';

interface MedicalRecord {
    id: string;
    createdAt: string;
    completedAt?: string;
    status: string;
    chiefComplaint: string;
    diagnosis?: string;
    treatmentPlan?: string;
    vitalSigns?: {
        bloodPressure?: string;
        heartRate?: number;
        temperature?: number;
        weight?: number;
        height?: number;
        oxygenSaturation?: number;
    };
    doctor: {
        firstName: string;
        lastName: string;
    };
    appointment?: {
        scheduledAt: string;
        area: {
            name: string;
            color: string;
        };
    };
}

const statusLabels: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'neutral' }> = {
    DRAFT: { label: 'Borrador', variant: 'neutral' },
    IN_PROGRESS: { label: 'En Progreso', variant: 'warning' },
    COMPLETED: { label: 'Completado', variant: 'success' },
};

export default function PatientHistoryPage() {
    const params = useParams();
    const router = useRouter();
    const patientId = params.id as string;

    const { openMedicalRecordModal } = useModalStore();

    const { data: patient, isLoading: loadingPatient } = usePatient(patientId);
    const { data: records = [], isLoading: loadingRecords } = usePatientMedicalRecords(patientId);

    const isLoading = loadingPatient || loadingRecords;

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
                    icon={<ClipboardDocumentListIcon className="w-8 h-8" />}
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

    const age = patient.birthDate
        ? Math.floor((new Date().getTime() - new Date(patient.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : null;

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
                        Historia Clínica
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {patient.firstName} {patient.lastName}
                    </p>
                </div>
            </div>

            {/* Patient info card */}
            <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white overflow-hidden">
                <div className="p-6 relative">
                    <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
                    <div className="absolute -right-5 -bottom-5 w-24 h-24 rounded-full bg-white/10" />

                    <div className="relative flex items-start gap-5">
                        <Avatar name={`${patient.firstName} ${patient.lastName}`} size="xl" className="border-2 border-white/30" />
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold">
                                {patient.firstName} {patient.lastName}
                            </h2>
                            <p className="text-primary-100 mt-1">
                                DNI: {patient.documentNumber}
                                {age && ` • ${age} años`}
                            </p>
                            <div className="flex flex-wrap gap-3 mt-3">
                                {patient.phone && (
                                    <span className="px-3 py-1 rounded-full bg-white/20 text-sm">
                                        📞 {patient.phone}
                                    </span>
                                )}
                                {patient.insuranceProvider && (
                                    <span className="px-3 py-1 rounded-full bg-white/20 text-sm">
                                        🏥 {patient.insuranceProvider}
                                    </span>
                                )}
                                {patient.bloodType && (
                                    <span className="px-3 py-1 rounded-full bg-white/20 text-sm">
                                        🩸 {patient.bloodType}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-primary-100 text-sm">Total Consultas</p>
                            <p className="text-4xl font-bold">{records.length}</p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Medical records timeline */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Historial de Consultas
                </h2>

                {records.length === 0 ? (
                    <Card>
                        <EmptyState
                            icon={<ClipboardDocumentListIcon className="w-8 h-8" />}
                            title="Sin registros"
                            description="Este paciente no tiene historia clínica todavía"
                        />
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {records.map((record: MedicalRecord, index: number) => (
                            <MedicalRecordCard
                                key={record.id}
                                record={record}
                                isFirst={index === 0}
                                onClick={() => openMedicalRecordModal(patientId, record.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function MedicalRecordCard({
    record,
    isFirst,
    onClick,
}: {
    record: MedicalRecord;
    isFirst: boolean;
    onClick: () => void;
}) {
    const status = statusLabels[record.status] || statusLabels.DRAFT;

    return (
        <Card
            className={`hover:shadow-lg transition-all cursor-pointer ${isFirst ? 'ring-2 ring-primary-200 dark:ring-primary-800' : ''}`}
            onClick={onClick}
        >
            <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                            style={{ backgroundColor: record.appointment?.area?.color || '#6366f1' }}
                        >
                            <CalendarDaysIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                                {format(new Date(record.createdAt), "EEEE, d 'de' MMMM yyyy", { locale: es })}
                            </p>
                            <p className="text-sm text-gray-500">
                                Dr. {record.doctor?.firstName} {record.doctor?.lastName}
                                {record.appointment?.area && ` • ${record.appointment.area.name}`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isFirst && (
                            <Badge variant="info" size="sm">Última consulta</Badge>
                        )}
                        <Badge variant={status.variant} size="sm">{status.label}</Badge>
                    </div>
                </div>

                {/* Chief complaint */}
                <div className="mb-4">
                    <p className="text-sm text-gray-400 mb-1">Motivo de Consulta</p>
                    <p className="text-gray-900 dark:text-white">{record.chiefComplaint || 'No especificado'}</p>
                </div>

                {/* Diagnosis */}
                {record.diagnosis && (
                    <div className="mb-4">
                        <p className="text-sm text-gray-400 mb-1">Diagnóstico</p>
                        <p className="text-gray-700 dark:text-gray-300">{record.diagnosis}</p>
                    </div>
                )}

                {/* Vital signs */}
                {record.vitalSigns && Object.keys(record.vitalSigns).length > 0 && (
                    <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                        <HeartIcon className="w-5 h-5 text-red-500" />
                        <div className="flex flex-wrap gap-4 text-sm">
                            {record.vitalSigns.bloodPressure && (
                                <span>PA: {record.vitalSigns.bloodPressure}</span>
                            )}
                            {record.vitalSigns.heartRate && (
                                <span>FC: {record.vitalSigns.heartRate} bpm</span>
                            )}
                            {record.vitalSigns.temperature && (
                                <span>Temp: {record.vitalSigns.temperature}°C</span>
                            )}
                            {record.vitalSigns.weight && (
                                <span>Peso: {record.vitalSigns.weight} kg</span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}
