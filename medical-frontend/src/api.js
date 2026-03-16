import axios from 'axios';
import { notifyAuthChanged } from './auth';

const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const APPOINTMENT_API_BASE = import.meta.env.VITE_APPOINTMENT_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:8083/api';
const PATIENT_API_BASE = import.meta.env.VITE_PATIENT_API_URL || 'http://localhost:8082/api';
const AUTH_API_BASE = import.meta.env.VITE_AUTH_URL || 'http://localhost:8081';

const withAuth = (config = {}) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) {
    return config;
  }

  return {
    ...config,
    headers: {
      ...(config.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  };
};

export const api = axios.create({
  baseURL: APPOINTMENT_API_BASE,
});

let refreshPromise = null;

const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    throw new Error('No refresh token');
  }

  const response = await axios.post(
    `${AUTH_API_BASE}/api/auth/refresh`,
    { refreshToken },
    { headers: { 'Content-Type': 'application/json' } }
  );

  const { accessToken, refreshToken: nextRefreshToken } = response.data || {};
  if (!accessToken || !nextRefreshToken) {
    throw new Error('Invalid refresh response');
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, nextRefreshToken);
  notifyAuthChanged();
  return accessToken;
};

api.interceptors.request.use((config) => withAuth(config));

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (!originalRequest || originalRequest._retry || ![401, 403].includes(status)) {
      throw error;
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newToken = await refreshPromise;
      originalRequest.headers = {
        ...(originalRequest.headers || {}),
        Authorization: `Bearer ${newToken}`,
      };

      return api.request(originalRequest);
    } catch (refreshError) {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      notifyAuthChanged();
      throw refreshError;
    }
  }
);

export const patientApi = axios.create({
  baseURL: PATIENT_API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

patientApi.interceptors.request.use((config) => withAuth(config));

patientApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (!originalRequest || originalRequest._retry || ![401, 403].includes(status)) {
      throw error;
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newToken = await refreshPromise;
      originalRequest.headers = {
        ...(originalRequest.headers || {}),
        Authorization: `Bearer ${newToken}`,
      };

      return patientApi.request(originalRequest);
    } catch (refreshError) {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      notifyAuthChanged();
      throw refreshError;
    }
  }
);

export const patientsApi = {
  getMe: () => patientApi.get('/patients/me'),
  createMe: (data) => patientApi.post('/patients/me', data),
  updateMe: (data) => patientApi.patch('/patients/me', data),
  list: (params) => patientApi.get('/patients', { params }),
  getAll: (params) => patientApi.get('/patients', { params }),
  getById: (id) => patientApi.get(`/patients/${id}`),
  getByUserId: (userId) => patientApi.get(`/patients/by-user/${userId}`),
  create: (data) => patientApi.post('/patients', data),
  update: (id, data) => patientApi.patch(`/patients/${id}`, data),
  delete: (id) => patientApi.delete(`/patients/${id}`),
};

export const doctorsApi = {
  getAll: () => api.get('/public/doctors'),
  getById: (id) => api.get(`/public/doctors/${id}`),
  addReview: (id, data) => api.post(`/public/doctors/${id}/reviews`, data),
};

export const promotionsApi = {
  getAll: () => api.get('/public/promotions'),
  getById: (id) => api.get(`/public/promotions/${id}`),
};

export const onlineConsultationsApi = {
  getAll: () => api.get('/public/online-consultations'),
  getById: (id) => api.get(`/public/online-consultations/${id}`),
};

export const adminDoctorsApi = {
  getAll: () => api.get('/admin/doctors', withAuth()),
  getById: (id) => api.get(`/admin/doctors/${id}`, withAuth()),
  create: (data) => api.post('/admin/doctors', data, withAuth()),
  update: (id, data) => api.put(`/admin/doctors/${id}`, data, withAuth()),
  delete: (id) => api.delete(`/admin/doctors/${id}`, withAuth()),
};

export const adminPromotionsApi = {
  getAll: () => api.get('/admin/promotions', withAuth()),
  getById: (id) => api.get(`/admin/promotions/${id}`, withAuth()),
  create: (data) => api.post('/admin/promotions', data, withAuth()),
  update: (id, data) => api.put(`/admin/promotions/${id}`, data, withAuth()),
  delete: (id) => api.delete(`/admin/promotions/${id}`, withAuth()),
};

export const adminOnlineConsultationsApi = {
  getAll: () => api.get('/admin/online-consultations', withAuth()),
  getById: (id) => api.get(`/admin/online-consultations/${id}`, withAuth()),
  create: (data) => api.post('/admin/online-consultations', data, withAuth()),
  update: (id, data) => api.put(`/admin/online-consultations/${id}`, data, withAuth()),
  delete: (id) => api.delete(`/admin/online-consultations/${id}`, withAuth()),
};

export const adminReviewsApi = {
  getByStatus: (status = 'PENDING') => api.get('/admin/reviews', withAuth({ params: { status } })),
  updateStatus: (id, status) => api.patch(`/admin/reviews/${id}/status`, { status }, withAuth()),
};

export const adminFilesApi = {
  upload: (file, folder = 'misc') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    return api.post('/admin/files/upload', formData, withAuth());
  },
};

export const filesApi = {
  upload: (file, folder = 'misc') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    return api.post('/files/upload', formData, withAuth());
  },
};

export const doctorApi = {
  getUpcomingAppointments: () => api.get('/doctor/appointments/upcoming', withAuth()),
  getDocuments: (params) => api.get('/doctor/documents', withAuth({ params })),
  uploadDocument: (file, appointmentId, type = 'OTHER') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('appointmentId', String(appointmentId));
    formData.append('type', type);
    return api.post('/doctor/documents/upload', formData, withAuth());
  },
};

export const doctorVerificationApi = {
  getMine: () => axios.get(`${AUTH_API_BASE}/api/auth/doctor-verification/me`, withAuth()),
  submit: (data) => axios.post(`${AUTH_API_BASE}/api/auth/doctor-verification/submit`, data, withAuth()),
  adminList: (status = 'PENDING_VERIFICATION') =>
    axios.get(`${AUTH_API_BASE}/api/admin/doctor-verifications`, withAuth({ params: { status } })),
  adminReview: (id, data) =>
    axios.patch(`${AUTH_API_BASE}/api/admin/doctor-verifications/${id}/review`, data, withAuth()),
};

export const appointmentsApi = {
  getMine: () => api.get('/appointments/me', withAuth()),
  getBusySlots: (doctorId, date) => api.get('/public/appointments/busy', { params: { doctorId, date } }),
  createMine: (data) => api.post('/appointments/me', data, withAuth()),
  getAll: () => api.get('/appointments', withAuth()),
  getById: (id) => api.get(`/appointments/${id}`),
  create: (data) => api.post('/appointments', data),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  delete: (id) => api.delete(`/appointments/${id}`),
};
