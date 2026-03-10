import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { doctorsApi } from '../api';

const initialFormData = {
  firstName: '',
  lastName: '',
  specialty: '',
  phone: '',
  email: '',
  licenseNumber: '',
};

export default function Doctors() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const response = await doctorsApi.getAll();
      return response.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload) => doctorsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => doctorsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => doctorsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(initialFormData);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.specialty.trim()) {
      window.alert('Заполните обязательные поля врача');
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, payload: formData });
      return;
    }

    createMutation.mutate(formData);
  };

  const handleEdit = (doctor) => {
    setEditingId(doctor.id);
    setFormData({
      firstName: doctor.firstName || '',
      lastName: doctor.lastName || '',
      specialty: doctor.specialty || '',
      phone: doctor.phone || '',
      email: doctor.email || '',
      licenseNumber: doctor.licenseNumber || '',
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Удалить врача?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="loading">Загрузка врачей...</div>;
  }

  return (
    <div className="card">
      <div className="card-header page-toolbar">
        <h2>Врачи</h2>
        <div className="page-toolbar-actions">
          {showForm ? (
            <button className="btn btn-secondary" type="button" onClick={resetForm}>
              Отмена
            </button>
          ) : null}
          <button className="btn btn-primary" type="button" onClick={() => setShowForm(true)}>
            Добавить врача
          </button>
        </div>
      </div>

      {showForm ? (
        <form className="page-form" onSubmit={handleSubmit}>
          <div className="modal-header">
            <h2>{editingId ? 'Редактирование врача' : 'Создание врача'}</h2>
          </div>

          <div className="form-group">
            <label htmlFor="firstName">Имя *</label>
            <input id="firstName" className="form-control" name="firstName" value={formData.firstName} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label htmlFor="lastName">Фамилия *</label>
            <input id="lastName" className="form-control" name="lastName" value={formData.lastName} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label htmlFor="specialty">Специальность *</label>
            <input id="specialty" className="form-control" name="specialty" value={formData.specialty} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Телефон</label>
            <input id="phone" className="form-control" name="phone" value={formData.phone} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label htmlFor="email">Электронная почта</label>
            <input id="email" className="form-control" name="email" type="email" value={formData.email} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label htmlFor="licenseNumber">Номер лицензии</label>
            <input id="licenseNumber" className="form-control" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} />
          </div>

          <button className="btn btn-success" type="submit">
            {editingId ? 'Сохранить' : 'Создать'}
          </button>
        </form>
      ) : null}

      {doctors.length === 0 ? (
        <div className="empty-state">
          <h3>Нет врачей</h3>
          <p>Добавьте первого врача в систему.</p>
        </div>
      ) : (
        <div className="page-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Имя</th>
                <th>Фамилия</th>
                <th>Специальность</th>
                <th>Телефон</th>
                <th>Эл. почта</th>
                <th>Лицензия</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doctor) => (
                <tr key={doctor.id}>
                  <td>{doctor.firstName}</td>
                  <td>{doctor.lastName}</td>
                  <td>{doctor.specialty}</td>
                  <td>{doctor.phone || '—'}</td>
                  <td>{doctor.email || '—'}</td>
                  <td>{doctor.licenseNumber || '—'}</td>
                  <td>
                    <div className="page-row-actions">
                      <button className="btn btn-secondary btn-small" type="button" onClick={() => handleEdit(doctor)}>
                        Изменить
                      </button>
                      <button className="btn btn-danger btn-small" type="button" onClick={() => handleDelete(doctor.id)}>
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
