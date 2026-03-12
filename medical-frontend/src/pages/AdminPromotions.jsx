import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminFilesApi, adminPromotionsApi } from '../api';

const emptyPromotion = {
  title: '',
  shortDescription: '',
  description: '',
  imageUrl: '',
  buttonText: 'Подробнее',
  buttonLink: '',
  activeFrom: '',
  activeTo: '',
  published: false,
};

const normalizePromotion = (promotion) => ({
  title: promotion.title || '',
  shortDescription: promotion.shortDescription || '',
  description: promotion.description || '',
  imageUrl: promotion.imageUrl || '',
  buttonText: promotion.buttonText || 'Подробнее',
  buttonLink: promotion.buttonLink || '',
  activeFrom: promotion.activeFrom || '',
  activeTo: promotion.activeTo || '',
  published: Boolean(promotion.published),
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

export default function AdminPromotions() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyPromotion);
  const [uploading, setUploading] = useState(false);

  const { data: promotions = [] } = useQuery({
    queryKey: ['admin-promotions'],
    queryFn: async () => {
      const response = await adminPromotionsApi.getAll();
      return response.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload) => adminPromotionsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promotions'] });
      queryClient.invalidateQueries({ queryKey: ['public-promotions'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => adminPromotionsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promotions'] });
      queryClient.invalidateQueries({ queryKey: ['public-promotions'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminPromotionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promotions'] });
      queryClient.invalidateQueries({ queryKey: ['public-promotions'] });
    },
  });

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyPromotion);
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
    activeFrom: form.activeFrom || null,
    activeTo: form.activeTo || null,
    published: form.published,
  });

  const submit = (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.shortDescription.trim()) {
      window.alert('Заполните заголовок и короткое описание.');
      return;
    }

    const payload = toPayload();
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
      return;
    }

    createMutation.mutate(payload);
  };

  const removePromotion = (id) => {
    if (window.confirm('Удалить акцию?')) {
      deleteMutation.mutate(id);
    }
  };

  const uploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploading(true);
    try {
      const response = await adminFilesApi.upload(file, 'promotions');
      updateField('imageUrl', response.data?.url || '');
    } catch (error) {
      window.alert(getApiErrorMessage(error, 'Не удалось загрузить изображение.'));
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="card">
      <div className="card-header page-toolbar">
        <h2>Админка акций</h2>
        <div className="page-toolbar-actions">
          <button className="btn btn-secondary" type="button" onClick={resetForm}>Новая акция</button>
        </div>
      </div>

      <form className="page-form" onSubmit={submit}>
        <div className="modal-header">
          <h2>{editingId ? 'Редактирование акции' : 'Создание акции'}</h2>
        </div>

        <div className="form-group"><label>Заголовок *</label><input className="form-control" value={form.title} onChange={(e) => updateField('title', e.target.value)} /></div>
        <div className="form-group"><label>Короткое описание *</label><textarea className="form-control" rows="3" value={form.shortDescription} onChange={(e) => updateField('shortDescription', e.target.value)} /></div>
        <div className="form-group"><label>Подробное описание</label><textarea className="form-control" rows="5" value={form.description} onChange={(e) => updateField('description', e.target.value)} /></div>
        <div className="form-group"><label>Изображение</label><input className="form-control" type="file" accept="image/*" onChange={uploadImage} /></div>
        <div className="form-group"><label>Ссылка на изображение</label><input className="form-control" value={form.imageUrl} readOnly /></div>
        <div className="page-filter-grid">
          <div className="form-group"><label>Дата начала</label><input className="form-control" type="date" value={form.activeFrom} onChange={(e) => updateField('activeFrom', e.target.value)} /></div>
          <div className="form-group"><label>Дата окончания</label><input className="form-control" type="date" value={form.activeTo} onChange={(e) => updateField('activeTo', e.target.value)} /></div>
        </div>
        <div className="page-filter-grid">
          <div className="form-group"><label>Текст кнопки</label><input className="form-control" value={form.buttonText} onChange={(e) => updateField('buttonText', e.target.value)} /></div>
          <div className="form-group"><label>Ссылка кнопки</label><input className="form-control" placeholder="https://..." value={form.buttonLink} onChange={(e) => updateField('buttonLink', e.target.value)} /></div>
        </div>
        <div className="form-group"><label><input type="checkbox" checked={form.published} onChange={(e) => updateField('published', e.target.checked)} /> Опубликована</label></div>

        {uploading ? <p>Загрузка изображения...</p> : null}
        <button className="btn btn-success" type="submit">{editingId ? 'Сохранить' : 'Создать'}</button>
      </form>

      <div className="page-table-wrap" style={{ marginTop: 20 }}>
        <table>
          <thead>
            <tr><th>Заголовок</th><th>Срок</th><th>Публикация</th><th>Действия</th></tr>
          </thead>
          <tbody>
            {promotions.map((promotion) => (
              <tr key={promotion.id}>
                <td>{promotion.title}</td>
                <td>{promotion.activeFrom || '-'} / {promotion.activeTo || '-'}</td>
                <td>{promotion.published ? 'Да' : 'Нет'}</td>
                <td>
                  <div className="page-row-actions">
                    <button className="btn btn-secondary btn-small" type="button" onClick={() => { setEditingId(promotion.id); setForm(normalizePromotion(promotion)); }}>Изменить</button>
                    <button className="btn btn-danger btn-small" type="button" onClick={() => removePromotion(promotion.id)}>Удалить</button>
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
