import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const PATIENT_API_BASE = import.meta.env.VITE_PATIENT_API_URL || 'http://localhost:8082/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const patientApi = axios.create({
  baseURL: PATIENT_API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const patientsApi = {
  list: (params) => patientApi.get('/patients', { params }),
  getAll: (params) => patientApi.get('/patients', { params }),
  getById: (id) => patientApi.get(`/patients/${id}`),
  create: (data) => patientApi.post('/patients', data),
  update: (id, data) => patientApi.patch(`/patients/${id}`, data),
  delete: (id) => patientApi.delete(`/patients/${id}`),
};

export const doctorsApi = {
  getAll: () => api.get('/doctors'),
  getById: (id) => api.get(`/doctors/${id}`),
  create: (data) => api.post('/doctors', data),
  update: (id, data) => api.put(`/doctors/${id}`, data),
  delete: (id) => api.delete(`/doctors/${id}`),
};

export const appointmentsApi = {
  getAll: () => api.get('/appointments'),
  getById: (id) => api.get(`/appointments/${id}`),
  create: (data) => api.post('/appointments', data),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  delete: (id) => api.delete(`/appointments/${id}`),
};
