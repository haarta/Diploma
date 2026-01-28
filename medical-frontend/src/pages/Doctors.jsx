import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doctorsApi } from '../api';

export default function Doctors() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    specialty: '',
    phone: '',
    email: '',
    licenseNumber: '',
  });

  const queryClient = useQueryClient();

  const { data: doctors = [], isLoading } = useQuery({
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
    mutationFn: (data) => doctorsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      resetForm();
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => doctorsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      resetForm();
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => doctorsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    },
  });

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      specialty: '',
      phone: '',
      email: '',
      licenseNumber: '',
    });
    setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.specialty) {
      alert('Заполните обязательные поля');
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (doctor) => {
    setFormData(doctor);
    setEditingId(doctor.id);
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
        <p>Загрузка врачей...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>Справочник врачей</h2>
      </div>

      <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
        {showForm ? '✕ Отмена' : '+ Добавить врача'}
      </button>

      {showForm && (
        <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
          <h3>{editingId ? 'Редактирование врача' : 'Добавить нового врача'}</h3>
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
                <label>Специальность *</label>
                <select
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  required
                >
                  <option value="">Выберите специальность</option>
                  <option value="Терапевт">Терапевт</option>
                  <option value="Кардиолог">Кардиолог</option>
                  <option value="Невролог">Невролог</option>
                  <option value="Хирург">Хирург</option>
                  <option value="Педиатр">Педиатр</option>
                  <option value="ЛОР">ЛОР</option>
                  <option value="Офтальмолог">Офтальмолог</option>
                  <option value="Дерматолог">Дерматолог</option>
                </select>
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
                <label>Номер лицензии</label>
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
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

      {doctors.length === 0 ? (
        <div className="empty-state">
          <h3>Нет врачей в справочнике</h3>
          <p>Нажмите кнопку выше, чтобы добавить первого врача</p>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ФИО</th>
              <th>Специальность</th>
              <th>Телефон</th>
              <th>Email</th>
              <th>Лицензия</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map((doctor) => (
              <tr key={doctor.id}>
                <td>
                  {doctor.firstName} {doctor.lastName}
                </td>
                <td>{doctor.specialty}</td>
                <td>{doctor.phone || '-'}</td>
                <td>{doctor.email || '-'}</td>
                <td>{doctor.licenseNumber || '-'}</td>
                <td>
                  <button className="btn btn-secondary btn-small" onClick={() => handleEdit(doctor)}>
                    Редакт.
                  </button>
                  <button
                    className="btn btn-danger btn-small"
                    onClick={() => {
                      if (window.confirm('Удалить врача?')) {
                        deleteMutation.mutate(doctor.id);
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
