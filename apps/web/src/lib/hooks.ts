'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    appointmentsApi,
    patientsApi,
    usersApi,
    areasApi,
    medicalRecordsApi,
    prescriptionsApi,
    schedulesApi,
    authApi,
    CreateAppointmentData,
    UpdateAppointmentData,
    CreatePatientData,
    UpdatePatientData,
    CreateUserData,
    UpdateUserData,
    CreateAreaData,
    UpdateAreaData,
    CreateMedicalRecordData,
    UpdateMedicalRecordData,
    CreatePrescriptionData,
    CreateScheduleData,
    UpdateScheduleData,
    QueryAppointmentsParams,
    QueryPatientsParams,
    QueryUsersParams,
} from './api';
import toast from 'react-hot-toast';

// ==========================================
// AUTH HOOKS
// ==========================================

export function useCurrentUser() {
    return useQuery({
        queryKey: ['currentUser'],
        queryFn: authApi.me,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: false,
    });
}

// ==========================================
// APPOINTMENTS HOOKS
// ==========================================

export function useAppointments(params?: QueryAppointmentsParams) {
    return useQuery({
        queryKey: ['appointments', params],
        queryFn: () => appointmentsApi.getAll(params),
    });
}

export function useCalendarAppointments(startDate: string, endDate: string, doctorId?: string, areaId?: string) {
    return useQuery({
        queryKey: ['calendarAppointments', startDate, endDate, doctorId, areaId],
        queryFn: () => appointmentsApi.getCalendar(startDate, endDate, doctorId, areaId),
        enabled: !!startDate && !!endDate,
    });
}

export function useMyAgenda(date?: string) {
    return useQuery({
        queryKey: ['myAgenda', date],
        queryFn: () => appointmentsApi.getMyAgenda(date),
    });
}

export function useAppointmentAvailability(doctorId: string, date: string) {
    return useQuery({
        queryKey: ['availability', doctorId, date],
        queryFn: () => appointmentsApi.getAvailability(doctorId, date),
        enabled: !!doctorId && !!date,
    });
}

export function useAppointment(id: string) {
    return useQuery({
        queryKey: ['appointment', id],
        queryFn: () => appointmentsApi.getOne(id),
        enabled: !!id,
    });
}

export function useCreateAppointment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateAppointmentData) => appointmentsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            queryClient.invalidateQueries({ queryKey: ['calendarAppointments'] });
            queryClient.invalidateQueries({ queryKey: ['myAgenda'] });
            toast.success('Turno creado exitosamente');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al crear el turno');
        },
    });
}

export function useUpdateAppointment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateAppointmentData }) =>
            appointmentsApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            queryClient.invalidateQueries({ queryKey: ['calendarAppointments'] });
            queryClient.invalidateQueries({ queryKey: ['myAgenda'] });
            toast.success('Turno actualizado');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al actualizar el turno');
        },
    });
}

export function useUpdateAppointmentStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status, cancelReason }: { id: string; status: string; cancelReason?: string }) =>
            appointmentsApi.updateStatus(id, status, cancelReason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            queryClient.invalidateQueries({ queryKey: ['calendarAppointments'] });
            queryClient.invalidateQueries({ queryKey: ['myAgenda'] });
            toast.success('Estado actualizado');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al cambiar el estado');
        },
    });
}

export function useCancelAppointment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
            appointmentsApi.cancel(id, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            queryClient.invalidateQueries({ queryKey: ['calendarAppointments'] });
            queryClient.invalidateQueries({ queryKey: ['myAgenda'] });
            toast.success('Turno cancelado');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al cancelar el turno');
        },
    });
}

// ==========================================
// PATIENTS HOOKS
// ==========================================

export function usePatients(params?: QueryPatientsParams) {
    return useQuery({
        queryKey: ['patients', params],
        queryFn: () => patientsApi.getAll(params),
    });
}

export function usePatient(id: string) {
    return useQuery({
        queryKey: ['patient', id],
        queryFn: () => patientsApi.getOne(id),
        enabled: !!id,
    });
}

export function useSearchPatients(query: string) {
    return useQuery({
        queryKey: ['patientSearch', query],
        queryFn: () => patientsApi.search(query),
        enabled: query.length >= 2,
    });
}

export function useMyPatients() {
    return useQuery({
        queryKey: ['myPatients'],
        queryFn: () => patientsApi.getMyPatients(),
    });
}

export function useCreatePatient() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreatePatientData) => patientsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patients'] });
            toast.success('Paciente creado exitosamente');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al crear el paciente');
        },
    });
}

export function useUpdatePatient() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdatePatientData }) =>
            patientsApi.update(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['patients'] });
            queryClient.invalidateQueries({ queryKey: ['patient', id] });
            toast.success('Paciente actualizado');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al actualizar el paciente');
        },
    });
}

export function useDeletePatient() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => patientsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patients'] });
            toast.success('Paciente eliminado');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al eliminar el paciente');
        },
    });
}

// ==========================================
// USERS/DOCTORS HOOKS
// ==========================================

export function useUsers(params?: QueryUsersParams) {
    return useQuery({
        queryKey: ['users', params],
        queryFn: () => usersApi.getAll(params),
    });
}

export function useDoctors() {
    return useQuery({
        queryKey: ['doctors'],
        queryFn: () => usersApi.getDoctors(),
    });
}

export function useUser(id: string) {
    return useQuery({
        queryKey: ['user', id],
        queryFn: () => usersApi.getOne(id),
        enabled: !!id,
    });
}

export function useCreateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateUserData) => usersApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['doctors'] });
            toast.success('Usuario creado exitosamente');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al crear el usuario');
        },
    });
}

export function useUpdateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateUserData }) =>
            usersApi.update(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['doctors'] });
            queryClient.invalidateQueries({ queryKey: ['user', id] });
            toast.success('Usuario actualizado');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al actualizar el usuario');
        },
    });
}

export function useDeleteUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => usersApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['doctors'] });
            toast.success('Usuario eliminado');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al eliminar el usuario');
        },
    });
}

// ==========================================
// AREAS HOOKS
// ==========================================

export function useAreas() {
    return useQuery({
        queryKey: ['areas'],
        queryFn: () => areasApi.getAll(),
    });
}

export function useArea(id: string) {
    return useQuery({
        queryKey: ['area', id],
        queryFn: () => areasApi.getOne(id),
        enabled: !!id,
    });
}

export function useCreateArea() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateAreaData) => areasApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['areas'] });
            toast.success('Área creada exitosamente');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al crear el área');
        },
    });
}

export function useUpdateArea() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateAreaData }) =>
            areasApi.update(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['areas'] });
            queryClient.invalidateQueries({ queryKey: ['area', id] });
            toast.success('Área actualizada');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al actualizar el área');
        },
    });
}

export function useDeleteArea() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => areasApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['areas'] });
            toast.success('Área eliminada');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al eliminar el área');
        },
    });
}

// ==========================================
// MEDICAL RECORDS HOOKS
// ==========================================

export function usePatientMedicalRecords(patientId: string) {
    return useQuery({
        queryKey: ['medicalRecords', patientId],
        queryFn: () => medicalRecordsApi.getByPatient(patientId),
        enabled: !!patientId,
    });
}

export function useMedicalRecord(id: string) {
    return useQuery({
        queryKey: ['medicalRecord', id],
        queryFn: () => medicalRecordsApi.getOne(id),
        enabled: !!id,
    });
}

export function useCreateMedicalRecord() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateMedicalRecordData) => medicalRecordsApi.create(data),
        onSuccess: (_, { patientId }) => {
            queryClient.invalidateQueries({ queryKey: ['medicalRecords', patientId] });
            toast.success('Historia clínica creada');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al crear la historia clínica');
        },
    });
}

export function useUpdateMedicalRecord() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateMedicalRecordData }) =>
            medicalRecordsApi.update(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['medicalRecord', id] });
            queryClient.invalidateQueries({ queryKey: ['medicalRecords'] });
            toast.success('Historia clínica actualizada');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al actualizar la historia clínica');
        },
    });
}

export function useCompleteMedicalRecord() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => medicalRecordsApi.complete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['medicalRecords'] });
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            queryClient.invalidateQueries({ queryKey: ['myAgenda'] });
            toast.success('Consulta finalizada');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al finalizar la consulta');
        },
    });
}

// ==========================================
// PRESCRIPTIONS HOOKS
// ==========================================

export function usePatientPrescriptions(patientId: string) {
    return useQuery({
        queryKey: ['prescriptions', patientId],
        queryFn: () => prescriptionsApi.getByPatient(patientId),
        enabled: !!patientId,
    });
}

export function usePrescription(id: string) {
    return useQuery({
        queryKey: ['prescription', id],
        queryFn: () => prescriptionsApi.getOne(id),
        enabled: !!id,
    });
}

export function useCreatePrescription() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreatePrescriptionData) => prescriptionsApi.create(data),
        onSuccess: (_, { patientId }) => {
            queryClient.invalidateQueries({ queryKey: ['prescriptions', patientId] });
            toast.success('Receta creada');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al crear la receta');
        },
    });
}

export function useSendPrescription() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => prescriptionsApi.send(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
            toast.success('Receta enviada al paciente');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al enviar la receta');
        },
    });
}

// ==========================================
// SCHEDULES HOOKS
// ==========================================

export function useDoctorSchedules(doctorId: string) {
    return useQuery({
        queryKey: ['schedules', doctorId],
        queryFn: () => schedulesApi.getByDoctor(doctorId),
        enabled: !!doctorId,
    });
}

export function useCreateSchedule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateScheduleData) => schedulesApi.create(data),
        onSuccess: (_, { doctorId }) => {
            queryClient.invalidateQueries({ queryKey: ['schedules', doctorId] });
            toast.success('Horario creado');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al crear el horario');
        },
    });
}

export function useUpdateSchedule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data, doctorId }: { id: string; data: UpdateScheduleData; doctorId: string }) =>
            schedulesApi.update(id, data),
        onSuccess: (_, { doctorId }) => {
            queryClient.invalidateQueries({ queryKey: ['schedules', doctorId] });
            toast.success('Horario actualizado');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al actualizar el horario');
        },
    });
}

export function useDeleteSchedule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, doctorId }: { id: string; doctorId: string }) => schedulesApi.delete(id),
        onSuccess: (_, { doctorId }) => {
            queryClient.invalidateQueries({ queryKey: ['schedules', doctorId] });
            toast.success('Horario eliminado');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al eliminar el horario');
        },
    });
}
