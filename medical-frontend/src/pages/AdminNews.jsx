import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminFilesApi, adminNewsApi } from '../api';

const emptyItem = {
  title: '',
  shortDescription: '',
  category: '',
  description: '',
  imageUrl: '',
  displayOrder: 0,
  published: false,
};

const normalizeItem = (item) => ({
  title: item.title || '',
  shortDescription: item.shortDescription || '',
  category: item.category || '',
  description: item.description || '',
  imageUrl: item.imageUrl || '',
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

export default function AdminNews() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyItem);
  const [uploading, setUploading] = useState(false);

  const { data: items = [] } = useQuery({
    queryKey: ['admin-news'],
    queryFn: async () => {
      const response = await adminNewsApi.getAll();
      return response.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload) => adminNewsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      queryClient.invalidateQueries({ queryKey: ['public-news'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => adminNewsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      queryClient.invalidateQueries({ queryKey: ['public-news'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminNewsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      queryClient.invalidateQueries({ queryKey: ['public-news'] });
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
    category: form.category.trim() || null,
    description: form.description.trim() || null,
    imageUrl: form.imageUrl.trim() || null,
    displayOrder: form.displayOrder === '' ? 0 : Number(form.displayOrder),
    published: form.published,
  });

  const submit = (event) => {
    event.preventDefault();

    if (!form.title.trim() || !form.shortDescription.trim()) {
      window.alert('Заполните заголовок и короткое описание новости.');
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
      const response = await adminFilesApi.upload(file, 'news');
      updateField('imageUrl', response.data?.url || '');
    } catch (error) {
      window.alert(getApiErrorMessage(error, 'Не удалось загрузить изображение новости.'));
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const removeItem = (id) => {
    if (window.confirm('Удалить новость?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="card">
      <div className="card-header page-toolbar">
        <h2>Новости</h2>
        <div className="page-toolbar-actions">
          <button className="btn btn-secondary" type="button" onClick={resetForm}>Новая новость</button>
        </div>
      </div>

      <form className="page-form" onSubmit={submit}>
        <div className="modal-header">
          <h2>{editingId ? 'Редактирование новости' : 'Создание новости'}</h2>
        </div>

        <div className="page-filter-grid">
          <div className="form-group"><label>Заголовок *</label><input className="form-control" value={form.title} onChange={(event) => updateField('title', event.target.value)} /></div>
          <div className="form-group"><label>Категория</label><input className="form-control" placeholder="Например: Педиатрия" value={form.category} onChange={(event) => updateField('category', event.target.value)} /></div>
        </div>
        <div className="form-group"><label>Короткое описание *</label><textarea className="form-control" rows="3" value={form.shortDescription} onChange={(event) => updateField('shortDescription', event.target.value)} /></div>
        <div className="form-group"><label>Подробное описание</label><textarea className="form-control" rows="5" value={form.description} onChange={(event) => updateField('description', event.target.value)} /></div>
        <div className="form-group"><label>Загрузить изображение</label><input className="form-control" type="file" accept="image/*" onChange={uploadImage} /></div>
        <div className="form-group"><label>Ссылка на изображение</label><input className="form-control" placeholder="https://..." value={form.imageUrl} onChange={(event) => updateField('imageUrl', event.target.value)} /></div>
        {form.imageUrl ? (
          <div className="form-group">
            <label>Превью</label>
            <img
              src={form.imageUrl}
              alt="Превью новости"
              style={{ width: '100%', maxWidth: 420, borderRadius: 20, border: '1px solid rgba(125, 151, 196, 0.18)' }}
            />
          </div>
        ) : null}
        <div className="page-filter-grid">
          <div className="form-group"><label>Порядок вывода</label><input className="form-control" type="number" value={form.displayOrder} onChange={(event) => updateField('displayOrder', event.target.value)} /></div>
          <div className="form-group"><label><input type="checkbox" checked={form.published} onChange={(event) => updateField('published', event.target.checked)} /> Опубликована</label></div>
        </div>

        {uploading ? <p>Загрузка изображения...</p> : null}
        <button className="btn btn-success" type="submit">{editingId ? 'Сохранить' : 'Создать'}</button>
      </form>

      <div className="page-table-wrap" style={{ marginTop: 20 }}>
        <table>
          <thead>
            <tr><th>Заголовок</th><th>Категория</th><th>Порядок</th><th>Публикация</th><th>Действия</th></tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td>
                <td>{item.category || '-'}</td>
                <td>{item.displayOrder}</td>
                <td>{item.published ? 'Да' : 'Нет'}</td>
                <td>
                  <div className="page-row-actions">
                    <button
                      className="btn btn-secondary btn-small"
                      type="button"
                      onClick={() => {
                        setEditingId(item.id);
                        setForm(normalizeItem(item));
                      }}
                    >
                      Изменить
                    </button>
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
