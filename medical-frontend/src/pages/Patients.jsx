import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientsApi } from '../api';

export default function Patients() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    phone: '',
    email: '',
    address: '',
  });

  const queryClient = useQueryClient();

  // Получение списка пациентов
  const { data: patients = [], isLoading, error } = useQuery({
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

  // Создание пациента
  const createMutation = useMutation({
    mutationFn: (data) => patientsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      resetForm();
      setShowForm(false);
    },
  });

  // Обновление пациента
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => patientsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      resetForm();
      setShowForm(false);
    },
  });

  // Удаление пациента
  const deleteMutation = useMutation({
    mutationFn: (id) => patientsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      phone: '',
      email: '',
      address: '',
    });
    setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName) {
      alert('Заполните обязательные поля');
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (patient) => {
    setFormData(patient);
    setEditingId(patient.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Загрузка пациентов...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>Управление пациентами</h2>
      </div>

      <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
        {showForm ? '✕ Отмена' : '+ Добавить пациента'}
      </button>

      {showForm && (
        <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
          <h3>{editingId ? 'Редактирование пациента' : 'Добавить нового пациента'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Имя *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Фамилия *</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Дата рождения</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Телефон</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+7..."
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Адрес</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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

      {patients.length === 0 ? (
        <div className="empty-state">
          <h3>Нет пациентов</h3>
          <p>Нажмите кнопку выше, чтобы добавить первого пациента</p>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ФИО</th>
              <th>Дата рождения</th>
              <th>Телефон</th>
              <th>Email</th>
              <th>Адрес</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => (
              <tr key={patient.id}>
                <td>
                  {patient.firstName} {patient.lastName}
                </td>
                <td>{patient.dateOfBirth || '-'}</td>
                <td>{patient.phone || '-'}</td>
                <td>{patient.email || '-'}</td>
                <td>{patient.address || '-'}</td>
                <td>
                  <button className="btn btn-secondary btn-small" onClick={() => handleEdit(patient)}>
                    Редакт.
                  </button>
                  <button
                    className="btn btn-danger btn-small"
                    onClick={() => {
                      if (window.confirm('Удалить пациента?')) {
                        deleteMutation.mutate(patient.id);
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
