import { useEffect, useState } from 'react';
import { doctorVerificationApi, filesApi } from '../api';

const initialForm = {
  fullName: '',
  specialty: '',
  licenseNumber: '',
  licenseFileUrl: '',
  diplomaFileUrl: '',
  specialtyCertificateFileUrl: '',
  identityDocumentFileUrl: '',
};

const STATUS_LABELS = {
  PENDING_VERIFICATION: 'На проверке',
  APPROVED: 'Одобрена',
  REJECTED: 'Отклонена',
};

export default function DoctorVerificationRequest() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [application, setApplication] = useState(null);
  const [uploadingField, setUploadingField] = useState('');

  const loadMine = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await doctorVerificationApi.getMine();
      const data = response.data;
      setApplication(data);
      setForm({
        fullName: data.fullName || '',
        specialty: data.specialty || '',
        licenseNumber: data.licenseNumber || '',
        licenseFileUrl: data.licenseFileUrl || '',
        diplomaFileUrl: data.diplomaFileUrl || '',
        specialtyCertificateFileUrl: data.specialtyCertificateFileUrl || '',
        identityDocumentFileUrl: data.identityDocumentFileUrl || '',
      });
    } catch (requestError) {
      if (requestError?.response?.status === 400) {
        setApplication(null);
      } else {
        setError(requestError?.response?.data?.error || 'Не удалось загрузить заявку.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMine();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    if (!form.licenseFileUrl || !form.diplomaFileUrl || !form.specialtyCertificateFileUrl) {
      setSaving(false);
      setError('Загрузите обязательные документы: лицензия, диплом и сертификат по специальности.');
      return;
    }
    try {
      const response = await doctorVerificationApi.submit(form);
      setApplication(response.data);
      setMessage('Заявка отправлена на проверку.');
    } catch (requestError) {
      setError(requestError?.response?.data?.error || 'Не удалось отправить заявку.');
    } finally {
      setSaving(false);
    }
  };

  const uploadDocument = async (fieldName, file) => {
    if (!file) {
      return;
    }

    setError('');
    setMessage('');
    setUploadingField(fieldName);
    try {
      const response = await filesApi.upload(file, 'doctor-verification');
      const url = response.data?.url || '';
      setForm((prev) => ({ ...prev, [fieldName]: url }));
      setMessage('Файл успешно загружен.');
    } catch (requestError) {
      setError(requestError?.response?.data?.error || 'Не удалось загрузить файл.');
    } finally {
      setUploadingField('');
    }
  };

  return (
    <section className="cabinet-page">
      <div className="cabinet-top">
        <h1>Заявка на роль врача</h1>
      </div>

      <div className="cabinet-layout" style={{ gridTemplateColumns: '1fr' }}>
        <div className="cabinet-card">
          {loading ? <p>Загрузка...</p> : null}

          {application ? (
            <div>
              <p><strong>Статус:</strong> {STATUS_LABELS[application.status] || application.status}</p>
              <p><strong>Комментарий модерации:</strong> {application.reviewComment || '—'}</p>
              <hr />
            </div>
          ) : null}

          <form className="cabinet-medcard-form" onSubmit={submit}>
            <label className="cabinet-medcard-field">
              <span>ФИО</span>
              <input name="fullName" value={form.fullName} onChange={handleChange} required />
            </label>
            <label className="cabinet-medcard-field">
              <span>Специальность</span>
              <input name="specialty" value={form.specialty} onChange={handleChange} required />
            </label>
            <label className="cabinet-medcard-field">
              <span>Номер лицензии</span>
              <input name="licenseNumber" value={form.licenseNumber} onChange={handleChange} />
            </label>
            <label className="cabinet-medcard-field">
              <span>Лицензия (обязательно)</span>
              <input
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp"
                onChange={(event) => uploadDocument('licenseFileUrl', event.target.files?.[0])}
              />
              <input value={form.licenseFileUrl} readOnly placeholder="Файл не загружен" />
            </label>
            <label className="cabinet-medcard-field">
              <span>Диплом (обязательно)</span>
              <input
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp"
                onChange={(event) => uploadDocument('diplomaFileUrl', event.target.files?.[0])}
              />
              <input value={form.diplomaFileUrl} readOnly placeholder="Файл не загружен" />
            </label>
            <label className="cabinet-medcard-field">
              <span>Сертификат по специальности (обязательно)</span>
              <input
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp"
                onChange={(event) => uploadDocument('specialtyCertificateFileUrl', event.target.files?.[0])}
              />
              <input value={form.specialtyCertificateFileUrl} readOnly placeholder="Файл не загружен" />
            </label>
            <label className="cabinet-medcard-field">
              <span>Удостоверение личности (необязательно)</span>
              <input
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp"
                onChange={(event) => uploadDocument('identityDocumentFileUrl', event.target.files?.[0])}
              />
              <input value={form.identityDocumentFileUrl} readOnly placeholder="Можно не загружать" />
            </label>
            <div className="cabinet-medcard-actions">
              <button className="cabinet-refresh" type="submit" disabled={saving}>
                {saving ? 'Отправка...' : 'Отправить на проверку'}
              </button>
            </div>
          </form>

          {uploadingField ? <p className="cabinet-hint">Загрузка файла...</p> : null}
          {error ? <p className="cabinet-error">{error}</p> : null}
          {message ? <p className="cabinet-success">{message}</p> : null}
        </div>
      </div>
    </section>
  );
}
