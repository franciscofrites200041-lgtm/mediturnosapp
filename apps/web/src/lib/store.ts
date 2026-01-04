import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// User types
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'SUPER_ADMIN' | 'CLINIC_ADMIN' | 'DOCTOR' | 'SECRETARY';
    clinicId?: string;
    specialtyId?: string;
    avatarUrl?: string;
    phone?: string;
    licenseNumber?: string;
}

export interface Clinic {
    id: string;
    name: string;
    slug: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    logoUrl?: string;
    timezone: string;
    subscriptionStatus: string;
    subscriptionPlan: string;
    apiKey?: string;
    webhookUrl?: string;
}

// Auth Store
interface AuthState {
    user: User | null;
    clinic: Clinic | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    setUser: (user: User | null) => void;
    setClinic: (clinic: Clinic | null) => void;
    setLoading: (loading: boolean) => void;
    login: (user: User, clinic: Clinic | null, accessToken: string, refreshToken: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            clinic: null,
            isAuthenticated: false,
            isLoading: true,
            setUser: (user) => set({ user, isAuthenticated: !!user }),
            setClinic: (clinic) => set({ clinic }),
            setLoading: (isLoading) => set({ isLoading }),
            login: (user, clinic, accessToken, refreshToken) => {
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);
                set({ user, clinic, isAuthenticated: true, isLoading: false });
            },
            logout: () => {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                set({ user: null, clinic: null, isAuthenticated: false, isLoading: false });
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ user: state.user, clinic: state.clinic, isAuthenticated: state.isAuthenticated }),
        }
    )
);

// UI Store for app state
interface UIState {
    sidebarOpen: boolean;
    theme: 'light' | 'dark' | 'system';
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            sidebarOpen: true,
            theme: 'system',
            toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
            setSidebarOpen: (open) => set({ sidebarOpen: open }),
            setTheme: (theme) => set({ theme }),
        }),
        {
            name: 'ui-storage',
        }
    )
);

// Calendar Store
interface CalendarState {
    selectedDate: Date;
    view: 'day' | 'week' | 'month';
    selectedDoctorId: string | null;
    selectedAreaId: string | null;
    setSelectedDate: (date: Date) => void;
    setView: (view: 'day' | 'week' | 'month') => void;
    setSelectedDoctorId: (id: string | null) => void;
    setSelectedAreaId: (id: string | null) => void;
}

export const useCalendarStore = create<CalendarState>((set) => ({
    selectedDate: new Date(),
    view: 'week',
    selectedDoctorId: null,
    selectedAreaId: null,
    setSelectedDate: (date) => set({ selectedDate: date }),
    setView: (view) => set({ view }),
    setSelectedDoctorId: (id) => set({ selectedDoctorId: id }),
    setSelectedAreaId: (id) => set({ selectedAreaId: id }),
}));

// Modal Store for handling modals
interface ModalState {
    // Appointment modal
    appointmentModalOpen: boolean;
    appointmentModalMode: 'create' | 'edit' | 'view';
    selectedAppointmentId: string | null;
    prefilledAppointmentData: Partial<AppointmentFormData> | null;

    // Patient modal
    patientModalOpen: boolean;
    patientModalMode: 'create' | 'edit' | 'view';
    selectedPatientId: string | null;

    // Medical Record modal
    medicalRecordModalOpen: boolean;
    selectedMedicalRecordPatientId: string | null;
    selectedAppointmentForRecord: string | null;

    // Prescription modal
    prescriptionModalOpen: boolean;
    selectedPrescriptionPatientId: string | null;

    // Actions
    openAppointmentModal: (mode: 'create' | 'edit' | 'view', appointmentId?: string, prefilled?: Partial<AppointmentFormData>) => void;
    closeAppointmentModal: () => void;
    openPatientModal: (mode: 'create' | 'edit' | 'view', patientId?: string) => void;
    closePatientModal: () => void;
    openMedicalRecordModal: (patientId: string, appointmentId?: string) => void;
    closeMedicalRecordModal: () => void;
    openPrescriptionModal: (patientId: string) => void;
    closePrescriptionModal: () => void;
}

export interface AppointmentFormData {
    patientId: string;
    doctorId: string;
    areaId: string;
    scheduledAt: Date;
    duration: number;
    reason?: string;
    notes?: string;
}

export const useModalStore = create<ModalState>((set) => ({
    // Appointment modal state
    appointmentModalOpen: false,
    appointmentModalMode: 'create',
    selectedAppointmentId: null,
    prefilledAppointmentData: null,

    // Patient modal state
    patientModalOpen: false,
    patientModalMode: 'create',
    selectedPatientId: null,

    // Medical Record modal state
    medicalRecordModalOpen: false,
    selectedMedicalRecordPatientId: null,
    selectedAppointmentForRecord: null,

    // Prescription modal state
    prescriptionModalOpen: false,
    selectedPrescriptionPatientId: null,

    // Actions
    openAppointmentModal: (mode, appointmentId, prefilled) => set({
        appointmentModalOpen: true,
        appointmentModalMode: mode,
        selectedAppointmentId: appointmentId || null,
        prefilledAppointmentData: prefilled || null,
    }),
    closeAppointmentModal: () => set({
        appointmentModalOpen: false,
        selectedAppointmentId: null,
        prefilledAppointmentData: null,
    }),
    openPatientModal: (mode, patientId) => set({
        patientModalOpen: true,
        patientModalMode: mode,
        selectedPatientId: patientId || null,
    }),
    closePatientModal: () => set({
        patientModalOpen: false,
        selectedPatientId: null,
    }),
    openMedicalRecordModal: (patientId, appointmentId) => set({
        medicalRecordModalOpen: true,
        selectedMedicalRecordPatientId: patientId,
        selectedAppointmentForRecord: appointmentId || null,
    }),
    closeMedicalRecordModal: () => set({
        medicalRecordModalOpen: false,
        selectedMedicalRecordPatientId: null,
        selectedAppointmentForRecord: null,
    }),
    openPrescriptionModal: (patientId) => set({
        prescriptionModalOpen: true,
        selectedPrescriptionPatientId: patientId,
    }),
    closePrescriptionModal: () => set({
        prescriptionModalOpen: false,
        selectedPrescriptionPatientId: null,
    }),
}));
