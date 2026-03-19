import { useEffect, useMemo, useState } from 'react';
import { doctorApi } from '../api';
import '../styles/DoctorCabinet.css';

const DOC_TYPES = [
  { value: 'CERTIFICATE', label: 'Справка' },
  { value: 'CONCLUSION', label: 'Заключение' },
  { value: 'ANALYSIS', label: 'Анализы' },
  { value: 'OTHER', label: 'Другое' },
];

const STATUS_OPTIONS = [
  { value: 'CONFIRMED', label: 'Подтвердить' },
  { value: 'COMPLETED', label: 'Завершить приём' },
  { value: 'NO_SHOW', label: 'Отметить неявку' },
];

function formatTime(value) {
  return value ? String(value).slice(0, 5) : '—';
}

export default function DoctorCabinet() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
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
      const [appointmentsResponse, documentsResponse] = await Promise.all([
        doctorApi.getUpcomingAppointments(),
        doctorApi.getDocuments(),
      ]);
      const appointments = appointmentsResponse.data || [];
      setUpcoming(appointments);
      setDocuments(documentsResponse.data || []);
      if (!selectedAppointmentId && appointments.length > 0) {
        setSelectedAppointmentId(String(appointments[0].id));
      }
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
      setError('Выберите приём и файл.');
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
    const payload = statusForms[appointmentId];
    try {
      await doctorApi.updateAppointmentStatus(appointmentId, payload);
      setMessage('Статус приёма обновлён.');
      await loadData();
    } catch (requestError) {
      setError(requestError?.response?.data?.error || 'Не удалось обновить статус приёма.');
    }
  };

  return (
    <section className="doctor-cabinet-page">
      <header className="doctor-cabinet-head">
        <h1>Кабинет врача</h1>
        <button className="doctor-refresh-btn" type="button" onClick={loadData} disabled={loading}>
          Обновить
        </button>
      </header>

      {error ? <p className="doctor-error">{error}</p> : null}
      {message ? <p className="doctor-success">{message}</p> : null}

      <div className="doctor-cabinet-grid">
        <section className="doctor-card">
          <h2>Приёмы</h2>
          {loading ? (
            <p>Загрузка...</p>
          ) : upcoming.length === 0 ? (
            <p>У вас нет активных приёмов.</p>
          ) : (
            <div className="doctor-list">
              {upcoming.map((item) => (
                <article className="doctor-list-item" key={item.id}>
                  <h3>{item.patientFullName || `Приём #${item.id}`}</h3>
                  <p><strong>Услуга:</strong> {item.serviceName || 'Консультация'}</p>
                  <p><strong>Дата:</strong> {item.appointmentDate}</p>
                  <p><strong>Время:</strong> {formatTime(item.appointmentTime)}</p>
                  <p><strong>Email:</strong> {item.patientEmail || '—'}</p>
                  <p><strong>Статус:</strong> {item.status}</p>
                  {item.completionSummary ? <p><strong>Комментарий:</strong> {item.completionSummary}</p> : null}

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

                  <p><strong>Документов:</strong> {documentsByAppointment.get(String(item.id))?.length || 0}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="doctor-card">
          <h2>Загрузить заключение или документ</h2>
          <form className="doctor-upload-form" onSubmit={handleUpload}>
            <label>
              Приём
              <select value={selectedAppointmentId} onChange={(event) => setSelectedAppointmentId(event.target.value)}>
                <option value="">Выберите приём</option>
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
            <p>Документы ещё не загружены.</p>
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
