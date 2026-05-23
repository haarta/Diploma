import axios from 'axios';
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  saveAuthTokens,
} from './auth';

const APPOINTMENT_API_BASE =
  import.meta.env.VITE_APPOINTMENT_API_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:8083/api';
const PATIENT_API_BASE = import.meta.env.VITE_PATIENT_API_URL || 'http://localhost:8082/api';
const AUTH_API_BASE = import.meta.env.VITE_AUTH_URL || 'http://localhost:8081';

const createClient = (baseURL, headers = undefined) =>
  axios.create({
    baseURL,
    ...(headers ? { headers } : {}),
  });

const skipRefreshHandling = (config = {}) => ({
  ...config,
  __skipAuthRefresh: true,
});

const withAccessToken = (config = {}) => {
  const token = getAccessToken();
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

let refreshPromise = null;

const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('Отсутствует токен обновления');
  }

  const response = await axios.post(
    `${AUTH_API_BASE}/api/auth/refresh`,
    { refreshToken },
    { headers: { 'Content-Type': 'application/json' } }
  );

  const { accessToken, refreshToken: nextRefreshToken } = response.data || {};
  if (!accessToken || !nextRefreshToken) {
    throw new Error('Сервер вернул некорректный ответ при обновлении токена');
  }

  saveAuthTokens({ accessToken, refreshToken: nextRefreshToken });
  return accessToken;
};

const attachAuthInterceptors = (client) => {
  client.interceptors.request.use((config) => withAccessToken(config));

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      const status = error.response?.status;

      if (
        !originalRequest ||
        originalRequest._retry ||
        originalRequest.__skipAuthRefresh ||
        ![401, 403].includes(status)
      ) {
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

        return client.request(originalRequest);
      } catch (refreshError) {
        clearAuthTokens();
        throw refreshError;
      }
    }
  );
};

export const api = createClient(APPOINTMENT_API_BASE);
export const patientApi = createClient(PATIENT_API_BASE, {
  'Content-Type': 'application/json',
});
export const authApi = createClient(AUTH_API_BASE, {
  'Content-Type': 'application/json',
});

attachAuthInterceptors(api);
attachAuthInterceptors(patientApi);
attachAuthInterceptors(authApi);

export const authSessionApi = {
  login: (data) => authApi.post('/api/auth/login', data, skipRefreshHandling()),
  register: (data) => authApi.post('/api/auth/register', data, skipRefreshHandling()),
  refresh: (refreshToken) =>
    authApi.post('/api/auth/refresh', { refreshToken }, skipRefreshHandling()),
  getMe: () => authApi.get('/api/auth/me'),
  updateMe: (data) => authApi.patch('/api/auth/me', data),
};

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

export const newsApi = {
  getAll: () => api.get('/public/news'),
  getById: (id) => api.get(`/public/news/${id}`),
};

export const onlineConsultationsApi = {
  getAll: () => api.get('/public/online-consultations'),
  getById: (id) => api.get(`/public/online-consultations/${id}`),
};

export const adminDoctorsApi = {
  getAll: () => api.get('/admin/doctors'),
  getById: (id) => api.get(`/admin/doctors/${id}`),
  create: (data) => api.post('/admin/doctors', data),
  update: (id, data) => api.put(`/admin/doctors/${id}`, data),
  delete: (id) => api.delete(`/admin/doctors/${id}`),
};

export const adminPromotionsApi = {
  getAll: () => api.get('/admin/promotions'),
  getById: (id) => api.get(`/admin/promotions/${id}`),
  create: (data) => api.post('/admin/promotions', data),
  update: (id, data) => api.put(`/admin/promotions/${id}`, data),
  delete: (id) => api.delete(`/admin/promotions/${id}`),
};

export const adminNewsApi = {
  getAll: () => api.get('/admin/news'),
  getById: (id) => api.get(`/admin/news/${id}`),
  create: (data) => api.post('/admin/news', data),
  update: (id, data) => api.put(`/admin/news/${id}`, data),
  delete: (id) => api.delete(`/admin/news/${id}`),
};

export const adminOnlineConsultationsApi = {
  getAll: () => api.get('/admin/online-consultations'),
  getById: (id) => api.get(`/admin/online-consultations/${id}`),
  create: (data) => api.post('/admin/online-consultations', data),
  update: (id, data) => api.put(`/admin/online-consultations/${id}`, data),
  delete: (id) => api.delete(`/admin/online-consultations/${id}`),
};

export const adminReviewsApi = {
  getByStatus: (status = 'PENDING') => api.get('/admin/reviews', { params: { status } }),
  updateStatus: (id, status) => api.patch(`/admin/reviews/${id}/status`, { status }),
};

export const adminReportsApi = {
  getDashboard: (params = {}) => api.get('/admin/reports/dashboard', { params }),
  exportExcel: (params = {}) =>
    api.get('/admin/reports/export.xlsx', { params, responseType: 'blob' }),
  exportPdf: (params = {}) =>
    api.get('/admin/reports/export.pdf', { params, responseType: 'blob' }),
};

export const adminFilesApi = {
  upload: (file, folder = 'misc') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    return api.post('/admin/files/upload', formData);
  },
};

export const filesApi = {
  upload: (file, folder = 'misc') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    return api.post('/files/upload', formData);
  },
};

export const doctorApi = {
  getUpcomingAppointments: () => api.get('/doctor/appointments/upcoming'),
  updateAppointmentStatus: (id, data) => api.patch(`/doctor/appointments/${id}/status`, data),
  getDocuments: (params) => api.get('/doctor/documents', { params }),
  uploadDocument: (file, appointmentId, type = 'OTHER') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('appointmentId', String(appointmentId));
    formData.append('type', type);
    return api.post('/doctor/documents/upload', formData);
  },
};

export const patientDocumentsApi = {
  getMine: () => api.get('/patient-documents/me'),
};

export const doctorVerificationApi = {
  getMine: () => authApi.get('/api/auth/doctor-verification/me'),
  submit: (data) => authApi.post('/api/auth/doctor-verification/submit', data),
  adminList: (status = 'PENDING_VERIFICATION') =>
    authApi.get('/api/admin/doctor-verifications', { params: { status } }),
  adminReview: (id, data) =>
    authApi.patch(`/api/admin/doctor-verifications/${id}/review`, data),
};

export const appointmentsApi = {
  getMine: () => api.get('/appointments/me'),
  getBusySlots: (doctorId, dateFrom, dateTo) =>
    api.get('/public/appointments/busy', { params: { doctorId, dateFrom, dateTo } }),
  createMine: (data) => api.post('/appointments/me', data),
  cancelMine: (id) => api.patch(`/appointments/me/${id}/cancel`),
  getAll: () => api.get('/appointments'),
  getById: (id) => api.get(`/appointments/${id}`),
  create: (data) => api.post('/appointments', data),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  delete: (id) => api.delete(`/appointments/${id}`),
};

export const labResultsApi = {
  getMine: () => api.get('/lab-results/me'),
};

export const notificationsApi = {
  getMine: () => api.get('/notifications/me'),
  getUnreadCount: () => api.get('/notifications/me/unread-count'),
  markAsRead: (id) => api.patch(`/notifications/me/${id}/read`),
  markAllAsRead: () => api.post('/notifications/me/read-all'),
};
