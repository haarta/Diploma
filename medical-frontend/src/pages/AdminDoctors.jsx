import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminDoctorsApi, adminFilesApi, adminReviewsApi } from '../api';

const emptyDoctor = {
  userId: '',
  fullName: '',
  specialty: '',
  experienceYears: '',
  photoUrl: '',
  description: '',
  branch: '',
  published: false,
  prices: [{ serviceName: '', amount: '', currency: 'RUB' }],
  schedules: [{ dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '18:00' }],
  certificates: [{ title: '', issuer: '', issuedAt: '', fileUrl: '' }],
};

const reviewStatuses = [
  { value: 'PENDING', label: 'На модерации' },
  { value: 'APPROVED', label: 'Одобрен' },
  { value: 'REJECTED', label: 'Отклонен' },
];

const reviewStatusLabels = {
  PENDING: 'На модерации',
  APPROVED: 'Одобрен',
  REJECTED: 'Отклонен',
};

const getApiErrorMessage = (error, fallbackMessage) => {
  const status = error?.response?.status;
  const apiMessage = error?.response?.data?.error || error?.response?.data?.message;

  if (status === 401) {
    return 'Сессия истекла. Перезайдите в аккаунт.';
  }
  if (status === 403) {
    return 'Недостаточно прав для загрузки файла.';
  }
  if (apiMessage) {
    return apiMessage;
  }
  if (error?.message) {
    return `${fallbackMessage} (${error.message})`;
  }
  return fallbackMessage;
};

const normalizeDoctor = (doctor) => ({
  userId: doctor.userId ?? '',
  fullName: doctor.fullName || '',
  specialty: doctor.specialty || '',
  experienceYears: doctor.experienceYears ?? '',
  photoUrl: doctor.photoUrl || '',
  description: doctor.description || '',
  branch: doctor.branch || '',
  published: Boolean(doctor.published),
  prices: doctor.prices?.length ? doctor.prices.map((p) => ({ serviceName: p.serviceName || '', amount: p.amount ?? '', currency: p.currency || 'RUB' })) : [{ serviceName: '', amount: '', currency: 'RUB' }],
  schedules: doctor.schedules?.length ? doctor.schedules.map((s) => ({ dayOfWeek: s.dayOfWeek || 'MONDAY', startTime: s.startTime || '09:00', endTime: s.endTime || '18:00' })) : [{ dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '18:00' }],
  certificates: doctor.certificates?.length ? doctor.certificates.map((c) => ({ title: c.title || '', issuer: c.issuer || '', issuedAt: c.issuedAt || '', fileUrl: c.fileUrl || '' })) : [{ title: '', issuer: '', issuedAt: '', fileUrl: '' }],
});

export default function AdminDoctors() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyDoctor);
  const [reviewStatus, setReviewStatus] = useState('PENDING');
  const [uploading, setUploading] = useState(false);

  const { data: doctors = [] } = useQuery({
    queryKey: ['admin-doctors'],
    queryFn: async () => {
      const response = await adminDoctorsApi.getAll();
      return response.data || [];
    },
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['admin-reviews', reviewStatus],
    queryFn: async () => {
      const response = await adminReviewsApi.getByStatus(reviewStatus);
      return response.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload) => adminDoctorsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => adminDoctorsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminDoctorsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
    },
  });

  const reviewStatusMutation = useMutation({
    mutationFn: ({ id, status }) => adminReviewsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
      queryClient.invalidateQueries({ queryKey: ['public-doctors'] });
    },
  });

  const doctorsById = useMemo(() => new Map(doctors.map((d) => [d.id, d])), [doctors]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyDoctor);
  };

  const updateField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const updateListField = (listName, index, field, value) => {
    setForm((prev) => ({
      ...prev,
      [listName]: prev[listName].map((item, idx) => (idx === index ? { ...item, [field]: value } : item)),
    }));
  };

  const addListRow = (listName, row) => {
    setForm((prev) => ({ ...prev, [listName]: [...prev[listName], row] }));
  };

  const removeListRow = (listName, index) => {
    setForm((prev) => ({
      ...prev,
      [listName]: prev[listName].length <= 1 ? prev[listName] : prev[listName].filter((_, idx) => idx !== index),
    }));
  };

  const toPayload = () => ({
    userId: form.userId === '' ? null : Number(form.userId),
    fullName: form.fullName.trim(),
    specialty: form.specialty.trim(),
    experienceYears: form.experienceYears === '' ? null : Number(form.experienceYears),
    photoUrl: form.photoUrl.trim() || null,
    description: form.description.trim() || null,
    branch: form.branch.trim() || null,
    published: form.published,
    prices: form.prices
      .filter((p) => p.serviceName.trim() && p.amount !== '')
      .map((p) => ({ serviceName: p.serviceName.trim(), amount: Number(p.amount), currency: p.currency.trim() || 'RUB' })),
    schedules: form.schedules
      .filter((s) => s.dayOfWeek.trim() && s.startTime.trim() && s.endTime.trim())
      .map((s) => ({ dayOfWeek: s.dayOfWeek.trim(), startTime: s.startTime.trim(), endTime: s.endTime.trim() })),
    certificates: form.certificates
      .filter((c) => c.title.trim())
      .map((c) => ({ title: c.title.trim(), issuer: c.issuer.trim() || null, issuedAt: c.issuedAt || null, fileUrl: c.fileUrl.trim() || null })),
  });

  const submit = (event) => {
    event.preventDefault();
    if (!form.fullName.trim() || !form.specialty.trim()) {
      window.alert('Заполните ФИО и специальность.');
      return;
    }

    const payload = toPayload();
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
      return;
    }
    createMutation.mutate(payload);
  };

  const startEdit = (doctor) => {
    setEditingId(doctor.id);
    setForm(normalizeDoctor(doctor));
  };

  const removeDoctor = (id) => {
    if (window.confirm('Удалить карточку врача?')) {
      deleteMutation.mutate(id);
    }
  };

  const uploadPhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setUploading(true);
    try {
      const response = await adminFilesApi.upload(file, 'doctors');
      updateField('photoUrl', response.data?.url || '');
    } catch (error) {
      const message = getApiErrorMessage(error, 'Не удалось загрузить фото.');
      window.alert(message);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const uploadCertificateFile = async (index, event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setUploading(true);
    try {
      const response = await adminFilesApi.upload(file, 'certificates');
      updateListField('certificates', index, 'fileUrl', response.data?.url || '');
    } catch (error) {
      const message = getApiErrorMessage(error, 'Не удалось загрузить сертификат.');
      window.alert(message);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="card">
      <div className="card-header page-toolbar">
        <h2>Админка врачей</h2>
        <div className="page-toolbar-actions">
          <button className="btn btn-secondary" type="button" onClick={resetForm}>Новая карточка</button>
        </div>
      </div>

      <form className="page-form" onSubmit={submit}>
        <div className="modal-header">
          <h2>{editingId ? 'Редактирование врача' : 'Создание врача'}</h2>
        </div>

        <div className="form-group"><label>ID учетной записи врача</label><input className="form-control" type="number" min="1" value={form.userId} onChange={(e) => updateField('userId', e.target.value)} /></div>
        <div className="form-group"><label>ФИО *</label><input className="form-control" value={form.fullName} onChange={(e) => updateField('fullName', e.target.value)} /></div>
        <div className="form-group"><label>Специальность *</label><input className="form-control" value={form.specialty} onChange={(e) => updateField('specialty', e.target.value)} /></div>
        <div className="form-group"><label>Стаж (лет)</label><input className="form-control" type="number" min="0" value={form.experienceYears} onChange={(e) => updateField('experienceYears', e.target.value)} /></div>
        <div className="form-group"><label>Фото врача</label><input className="form-control" type="file" accept="image/*,application/pdf" onChange={uploadPhoto} /></div>
        <div className="form-group"><label>Ссылка на фото (заполняется автоматически)</label><input className="form-control" value={form.photoUrl} readOnly /></div>
        <div className="form-group"><label>Описание</label><textarea className="form-control" rows="4" value={form.description} onChange={(e) => updateField('description', e.target.value)} /></div>
        <div className="form-group"><label>Филиал</label><input className="form-control" value={form.branch} onChange={(e) => updateField('branch', e.target.value)} /></div>
        <div className="form-group"><label><input type="checkbox" checked={form.published} onChange={(e) => updateField('published', e.target.checked)} /> Опубликован</label></div>

        <h3>Цены</h3>
        {form.prices.map((item, idx) => (
          <div key={`price-${idx}`} className="page-row-actions">
            <input className="form-control" placeholder="Услуга" value={item.serviceName} onChange={(e) => updateListField('prices', idx, 'serviceName', e.target.value)} />
            <input className="form-control" type="number" step="0.01" placeholder="Цена" value={item.amount} onChange={(e) => updateListField('prices', idx, 'amount', e.target.value)} />
            <input className="form-control" placeholder="Валюта" value={item.currency} onChange={(e) => updateListField('prices', idx, 'currency', e.target.value)} />
            <button className="btn btn-danger btn-small" type="button" onClick={() => removeListRow('prices', idx)}>Удалить</button>
          </div>
        ))}
        <button className="btn btn-secondary btn-small" type="button" onClick={() => addListRow('prices', { serviceName: '', amount: '', currency: 'RUB' })}>+ Цена</button>

        <h3>Расписание</h3>
        {form.schedules.map((item, idx) => (
          <div key={`schedule-${idx}`} className="page-row-actions">
            <input className="form-control" placeholder="День недели" value={item.dayOfWeek} onChange={(e) => updateListField('schedules', idx, 'dayOfWeek', e.target.value)} />
            <input className="form-control" placeholder="Начало" value={item.startTime} onChange={(e) => updateListField('schedules', idx, 'startTime', e.target.value)} />
            <input className="form-control" placeholder="Конец" value={item.endTime} onChange={(e) => updateListField('schedules', idx, 'endTime', e.target.value)} />
            <button className="btn btn-danger btn-small" type="button" onClick={() => removeListRow('schedules', idx)}>Удалить</button>
          </div>
        ))}
        <button className="btn btn-secondary btn-small" type="button" onClick={() => addListRow('schedules', { dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '18:00' })}>+ Слот</button>

        <h3>Сертификаты</h3>
        {form.certificates.map((item, idx) => (
          <div key={`cert-${idx}`} className="page-row-actions">
            <input className="form-control" placeholder="Название" value={item.title} onChange={(e) => updateListField('certificates', idx, 'title', e.target.value)} />
            <input className="form-control" placeholder="Кем выдан" value={item.issuer} onChange={(e) => updateListField('certificates', idx, 'issuer', e.target.value)} />
            <input className="form-control" type="date" value={item.issuedAt} onChange={(e) => updateListField('certificates', idx, 'issuedAt', e.target.value)} />
            <input className="form-control" placeholder="URL файла" value={item.fileUrl} onChange={(e) => updateListField('certificates', idx, 'fileUrl', e.target.value)} />
            <input className="form-control" type="file" accept="image/*,application/pdf" onChange={(e) => uploadCertificateFile(idx, e)} />
            <button className="btn btn-danger btn-small" type="button" onClick={() => removeListRow('certificates', idx)}>Удалить</button>
          </div>
        ))}
        <button className="btn btn-secondary btn-small" type="button" onClick={() => addListRow('certificates', { title: '', issuer: '', issuedAt: '', fileUrl: '' })}>+ Сертификат</button>

        {uploading ? <p>Загрузка файла...</p> : null}
        <button className="btn btn-success" type="submit">{editingId ? 'Сохранить' : 'Создать'}</button>
      </form>

      <div className="page-table-wrap" style={{ marginTop: 20 }}>
        <table>
          <thead>
            <tr><th>User ID</th><th>ФИО</th><th>Специальность</th><th>Филиал</th><th>Публикация</th><th>Действия</th></tr>
          </thead>
          <tbody>
            {doctors.map((doctor) => (
              <tr key={doctor.id}>
                <td>{doctor.userId || '—'}</td>
                <td>{doctor.fullName}</td>
                <td>{doctor.specialty}</td>
                <td>{doctor.branch || '—'}</td>
                <td>{doctor.published ? 'Да' : 'Нет'}</td>
                <td>
                  <div className="page-row-actions">
                    <button className="btn btn-secondary btn-small" type="button" onClick={() => startEdit(doctor)}>Изменить</button>
                    <button className="btn btn-danger btn-small" type="button" onClick={() => removeDoctor(doctor.id)}>Удалить</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 24 }}>
        <h3>Модерация отзывов</h3>
        <div className="page-row-actions">
          <label htmlFor="review-status">Статус:</label>
          <select id="review-status" className="form-control" value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value)}>
            {reviewStatuses.map((status) => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
        </div>

        {reviews.length === 0 ? (
          <p>Отзывов с этим статусом нет.</p>
        ) : (
          <div className="page-table-wrap">
            <table>
              <thead>
                <tr><th>ID</th><th>Врач</th><th>Автор</th><th>Оценка</th><th>Текст</th><th>Управление</th></tr>
              </thead>
              <tbody>
                {reviews.map((review) => {
                  const doctor = doctorsById.get(review.doctorId);
                  return (
                    <tr key={review.id}>
                      <td>{review.id}</td>
                      <td>{doctor?.fullName || review.doctorId}</td>
                      <td>{review.authorName}</td>
                      <td>{review.rating}</td>
                      <td>{review.text}</td>
                      <td>
                        <div className="page-row-actions">
                          <button className="btn btn-success btn-small" type="button" onClick={() => reviewStatusMutation.mutate({ id: review.id, status: 'APPROVED' })}>Одобрить</button>
                          <button className="btn btn-danger btn-small" type="button" onClick={() => reviewStatusMutation.mutate({ id: review.id, status: 'REJECTED' })}>Отклонить</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

