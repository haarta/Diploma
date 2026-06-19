import { useEffect, useMemo, useState } from 'react';
import { authSessionApi, doctorApi } from '../api';
import '../styles/DoctorCabinet.css';

const DOC_TYPES = [
  { value: 'CERTIFICATE', label: 'Справка' },
  { value: 'CONCLUSION', label: 'Заключение' },
  { value: 'ANALYSIS', label: 'Анализы' },
  { value: 'OTHER', label: 'Другое' },
];

const STATUS_OPTIONS = [
  { value: 'CONFIRMED', label: 'Подтвердить' },
  { value: 'COMPLETED', label: 'Завершить прием' },
  { value: 'NO_SHOW', label: 'Отметить неявку' },
];

const ROLE_LABELS = {
  DOCTOR: 'Врач',
  ADMIN: 'Администратор',
  PATIENT: 'Пациент',
};

const APPOINTMENT_STATUS_LABELS = {
  SCHEDULED: 'Запланирован',
  CONFIRMED: 'Подтвержден',
  COMPLETED: 'Завершен',
  CANCELLED: 'Отменен',
  NO_SHOW: 'Неявка',
};

function formatTime(value) {
  return value ? String(value).slice(0, 5) : '—';
}

function formatExperience(years) {
  if (!years && years !== 0) {
    return '—';
  }
  return `${years} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'}`;
}

function formatRating(value) {
  return Number.isFinite(value) ? value.toFixed(1) : '—';
}

function formatRole(value) {
  return ROLE_LABELS[value] || 'Врач';
}

function formatAppointmentStatus(value) {
  return APPOINTMENT_STATUS_LABELS[value] || value || '—';
}

function getInitials(value) {
  if (!value) {
    return 'В';
  }
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase() || '')
    .join('');
}

export default function DoctorCabinet() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [profile, setProfile] = useState(null);
  const [account, setAccount] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
  const [docType, setDocType] = useState('CONCLUSION');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [statusForms, setStatusForms] = useState({});

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [doctorResponse, accountResponse, appointmentsResponse, documentsResponse] = await Promise.all([
        doctorApi.getMe(),
        authSessionApi.getMe(),
        doctorApi.getUpcomingAppointments(),
        doctorApi.getDocuments(),
      ]);

      const appointments = appointmentsResponse.data || [];
      setProfile(doctorResponse.data || null);
      setAccount(accountResponse.data || null);
      setUpcoming(appointments);
      setDocuments(documentsResponse.data || []);

      setSelectedAppointmentId((current) => {
        if (appointments.length === 0) {
          return '';
        }
        if (current && appointments.some((item) => String(item.id) === current)) {
          return current;
        }
        return String(appointments[0].id);
      });

      setStatusForms((prev) => {
        const next = { ...prev };
        appointments.forEach((item) => {
          next[item.id] = next[item.id] || { status: 'CONFIRMED', completionSummary: '' };
        });
        return next;
      });
    } catch (requestError) {
      setError(requestError?.response?.data?.error || 'Не удалось загрузить данные кабинета врача.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const documentsByAppointment = useMemo(() => {
    const map = new Map();
    documents.forEach((item) => {
      const key = String(item.appointmentId);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return map;
  }, [documents]);

  const handleUpload = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!selectedAppointmentId || !file) {
      setError('Выберите прием и файл.');
      return;
    }

    setUploading(true);

    try {
      await doctorApi.uploadDocument(file, selectedAppointmentId, docType);
      setFile(null);
      setMessage('Документ успешно загружен.');
      await loadData();
    } catch (requestError) {
      setError(requestError?.response?.data?.error || 'Не удалось загрузить документ.');
    } finally {
      setUploading(false);
    }
  };

  const updateForm = (id, field, value) => {
    setStatusForms((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || { status: 'CONFIRMED', completionSummary: '' }),
        [field]: value,
      },
    }));
  };

  const handleStatusUpdate = async (appointmentId) => {
    setMessage('');
    setError('');

    try {
      await doctorApi.updateAppointmentStatus(appointmentId, statusForms[appointmentId]);
      setMessage('Статус приема обновлен.');
      await loadData();
    } catch (requestError) {
      setError(requestError?.response?.data?.error || 'Не удалось обновить статус приема.');
    }
  };

  return (
    <section className="doctor-cabinet-page">
      <header className="doctor-cabinet-head">
        <div>
          <h1>Кабинет врача</h1>
          <p className="doctor-cabinet-head__subtitle">Рабочее место врача для приема пациентов и загрузки документов</p>
        </div>
        <button className="doctor-refresh-btn" type="button" onClick={loadData} disabled={loading}>
          Обновить
        </button>
      </header>

      {profile ? (
        <section className="doctor-profile-card">
          <div className="doctor-profile-card__identity">
            {profile.photoUrl ? (
              <img className="doctor-profile-card__avatar" src={profile.photoUrl} alt={profile.fullName} />
            ) : (
              <div className="doctor-profile-card__avatar doctor-profile-card__avatar--placeholder">
                {getInitials(profile.fullName)}
              </div>
            )}

            <div className="doctor-profile-card__meta">
              <span className="doctor-profile-card__badge">Профиль врача</span>
              <h2>{profile.fullName}</h2>
              <p className="doctor-profile-card__specialty">{profile.specialty || 'Специальность не указана'}</p>
              {profile.description ? <p className="doctor-profile-card__description">{profile.description}</p> : null}
            </div>
          </div>

          <div className="doctor-profile-card__facts">
            <div>
              <span>Учетная запись</span>
              <strong>{account?.email || '—'}</strong>
            </div>
            <div>
              <span>Роль</span>
              <strong>{formatRole(account?.role)}</strong>
            </div>
            <div>
              <span>Специальность</span>
              <strong>{profile.specialty || '—'}</strong>
            </div>
            <div>
              <span>Филиал</span>
              <strong>{profile.branch || '—'}</strong>
            </div>
            <div>
              <span>Стаж</span>
              <strong>{formatExperience(profile.experienceYears)}</strong>
            </div>
            <div>
              <span>Рейтинг</span>
              <strong>{formatRating(profile.averageRating)}</strong>
            </div>
            <div>
              <span>Отзывы</span>
              <strong>{profile.reviewCount ?? 0}</strong>
            </div>
            <div>
              <span>ID врача</span>
              <strong>{profile.id || '—'}</strong>
            </div>
          </div>
        </section>
      ) : null}

      {error ? <p className="doctor-error">{error}</p> : null}
      {message ? <p className="doctor-success">{message}</p> : null}

      <div className="doctor-cabinet-grid">
        <section className="doctor-card">
          <h2>Приемы</h2>
          {loading ? (
            <p>Загрузка...</p>
          ) : upcoming.length === 0 ? (
            <p>У вас нет активных приемов.</p>
          ) : (
            <div className="doctor-list">
              {upcoming.map((item) => (
                <article className="doctor-list-item" key={item.id}>
                  <h3>{item.patientFullName || `Прием #${item.id}`}</h3>
                  <p><strong>Услуга:</strong> {item.serviceName || 'Консультация'}</p>
                  <p><strong>Дата:</strong> {item.appointmentDate}</p>
                  <p><strong>Время:</strong> {formatTime(item.appointmentTime)}</p>
                  <p><strong>Эл. почта пациента:</strong> {item.patientEmail || '—'}</p>
                  <p><strong>Статус:</strong> {formatAppointmentStatus(item.status)}</p>
                  {item.completionSummary ? <p><strong>Комментарий врача:</strong> {item.completionSummary}</p> : null}

                  <div className="doctor-upload-form">
                    <label>
                      Новый статус
                      <select
                        value={statusForms[item.id]?.status || 'CONFIRMED'}
                        onChange={(event) => updateForm(item.id, 'status', event.target.value)}
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Комментарий врача
                      <textarea
                        rows="3"
                        value={statusForms[item.id]?.completionSummary || ''}
                        onChange={(event) => updateForm(item.id, 'completionSummary', event.target.value)}
                      />
                    </label>
                    <button className="doctor-upload-btn" type="button" onClick={() => handleStatusUpdate(item.id)}>
                      Сохранить статус
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="doctor-card">
          <h2>Загрузить заключение или документ</h2>
          <form className="doctor-upload-form" onSubmit={handleUpload}>
            <label>
              Прием
              <select value={selectedAppointmentId} onChange={(event) => setSelectedAppointmentId(event.target.value)}>
                <option value="">Выберите прием</option>
                {upcoming.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.patientFullName || `#${item.id}`} • {item.appointmentDate} {formatTime(item.appointmentTime)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Тип документа
              <select value={docType} onChange={(event) => setDocType(event.target.value)}>
                {DOC_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>

            <label>
              Файл
              <input
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
            </label>

            <button className="doctor-upload-btn" type="submit" disabled={uploading}>
              {uploading ? 'Загрузка...' : 'Загрузить'}
            </button>
          </form>

          <h3>Последние документы</h3>
          {documents.length === 0 ? (
            <p>Документы еще не загружены.</p>
          ) : (
            <ul className="doctor-doc-list">
              {documents.slice(0, 12).map((item) => (
                <li key={item.id}>
                  <span>#{item.appointmentId} • {item.documentType}</span>
                  <a href={item.fileUrl} target="_blank" rel="noreferrer">{item.fileName}</a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}
