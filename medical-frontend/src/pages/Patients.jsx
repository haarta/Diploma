import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { patientsApi } from '../api';

const initialFormData = {
  fullName: '',
  birthDate: '',
  phone: '',
  email: '',
  address: '',
};

export default function Patients() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchName, setSearchName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [formData, setFormData] = useState(initialFormData);

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['patients', searchName, searchPhone],
    queryFn: async () => {
      const response = await patientsApi.getAll({
        page: 0,
        size: 100,
        active: true,
        sort: 'id,desc',
        q: searchName || undefined,
        phone: searchPhone || undefined,
      });
      return response.data?.content || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload) => patientsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => patientsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => patientsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formData.fullName.trim()) {
      window.alert('ФИО обязательно');
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, payload: formData });
      return;
    }

    createMutation.mutate(formData);
  };

  const handleEdit = (patient) => {
    setEditingId(patient.id);
    setFormData({
      fullName: patient.fullName || '',
      birthDate: patient.birthDate || '',
      phone: patient.phone || '',
      email: patient.email || '',
      address: patient.address || '',
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Удалить пациента?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="loading">Загрузка пациентов...</div>;
  }

  return (
    <div className="card">
      <div className="card-header page-toolbar">
        <h2>Пациенты</h2>
        <div className="page-toolbar-actions">
          {showForm ? (
            <button className="btn btn-secondary" type="button" onClick={resetForm}>
              Отмена
            </button>
          ) : null}
          <button className="btn btn-primary" type="button" onClick={() => setShowForm(true)}>
            Добавить пациента
          </button>
        </div>
      </div>

      <div className="page-filter-grid">
        <div className="form-group">
          <label htmlFor="searchName">Поиск по ФИО</label>
          <input
            id="searchName"
            className="form-control"
            type="text"
            value={searchName}
            onChange={(event) => setSearchName(event.target.value)}
            placeholder="Например, Иван Иванов"
          />
        </div>
        <div className="form-group">
          <label htmlFor="searchPhone">Фильтр по телефону</label>
          <input
            id="searchPhone"
            className="form-control"
            type="text"
            value={searchPhone}
            onChange={(event) => setSearchPhone(event.target.value)}
            placeholder="+7..."
          />
        </div>
      </div>

      {showForm ? (
        <form className="page-form" onSubmit={handleSubmit}>
          <div className="modal-header">
            <h2>{editingId ? 'Редактирование пациента' : 'Создание пациента'}</h2>
          </div>

          <div className="form-group">
            <label htmlFor="fullName">ФИО *</label>
            <input
              id="fullName"
              className="form-control"
              type="text"
              value={formData.fullName}
              onChange={(event) => setFormData((prev) => ({ ...prev, fullName: event.target.value }))}
            />
          </div>

          <div className="form-group">
            <label htmlFor="birthDate">Дата рождения</label>
            <input
              id="birthDate"
              className="form-control"
              type="date"
              value={formData.birthDate}
              onChange={(event) => setFormData((prev) => ({ ...prev, birthDate: event.target.value }))}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Телефон</label>
            <input
              id="phone"
              className="form-control"
              type="text"
              value={formData.phone}
              onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Электронная почта</label>
            <input
              id="email"
              className="form-control"
              type="email"
              value={formData.email}
              onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">Адрес</label>
            <textarea
              id="address"
              className="form-control"
              rows="3"
              value={formData.address}
              onChange={(event) => setFormData((prev) => ({ ...prev, address: event.target.value }))}
            />
          </div>

          <button className="btn btn-success" type="submit">
            {editingId ? 'Сохранить' : 'Создать'}
          </button>
        </form>
      ) : null}

      {patients.length === 0 ? (
        <div className="empty-state">
          <h3>Нет пациентов</h3>
          <p>Создайте первую карточку пациента.</p>
        </div>
      ) : (
        <div className="page-table-wrap">
          <table>
            <thead>
              <tr>
                <th>ФИО</th>
                <th>Дата рождения</th>
                <th>Телефон</th>
                <th>Эл. почта</th>
                <th>Адрес</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.id}>
                  <td>{patient.fullName}</td>
                  <td>{patient.birthDate || '—'}</td>
                  <td>{patient.phone || '—'}</td>
                  <td>{patient.email || '—'}</td>
                  <td>{patient.address || '—'}</td>
                  <td>
                    <div className="page-row-actions">
                      <button className="btn btn-secondary btn-small" type="button" onClick={() => handleEdit(patient)}>
                        Изменить
                      </button>
                      <button className="btn btn-danger btn-small" type="button" onClick={() => handleDelete(patient.id)}>
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
