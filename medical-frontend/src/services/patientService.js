import api from "../api/api";

export const getPatients = () => api.get("/patients");
export const createPatient = (patient) => api.post("/patients", patient);
export const deletePatient = (id) => api.delete(`/patients/${id}`);
