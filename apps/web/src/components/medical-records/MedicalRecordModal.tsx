'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '@/components/ui/Modal';
import { Input, Select, Textarea, Button } from '@/components/ui/FormElements';
import { useModalStore } from '@/lib/store';
import { useCreateMedicalRecord, useUpdateMedicalRecord, useCompleteMedicalRecord, usePatient, useMedicalRecord } from '@/lib/hooks';
import { CreateMedicalRecordData, VitalSigns } from '@/lib/api';

interface MedicalRecordFormData {
    chiefComplaint: string;
    presentIllness: string;
    physicalExam: string;
    diagnosis: string;
    diagnosisCode: string;
    treatmentPlan: string;
    notes: string;
    // Vital signs
    bloodPressure: string;
    heartRate: string;
    temperature: string;
    weight: string;
    height: string;
    oxygenSaturation: string;
    // Follow-up
    labOrders: string;
    imagingOrders: string;
    followUpDate: string;
    followUpNotes: string;
}

export default function MedicalRecordModal() {
    const {
        medicalRecordModalOpen,
        selectedMedicalRecordPatientId,
        selectedAppointmentForRecord,
        closeMedicalRecordModal,
    } = useModalStore();

    const { data: patient } = usePatient(selectedMedicalRecordPatientId || '');
    const createMutation = useCreateMedicalRecord();
    const updateMutation = useUpdateMedicalRecord();
    const completeMutation = useCompleteMedicalRecord();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isDirty },
    } = useForm<MedicalRecordFormData>({
        defaultValues: {
            chiefComplaint: '',
            presentIllness: '',
            physicalExam: '',
            diagnosis: '',
            diagnosisCode: '',
            treatmentPlan: '',
            notes: '',
            bloodPressure: '',
            heartRate: '',
            temperature: '',
            weight: '',
            height: '',
            oxygenSaturation: '',
            labOrders: '',
            imagingOrders: '',
            followUpDate: '',
            followUpNotes: '',
        },
    });

    useEffect(() => {
        if (!medicalRecordModalOpen) {
            reset();
        }
    }, [medicalRecordModalOpen, reset]);

    const onSubmit = async (data: MedicalRecordFormData, complete = false) => {
        if (!selectedMedicalRecordPatientId) return;

        const vitalSigns: VitalSigns = {
            bloodPressure: data.bloodPressure || undefined,
            heartRate: data.heartRate ? parseInt(data.heartRate) : undefined,
            temperature: data.temperature ? parseFloat(data.temperature) : undefined,
            weight: data.weight ? parseFloat(data.weight) : undefined,
            height: data.height ? parseFloat(data.height) : undefined,
            oxygenSaturation: data.oxygenSaturation ? parseInt(data.oxygenSaturation) : undefined,
        };

        const payload: CreateMedicalRecordData = {
            patientId: selectedMedicalRecordPatientId,
            appointmentId: selectedAppointmentForRecord || undefined,
            chiefComplaint: data.chiefComplaint || undefined,
            presentIllness: data.presentIllness || undefined,
            physicalExam: data.physicalExam || undefined,
            diagnosis: data.diagnosis || undefined,
            diagnosisCode: data.diagnosisCode || undefined,
            treatmentPlan: data.treatmentPlan || undefined,
            notes: data.notes || undefined,
            vitalSigns: Object.values(vitalSigns).some((v) => v !== undefined) ? vitalSigns : undefined,
            labOrders: data.labOrders || undefined,
            imagingOrders: data.imagingOrders || undefined,
            followUpDate: data.followUpDate || undefined,
            followUpNotes: data.followUpNotes || undefined,
        };

        const result = await createMutation.mutateAsync(payload);

        if (complete && result.id) {
            await completeMutation.mutateAsync(result.id);
        }

        closeMedicalRecordModal();
    };

    const handleSaveDraft = () => {
        handleSubmit((data) => onSubmit(data, false))();
    };

    const handleComplete = () => {
        handleSubmit((data) => onSubmit(data, true))();
    };

    const isLoading = createMutation.isPending || completeMutation.isPending;

    return (
        <Modal
            isOpen={medicalRecordModalOpen}
            onClose={closeMedicalRecordModal}
            title="Historia Clínica"
            size="full"
        >
            {/* Patient header */}
            {patient && (
                <div className="flex items-center gap-4 p-4 mb-6 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white font-bold text-lg">
                        {patient.firstName[0]}
                        {patient.lastName[0]}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {patient.firstName} {patient.lastName}
                        </h3>
                        <p className="text-gray-500">
                            DNI: {patient.documentNumber}
                            {patient.birthDate && ` • ${calculateAge(patient.birthDate)} años`}
                            {patient.insuranceProvider && ` • ${patient.insuranceProvider}`}
                        </p>
                    </div>
                </div>
            )}

            <form className="space-y-8">
                {/* Vital Signs */}
                <section>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                        Signos Vitales
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                        <Input
                            label="Presión Arterial"
                            placeholder="120/80"
                            {...register('bloodPressure')}
                        />
                        <Input
                            label="Frecuencia Cardíaca"
                            placeholder="72"
                            type="number"
                            {...register('heartRate')}
                        />
                        <Input
                            label="Temperatura (°C)"
                            placeholder="36.5"
                            type="number"
                            step="0.1"
                            {...register('temperature')}
                        />
                        <Input
                            label="Peso (kg)"
                            placeholder="70"
                            type="number"
                            step="0.1"
                            {...register('weight')}
                        />
                        <Input
                            label="Altura (cm)"
                            placeholder="170"
                            type="number"
                            {...register('height')}
                        />
                        <Input
                            label="Sat. O₂ (%)"
                            placeholder="98"
                            type="number"
                            {...register('oxygenSaturation')}
                        />
                    </div>
                </section>

                {/* Consultation */}
                <section>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                        Consulta
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <Textarea
                            label="Motivo de Consulta"
                            placeholder="¿Por qué viene el paciente hoy?"
                            {...register('chiefComplaint')}
                        />
                        <Textarea
                            label="Enfermedad Actual"
                            placeholder="Historia de la enfermedad presente..."
                            {...register('presentIllness')}
                        />
                        <Textarea
                            label="Examen Físico"
                            placeholder="Hallazgos del examen físico..."
                            {...register('physicalExam')}
                        />
                        <div className="space-y-4">
                            <Textarea
                                label="Diagnóstico"
                                placeholder="Diagnóstico del paciente..."
                                {...register('diagnosis')}
                            />
                            <Input
                                label="Código CIE-10"
                                placeholder="Ej: J06.9"
                                {...register('diagnosisCode')}
                            />
                        </div>
                    </div>
                </section>

                {/* Treatment Plan */}
                <section>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                        Plan de Tratamiento
                    </h3>
                    <Textarea
                        label="Plan de Tratamiento"
                        placeholder="Indicaciones, medicamentos, recomendaciones..."
                        className="min-h-[150px]"
                        {...register('treatmentPlan')}
                    />
                </section>

                {/* Studies */}
                <section>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                        Estudios Solicitados
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <Textarea
                            label="Laboratorio"
                            placeholder="Hemograma, glucemia, etc..."
                            {...register('labOrders')}
                        />
                        <Textarea
                            label="Imágenes"
                            placeholder="Rx, Ecografía, TAC, etc..."
                            {...register('imagingOrders')}
                        />
                    </div>
                </section>

                {/* Follow-up */}
                <section>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                        Seguimiento
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <Input
                            type="date"
                            label="Próxima Cita"
                            {...register('followUpDate')}
                        />
                        <Input
                            label="Notas de Seguimiento"
                            placeholder="Instrucciones para la próxima visita..."
                            {...register('followUpNotes')}
                        />
                    </div>
                </section>

                {/* Additional Notes */}
                <Textarea
                    label="Notas Adicionales"
                    placeholder="Cualquier otra información relevante..."
                    {...register('notes')}
                />

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                    <Button type="button" variant="secondary" onClick={closeMedicalRecordModal}>
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={handleSaveDraft}
                        isLoading={isLoading && !completeMutation.isPending}
                    >
                        Guardar Borrador
                    </Button>
                    <Button
                        type="button"
                        onClick={handleComplete}
                        isLoading={completeMutation.isPending}
                    >
                        Finalizar Consulta
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

function calculateAge(birthDate: string): number {
    return Math.floor(
        (new Date().getTime() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    );
}
