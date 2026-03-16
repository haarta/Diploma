import { useEffect, useMemo, useState } from 'react';
import { doctorApi } from '../api';
import '../styles/DoctorCabinet.css';

const DOC_TYPES = [
  { value: 'CERTIFICATE', label: 'Справка' },
  { value: 'CONCLUSION', label: 'Заключение' },
  { value: 'ANALYSIS', label: 'Анализы' },
  { value: 'OTHER', label: 'Другое' },
];

function formatTime(value) {
  if (!value) return '—';
  return String(value).slice(0, 5);
}

export default function DoctorCabinet() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [upcoming, setUpcoming] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
  const [docType, setDocType] = useState('CONCLUSION');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

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
    } catch (requestError) {
      const apiMessage = requestError?.response?.data?.error;
      setError(apiMessage || 'Не удалось загрузить данные кабинета врача.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const documentsByAppointment = useMemo(() => {
    const map = new Map();
    for (const item of documents) {
      const key = String(item.appointmentId);
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(item);
    }
    return map;
  }, [documents]);

  const handleUpload = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!selectedAppointmentId) {
      setError('Выберите прием.');
      return;
    }
    if (!file) {
      setError('Выберите файл.');
      return;
    }

    setUploading(true);
    try {
      await doctorApi.uploadDocument(file, selectedAppointmentId, docType);
      setFile(null);
      setMessage('Документ успешно загружен.');
      await loadData();
    } catch (requestError) {
      const apiMessage = requestError?.response?.data?.error;
      setError(apiMessage || 'Не удалось загрузить документ.');
    } finally {
      setUploading(false);
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
          <h2>Предстоящие записи</h2>
          {loading ? (
            <p>Загрузка...</p>
          ) : upcoming.length === 0 ? (
            <p>У вас нет предстоящих записей.</p>
          ) : (
            <div className="doctor-list">
              {upcoming.map((item) => (
                <article className="doctor-list-item" key={item.id}>
                  <h3>Прием #{item.id}</h3>
                  <p><strong>Пациент ID:</strong> {item.patientId}</p>
                  <p><strong>Дата:</strong> {item.appointmentDate}</p>
                  <p><strong>Время:</strong> {formatTime(item.appointmentTime)}</p>
                  <p><strong>Статус:</strong> {item.status}</p>
                  <p><strong>Заметка:</strong> {item.notes || '—'}</p>
                  <p><strong>Документов:</strong> {documentsByAppointment.get(String(item.id))?.length || 0}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="doctor-card">
          <h2>Загрузить документ</h2>
          <form className="doctor-upload-form" onSubmit={handleUpload}>
            <label>
              Прием
              <select value={selectedAppointmentId} onChange={(event) => setSelectedAppointmentId(event.target.value)}>
                <option value="">Выберите прием</option>
                {upcoming.map((item) => (
                  <option key={item.id} value={item.id}>
                    #{item.id} • пациент {item.patientId} • {item.appointmentDate} {formatTime(item.appointmentTime)}
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
