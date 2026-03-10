import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi, doctorsApi, patientsApi } from '../api';

const initialFormData = {
  patientId: '',
  doctorId: '',
  appointmentDate: '',
  appointmentTime: '',
  status: 'SCHEDULED',
  notes: '',
};

const statusLabels = {
  SCHEDULED: 'Запланирован',
  COMPLETED: 'Завершен',
  CANCELLED: 'Отменен',
};

const statusClasses = {
  SCHEDULED: 'status status--warning',
  COMPLETED: 'status status--success',
  CANCELLED: 'status status--error',
};

export default function Appointments() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const response = await appointmentsApi.getAll();
      return response.data || [];
    },
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['patients-for-appointments'],
    queryFn: async () => {
      const response = await patientsApi.getAll({ page: 0, size: 100, active: true, sort: 'id,desc' });
      return response.data?.content || response.data || [];
    },
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors-for-appointments'],
    queryFn: async () => {
      const response = await doctorsApi.getAll();
      return response.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload) => appointmentsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => appointmentsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => appointmentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(initialFormData);
  };

  const getPatientName = (patientId) => {
    const patient = patients.find((item) => String(item.id) === String(patientId));
    return patient?.fullName || 'Неизвестный пациент';
  };

  const getDoctorName = (doctorId) => {
    const doctor = doctors.find((item) => String(item.id) === String(doctorId));
    if (!doctor) {
      return 'Неизвестный врач';
    }
    return [doctor.lastName, doctor.firstName].filter(Boolean).join(' ');
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formData.patientId || !formData.doctorId || !formData.appointmentDate || !formData.appointmentTime) {
      window.alert('Заполните обязательные поля');
      return;
    }

    const payload = {
      ...formData,
      patientId: Number(formData.patientId),
      doctorId: Number(formData.doctorId),
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
      return;
    }

    createMutation.mutate(payload);
  };

  const handleEdit = (appointment) => {
    setEditingId(appointment.id);
    setFormData({
      patientId: String(appointment.patientId ?? ''),
      doctorId: String(appointment.doctorId ?? ''),
      appointmentDate: appointment.appointmentDate || '',
      appointmentTime: appointment.appointmentTime || '',
      status: appointment.status || 'SCHEDULED',
      notes: appointment.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Удалить запись?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="loading">Загрузка записей...</div>;
  }

  return (
    <div className="card">
      <div className="card-header page-toolbar">
        <h2>Записи</h2>
        <div className="page-toolbar-actions">
          {showForm ? (
            <button className="btn btn-secondary" type="button" onClick={resetForm}>
              Отмена
            </button>
          ) : null}
          <button className="btn btn-primary" type="button" onClick={() => setShowForm(true)}>
            Добавить запись
          </button>
        </div>
      </div>

      {showForm ? (
        <form className="page-form" onSubmit={handleSubmit}>
          <div className="modal-header">
            <h2>{editingId ? 'Редактирование записи' : 'Создание записи'}</h2>
          </div>

          <div className="form-group">
            <label htmlFor="patientId">Пациент *</label>
            <select id="patientId" className="form-control" name="patientId" value={formData.patientId} onChange={handleChange}>
              <option value="">Выберите пациента</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="doctorId">Врач *</label>
            <select id="doctorId" className="form-control" name="doctorId" value={formData.doctorId} onChange={handleChange}>
              <option value="">Выберите врача</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {[doctor.lastName, doctor.firstName, doctor.specialty].filter(Boolean).join(' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="appointmentDate">Дата *</label>
            <input id="appointmentDate" className="form-control" name="appointmentDate" type="date" value={formData.appointmentDate} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label htmlFor="appointmentTime">Время *</label>
            <input id="appointmentTime" className="form-control" name="appointmentTime" type="time" value={formData.appointmentTime} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label htmlFor="status">Статус</label>
            <select id="status" className="form-control" name="status" value={formData.status} onChange={handleChange}>
              <option value="SCHEDULED">Запланирован</option>
              <option value="COMPLETED">Завершен</option>
              <option value="CANCELLED">Отменен</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Комментарий</label>
            <textarea id="notes" className="form-control" name="notes" rows="3" value={formData.notes} onChange={handleChange} />
          </div>

          <button className="btn btn-success" type="submit">
            {editingId ? 'Сохранить' : 'Создать'}
          </button>
        </form>
      ) : null}

      {appointments.length === 0 ? (
        <div className="empty-state">
          <h3>Нет записей</h3>
          <p>Создайте первую запись на прием или услугу.</p>
        </div>
      ) : (
        <div className="page-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Пациент</th>
                <th>Врач</th>
                <th>Дата</th>
                <th>Время</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td>{getPatientName(appointment.patientId)}</td>
                  <td>{getDoctorName(appointment.doctorId)}</td>
                  <td>{appointment.appointmentDate || '—'}</td>
                  <td>{appointment.appointmentTime || '—'}</td>
                  <td>
                    <span className={statusClasses[appointment.status] || 'status status--info'}>
                      {statusLabels[appointment.status] || appointment.status}
                    </span>
                  </td>
                  <td>
                    <div className="page-row-actions">
                      <button className="btn btn-secondary btn-small" type="button" onClick={() => handleEdit(appointment)}>
                        Изменить
                      </button>
                      <button className="btn btn-danger btn-small" type="button" onClick={() => handleDelete(appointment.id)}>
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
