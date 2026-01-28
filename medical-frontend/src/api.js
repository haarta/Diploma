import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Пациенты API
export const patientsApi = {
  getAll: () => api.get('/patients'),
  getById: (id) => api.get(`/patients/${id}`),
  create: (data) => api.post('/patients', data),
  update: (id, data) => api.put(`/patients/${id}`, data),
  delete: (id) => api.delete(`/patients/${id}`),
};

// Врачи API
export const doctorsApi = {
  getAll: () => api.get('/doctors'),
  getById: (id) => api.get(`/doctors/${id}`),
  create: (data) => api.post('/doctors', data),
  update: (id, data) => api.put(`/doctors/${id}`, data),
  delete: (id) => api.delete(`/doctors/${id}`),
};

// Записи API
export const appointmentsApi = {
  getAll: () => api.get('/appointments'),
  getById: (id) => api.get(`/appointments/${id}`),
  create: (data) => api.post('/appointments', data),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  delete: (id) => api.delete(`/appointments/${id}`),
};
