import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// Create axios instance with default config
export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('accessToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for handling errors and token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 and we haven't tried to refresh yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    const response = await axios.post(`${API_URL}/auth/refresh`, {
                        refreshToken,
                    });

                    const { accessToken, refreshToken: newRefreshToken } = response.data;
                    localStorage.setItem('accessToken', accessToken);
                    localStorage.setItem('refreshToken', newRefreshToken);

                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // Refresh failed, logout user
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/auth/login';
            }
        }

        return Promise.reject(error);
    }
);

// Auth API
export const authApi = {
    login: async (email: string, password: string) => {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    },
    signup: async (data: SignupData) => {
        const response = await api.post('/auth/register', data);
        return response.data;
    },
    register: async (data: RegisterData) => {
        const response = await api.post('/auth/register', data);
        return response.data;
    },
    verifyEmail: async (token: string) => {
        const response = await api.post('/auth/verify-email', { token });
        return response.data;
    },
    resendVerification: async (email: string) => {
        const response = await api.post('/auth/resend-verification', { email });
        return response.data;
    },
    logout: async () => {
        const response = await api.post('/auth/logout');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        return response.data;
    },
    me: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },
    forgotPassword: async (email: string) => {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    },
    resetPassword: async (token: string, password: string) => {
        const response = await api.post('/auth/reset-password', { token, password });
        return response.data;
    },
    changePassword: async (currentPassword: string, newPassword: string) => {
        const response = await api.post('/auth/change-password', { currentPassword, newPassword });
        return response.data;
    },
};

// Appointments API
export const appointmentsApi = {
    getAll: async (params?: QueryAppointmentsParams) => {
        const response = await api.get('/appointments', { params });
        return response.data;
    },
    getCalendar: async (startDate: string, endDate: string, doctorId?: string, areaId?: string) => {
        const response = await api.get('/appointments/calendar', {
            params: { startDate, endDate, doctorId, areaId },
        });
        return response.data;
    },
    getMyAgenda: async (date?: string) => {
        const response = await api.get('/appointments/my-agenda', { params: { date } });
        return response.data;
    },
    getAvailability: async (doctorId: string, date: string) => {
        const response = await api.get(`/appointments/availability/${doctorId}`, { params: { date } });
        return response.data;
    },
    getOne: async (id: string) => {
        const response = await api.get(`/appointments/${id}`);
        return response.data;
    },
    create: async (data: CreateAppointmentData) => {
        const response = await api.post('/appointments', data);
        return response.data;
    },
    update: async (id: string, data: UpdateAppointmentData) => {
        const response = await api.patch(`/appointments/${id}`, data);
        return response.data;
    },
    updateStatus: async (id: string, status: string, cancelReason?: string) => {
        const response = await api.patch(`/appointments/${id}/status`, { status, cancelReason });
        return response.data;
    },
    cancel: async (id: string, reason?: string) => {
        const response = await api.delete(`/appointments/${id}`, { data: { reason } });
        return response.data;
    },
};

// Patients API
export const patientsApi = {
    getAll: async (params?: QueryPatientsParams) => {
        const response = await api.get('/patients', { params });
        return response.data;
    },
    getOne: async (id: string) => {
        const response = await api.get(`/patients/${id}`);
        return response.data;
    },
    create: async (data: CreatePatientData) => {
        const response = await api.post('/patients', data);
        return response.data;
    },
    update: async (id: string, data: UpdatePatientData) => {
        const response = await api.patch(`/patients/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/patients/${id}`);
        return response.data;
    },
    search: async (query: string) => {
        const response = await api.get('/patients/search', { params: { q: query } });
        return response.data;
    },
    getMyPatients: async () => {
        const response = await api.get('/patients/my-patients');
        return response.data;
    },
};

// Doctors/Users API
export const usersApi = {
    getAll: async (params?: QueryUsersParams) => {
        const response = await api.get('/users', { params });
        return response.data;
    },
    getDoctors: async () => {
        const response = await api.get('/users', { params: { role: 'DOCTOR' } });
        return response.data;
    },
    getOne: async (id: string) => {
        const response = await api.get(`/users/${id}`);
        return response.data;
    },
    create: async (data: CreateUserData) => {
        const response = await api.post('/users', data);
        return response.data;
    },
    update: async (id: string, data: UpdateUserData) => {
        const response = await api.patch(`/users/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/users/${id}`);
        return response.data;
    },
};

// Areas API
export const areasApi = {
    getAll: async () => {
        const response = await api.get('/areas');
        return response.data;
    },
    getOne: async (id: string) => {
        const response = await api.get(`/areas/${id}`);
        return response.data;
    },
    create: async (data: CreateAreaData) => {
        const response = await api.post('/areas', data);
        return response.data;
    },
    update: async (id: string, data: UpdateAreaData) => {
        const response = await api.patch(`/areas/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/areas/${id}`);
        return response.data;
    },
};

// Medical Records API
export const medicalRecordsApi = {
    getByPatient: async (patientId: string) => {
        const response = await api.get(`/medical-records/patient/${patientId}`);
        return response.data;
    },
    getOne: async (id: string) => {
        const response = await api.get(`/medical-records/${id}`);
        return response.data;
    },
    create: async (data: CreateMedicalRecordData) => {
        const response = await api.post('/medical-records', data);
        return response.data;
    },
    update: async (id: string, data: UpdateMedicalRecordData) => {
        const response = await api.patch(`/medical-records/${id}`, data);
        return response.data;
    },
    complete: async (id: string) => {
        const response = await api.post(`/medical-records/${id}/complete`);
        return response.data;
    },
};

// Prescriptions API
export const prescriptionsApi = {
    getByPatient: async (patientId: string) => {
        const response = await api.get(`/prescriptions/patient/${patientId}`);
        return response.data;
    },
    getOne: async (id: string) => {
        const response = await api.get(`/prescriptions/${id}`);
        return response.data;
    },
    create: async (data: CreatePrescriptionData) => {
        const response = await api.post('/prescriptions', data);
        return response.data;
    },
    send: async (id: string) => {
        const response = await api.post(`/prescriptions/${id}/send`);
        return response.data;
    },
};

// Schedules API
export const schedulesApi = {
    getByDoctor: async (doctorId: string) => {
        const response = await api.get(`/schedules/doctor/${doctorId}`);
        return response.data;
    },
    create: async (data: CreateScheduleData) => {
        const response = await api.post('/schedules', data);
        return response.data;
    },
    update: async (id: string, data: UpdateScheduleData) => {
        const response = await api.patch(`/schedules/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/schedules/${id}`);
        return response.data;
    },
};

// Clinics API (for admin)
export const clinicsApi = {
    getAll: async () => {
        const response = await api.get('/clinics');
        return response.data;
    },
    getOne: async (id: string) => {
        const response = await api.get(`/clinics/${id}`);
        return response.data;
    },
    getCurrent: async () => {
        const response = await api.get('/clinics/current');
        return response.data;
    },
    update: async (id: string, data: UpdateClinicData) => {
        const response = await api.patch(`/clinics/${id}`, data);
        return response.data;
    },
};

// Billing API
export const billingApi = {
    getPlans: async () => {
        const response = await api.get('/billing/plans');
        return response.data;
    },
    getCurrentSubscription: async () => {
        const response = await api.get('/billing/current');
        return response.data;
    },
    createSubscription: async (plan: string) => {
        const response = await api.post('/billing/subscribe', { plan });
        return response.data;
    },
};

// WhatsApp API
export const whatsappApi = {
    getConfig: async () => {
        const response = await api.get('/whatsapp/config');
        return response.data;
    },
    updateConfig: async (config: { phoneNumberId: string; wabaId: string; accessToken: string; phoneNumber: string }) => {
        const response = await api.post('/whatsapp/config', config);
        return response.data;
    },
    updateBotSettings: async (settings: { welcomeMessage?: string; isBotEnabled?: boolean }) => {
        const response = await api.patch('/whatsapp/bot-settings', settings);
        return response.data;
    },

    // Inbox methods for human handoff
    getInbox: async (filters?: { status?: string; needsHuman?: boolean }) => {
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.needsHuman) params.append('needsHuman', 'true');
        const response = await api.get(`/whatsapp/inbox?${params.toString()}`);
        return response.data;
    },
    getConversation: async (conversationId: string) => {
        const response = await api.get(`/whatsapp/inbox/${conversationId}`);
        return response.data;
    },
    assignConversation: async (conversationId: string) => {
        const response = await api.post(`/whatsapp/inbox/${conversationId}/assign`);
        return response.data;
    },
    replyToConversation: async (conversationId: string, message: string) => {
        const response = await api.post(`/whatsapp/inbox/${conversationId}/reply`, { message });
        return response.data;
    },
    closeConversation: async (conversationId: string) => {
        const response = await api.post(`/whatsapp/inbox/${conversationId}/close`);
        return response.data;
    },
};

// Types
export interface SignupData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    clinicName: string;
    phone?: string;
    acceptTerms?: boolean;
}

export interface RegisterData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    clinicName?: string;
}

export interface QueryAppointmentsParams {
    page?: number;
    limit?: number;
    doctorId?: string;
    areaId?: string;
    patientId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
}

export interface CreateAppointmentData {
    patientId: string;
    doctorId: string;
    areaId: string;
    scheduledAt: string;
    duration?: number;
    type?: string;
    reason?: string;
    notes?: string;
}

export interface UpdateAppointmentData {
    scheduledAt?: string;
    duration?: number;
    reason?: string;
    notes?: string;
}

export interface QueryPatientsParams {
    page?: number;
    limit?: number;
    search?: string;
}

export interface CreatePatientData {
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
    phoneSecondary?: string;
    documentType?: string;
    documentNumber: string;
    birthDate?: string;
    gender?: string;
    address?: string;
    city?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    insuranceProvider?: string;
    insuranceNumber?: string;
    notes?: string;
}

export interface UpdatePatientData extends Partial<CreatePatientData> { }

export interface QueryUsersParams {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
}

export interface CreateUserData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: string;
    specialtyId?: string;
    licenseNumber?: string;
}

export interface UpdateUserData extends Partial<Omit<CreateUserData, 'password'>> {
    password?: string;
}

export interface CreateAreaData {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    defaultDuration?: number;
}

export interface UpdateAreaData extends Partial<CreateAreaData> { }

export interface CreateMedicalRecordData {
    patientId: string;
    appointmentId?: string;
    chiefComplaint?: string;
    presentIllness?: string;
    physicalExam?: string;
    diagnosis?: string;
    diagnosisCode?: string;
    treatmentPlan?: string;
    notes?: string;
    vitalSigns?: VitalSigns;
    labOrders?: string;
    imagingOrders?: string;
    followUpDate?: string;
    followUpNotes?: string;
}

export interface UpdateMedicalRecordData extends Partial<CreateMedicalRecordData> { }

export interface VitalSigns {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
    oxygenSaturation?: number;
}

export interface CreatePrescriptionData {
    patientId: string;
    appointmentId?: string;
    medications: Medication[];
    instructions?: string;
    diagnosis?: string;
    validUntil?: string;
}

export interface Medication {
    name: string;
    dosage: string;
    frequency: string;
    duration?: string;
    notes?: string;
}

export interface CreateScheduleData {
    doctorId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    slotDuration?: number;
    maxPatients?: number;
}

export interface UpdateScheduleData extends Partial<Omit<CreateScheduleData, 'doctorId'>> { }

export interface UpdateClinicData {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    logoUrl?: string;
    timezone?: string;
    settings?: Record<string, unknown>;
    webhookUrl?: string;
}

export default api;
