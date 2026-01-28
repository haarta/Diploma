import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi, patientsApi, doctorsApi } from '../api';

export default function Appointments() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    appointmentDate: '',
    appointmentTime: '',
    status: 'SCHEDULED',
    notes: '',
  });

  const queryClient = useQueryClient();

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      try {
        const response = await appointmentsApi.getAll();
        return response.data || [];
      } catch (err) {
        return [];
      }
    },
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      try {
        const response = await patientsApi.getAll();
        return response.data || [];
      } catch (err) {
        return [];
      }
    },
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      try {
        const response = await doctorsApi.getAll();
        return response.data || [];
      } catch (err) {
        return [];
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => appointmentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      resetForm();
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => appointmentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      resetForm();
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => appointmentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  const resetForm = () => {
    setFormData({
      patientId: '',
      doctorId: '',
      appointmentDate: '',
      appointmentTime: '',
      status: 'SCHEDULED',
      notes: '',
    });
    setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.patientId || !formData.doctorId || !formData.appointmentDate || !formData.appointmentTime) {
      alert('Заполните обязательные поля');
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (appointment) => {
    setFormData(appointment);
    setEditingId(appointment.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const getPatientName = (id) => {
    const patient = patients.find((p) => p.id == id);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Неизвестный пациент';
  };

  const getDoctorName = (id) => {
    const doctor = doctors.find((d) => d.id == id);
    return doctor ? `${doctor.firstName} ${doctor.lastName}` : 'Неизвестный врач';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'SCHEDULED':
        return '#0066cc';
      case 'COMPLETED':
        return '#28a745';
      case 'CANCELLED':
        return '#dc3545';
      default:
        return '#666';
    }
  };

  if (appointmentsLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Загрузка записей...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>Управление записями на приём</h2>
      </div>

      <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
        {showForm ? '✕ Отмена' : '+ Новая запись'}
      </button>

      {showForm && (
        <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
          <h3>{editingId ? 'Редактирование записи' : 'Создать запись на приём'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Пациент *</label>
                <select
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  required
                >
                  <option value="">Выберите пациента</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Врач *</label>
                <select
                  value={formData.doctorId}
                  onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                  required
                >
                  <option value="">Выберите врача</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.firstName} {doctor.lastName} ({doctor.specialty})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Дата приёма *</label>
                <input
                  type="date"
                  value={formData.appointmentDate}
                  onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Время приёма *</label>
                <input
                  type="time"
                  value={formData.appointmentTime}
                  onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Статус</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="SCHEDULED">Запланирована</option>
                  <option value="COMPLETED">Завершена</option>
                  <option value="CANCELLED">Отменена</option>
                </select>
              </div>
              <div className="form-group">
                <label>Примечания</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="2"
                />
              </div>
            </div>
            <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-success">
                {editingId ? 'Сохранить' : 'Создать'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      {appointments.length === 0 ? (
        <div className="empty-state">
          <h3>Нет записей</h3>
          <p>Нажмите кнопку выше, чтобы создать запись на приём</p>
        </div>
      ) : (
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
                <td>{appointment.appointmentDate}</td>
                <td>{appointment.appointmentTime}</td>
                <td>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: getStatusColor(appointment.status),
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  >
                    {appointment.status === 'SCHEDULED'
                      ? 'Запланирована'
                      : appointment.status === 'COMPLETED'
                        ? 'Завершена'
                        : 'Отменена'}
                  </span>
                </td>
                <td>
                  <button className="btn btn-secondary btn-small" onClick={() => handleEdit(appointment)}>
                    Редакт.
                  </button>
                  <button
                    className="btn btn-danger btn-small"
                    onClick={() => {
                      if (window.confirm('Удалить запись?')) {
                        deleteMutation.mutate(appointment.id);
                      }
                    }}
                    style={{ marginLeft: '5px' }}
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
