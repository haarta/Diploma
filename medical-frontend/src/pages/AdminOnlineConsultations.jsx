import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminFilesApi, adminOnlineConsultationsApi } from '../api';

const emptyItem = {
  title: '',
  shortDescription: '',
  description: '',
  imageUrl: '',
  buttonText: 'Записаться на прием',
  buttonLink: '',
  displayOrder: 0,
  published: false,
};

const normalizeItem = (item) => ({
  title: item.title || '',
  shortDescription: item.shortDescription || '',
  description: item.description || '',
  imageUrl: item.imageUrl || '',
  buttonText: item.buttonText || 'Записаться на прием',
  buttonLink: item.buttonLink || '',
  displayOrder: item.displayOrder ?? 0,
  published: Boolean(item.published),
});

const getApiErrorMessage = (error, fallbackMessage) => {
  const apiMessage = error?.response?.data?.error || error?.response?.data?.message;
  if (apiMessage) {
    return apiMessage;
  }
  if (error?.message) {
    return `${fallbackMessage} (${error.message})`;
  }
  return fallbackMessage;
};

export default function AdminOnlineConsultations() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyItem);
  const [uploading, setUploading] = useState(false);

  const { data: items = [] } = useQuery({
    queryKey: ['admin-online-consultations'],
    queryFn: async () => {
      const response = await adminOnlineConsultationsApi.getAll();
      return response.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload) => adminOnlineConsultationsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-online-consultations'] });
      queryClient.invalidateQueries({ queryKey: ['public-online-consultations'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => adminOnlineConsultationsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-online-consultations'] });
      queryClient.invalidateQueries({ queryKey: ['public-online-consultations'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminOnlineConsultationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-online-consultations'] });
      queryClient.invalidateQueries({ queryKey: ['public-online-consultations'] });
    },
  });

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyItem);
  };

  const updateField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toPayload = () => ({
    title: form.title.trim(),
    shortDescription: form.shortDescription.trim(),
    description: form.description.trim() || null,
    imageUrl: form.imageUrl.trim() || null,
    buttonText: form.buttonText.trim() || null,
    buttonLink: form.buttonLink.trim() || null,
    displayOrder: form.displayOrder === '' ? 0 : Number(form.displayOrder),
    published: form.published,
  });

  const submit = (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.shortDescription.trim()) {
      window.alert('Заполните заголовок и основной текст.');
      return;
    }

    const payload = toPayload();
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
      return;
    }

    createMutation.mutate(payload);
  };

  const uploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploading(true);
    try {
      const response = await adminFilesApi.upload(file, 'online-consultations');
      updateField('imageUrl', response.data?.url || '');
    } catch (error) {
      window.alert(getApiErrorMessage(error, 'Не удалось загрузить изображение.'));
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const removeItem = (id) => {
    if (window.confirm('Удалить карточку онлайн-консультации?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="card">
      <div className="card-header page-toolbar">
        <h2>Онлайн-консультации</h2>
        <div className="page-toolbar-actions">
          <button className="btn btn-secondary" type="button" onClick={resetForm}>Новая карточка</button>
        </div>
      </div>

      <form className="page-form" onSubmit={submit}>
        <div className="modal-header">
          <h2>{editingId ? 'Редактирование карточки' : 'Создание карточки'}</h2>
        </div>

        <div className="form-group"><label>Заголовок *</label><input className="form-control" value={form.title} onChange={(e) => updateField('title', e.target.value)} /></div>
        <div className="form-group"><label>Основной текст *</label><textarea className="form-control" rows="3" value={form.shortDescription} onChange={(e) => updateField('shortDescription', e.target.value)} /></div>
        <div className="form-group"><label>Дополнительный текст</label><textarea className="form-control" rows="4" value={form.description} onChange={(e) => updateField('description', e.target.value)} /></div>
        <div className="form-group"><label>Изображение</label><input className="form-control" type="file" accept="image/*" onChange={uploadImage} /></div>
        <div className="form-group"><label>Ссылка на изображение</label><input className="form-control" value={form.imageUrl} readOnly /></div>
        <div className="page-filter-grid">
          <div className="form-group"><label>Текст кнопки</label><input className="form-control" value={form.buttonText} onChange={(e) => updateField('buttonText', e.target.value)} /></div>
          <div className="form-group"><label>Ссылка кнопки</label><input className="form-control" placeholder="https://..." value={form.buttonLink} onChange={(e) => updateField('buttonLink', e.target.value)} /></div>
        </div>
        <div className="page-filter-grid">
          <div className="form-group"><label>Порядок вывода</label><input className="form-control" type="number" value={form.displayOrder} onChange={(e) => updateField('displayOrder', e.target.value)} /></div>
          <div className="form-group"><label><input type="checkbox" checked={form.published} onChange={(e) => updateField('published', e.target.checked)} /> Опубликована</label></div>
        </div>

        {uploading ? <p>Загрузка изображения...</p> : null}
        <button className="btn btn-success" type="submit">{editingId ? 'Сохранить' : 'Создать'}</button>
      </form>

      <div className="page-table-wrap" style={{ marginTop: 20 }}>
        <table>
          <thead>
            <tr><th>Заголовок</th><th>Порядок</th><th>Публикация</th><th>Действия</th></tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td>
                <td>{item.displayOrder}</td>
                <td>{item.published ? 'Да' : 'Нет'}</td>
                <td>
                  <div className="page-row-actions">
                    <button className="btn btn-secondary btn-small" type="button" onClick={() => { setEditingId(item.id); setForm(normalizeItem(item)); }}>Изменить</button>
                    <button className="btn btn-danger btn-small" type="button" onClick={() => removeItem(item.id)}>Удалить</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
