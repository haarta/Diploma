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

const DOCUMENT_TYPE_LABELS = {
  CERTIFICATE: 'Справка',
  CONCLUSION: 'Заключение',
  VISIT_REPORT: 'Итог приема',
  ANALYSIS: 'Анализы',
  OTHER: 'Документ',
};

const EMPTY_STATUS_FORM = {
  status: 'CONFIRMED',
  completionSummary: '',
  complaints: '',
  anamnesis: '',
  objectiveFindings: '',
  diagnosis: '',
  prescriptions: '',
  treatmentPlan: '',
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

function getReportTemplate(specialty) {
  const normalized = String(specialty || '').toLowerCase();

  if (normalized.includes('аллерг')) {
    return {
      intro: 'Шаблон аллерголога',
      complaints: 'Опишите реакции, сезонность, контакт с аллергенами, зуд, высыпания, ринит или отеки.',
      anamnesis: 'Укажите давность симптомов, частоту обострений, семейный анамнез и ранее проведенное лечение.',
      objectiveFindings: 'Зафиксируйте данные осмотра кожи, слизистых, дыхания, отечности и общего состояния.',
      diagnosis: 'Сформулируйте клинический диагноз или рабочее заключение по аллергологическому профилю.',
      prescriptions: 'Перечислите препараты, режим приема, обследования и рекомендации по исключению триггеров.',
      treatmentPlan: 'Опишите план наблюдения, контроль симптомов, сроки повторного приема и дальнейшую диагностику.',
    };
  }

  if (normalized.includes('карди')) {
    return {
      intro: 'Шаблон кардиолога',
      complaints: 'Опишите боли в груди, перебои, одышку, отеки, подъемы давления и переносимость нагрузки.',
      anamnesis: 'Укажите начало жалоб, факторы риска, сопутствующие болезни, прием препаратов и прошлые обследования.',
      objectiveFindings: 'Зафиксируйте АД, пульс, наличие отеков, аускультацию и другие значимые данные осмотра.',
      diagnosis: 'Сформулируйте кардиологический диагноз или клиническое заключение по итогам приема.',
      prescriptions: 'Перечислите медикаментозные назначения, обследования и рекомендации по контролю давления.',
      treatmentPlan: 'Опишите план лечения, дообследования и дату контрольной консультации.',
    };
  }

  if (normalized.includes('лор') || normalized.includes('отолар')) {
    return {
      intro: 'Шаблон ЛОР-врача',
      complaints: 'Опишите жалобы на нос, горло, уши, слух, выделения, дыхание, боль и длительность симптомов.',
      anamnesis: 'Укажите течение заболевания, частоту эпизодов, перенесенные инфекции, операции и предыдущее лечение.',
      objectiveFindings: 'Зафиксируйте местный статус ЛОР-органов, температуру и иные объективные данные осмотра.',
      diagnosis: 'Сформулируйте ЛОР-диагноз или клиническое заключение.',
      prescriptions: 'Перечислите местную и системную терапию, обследования, режим и ограничения.',
      treatmentPlan: 'Опишите план лечения и сроки повторного осмотра.',
    };
  }

  if (normalized.includes('невр')) {
    return {
      intro: 'Шаблон невролога',
      complaints: 'Опишите головные боли, головокружение, боли в спине, слабость, онемение и нарушения сна.',
      anamnesis: 'Укажите давность симптомов, провоцирующие факторы, травмы, стресс и предыдущее лечение.',
      objectiveFindings: 'Зафиксируйте неврологический статус, чувствительность, координацию и мышечный тонус.',
      diagnosis: 'Сформулируйте неврологический диагноз или рабочее клиническое заключение.',
      prescriptions: 'Перечислите медикаментозные назначения, обследования, режим и ограничения.',
      treatmentPlan: 'Опишите этапы лечения, контроль эффективности и дату повторного приема.',
    };
  }

  return {
    intro: 'Шаблон амбулаторного приема',
    complaints: 'Кратко опишите основные жалобы пациента и повод обращения.',
    anamnesis: 'Укажите анамнез заболевания, длительность жалоб, сопутствующие факторы и ранее проведенное лечение.',
    objectiveFindings: 'Зафиксируйте данные осмотра и объективные клинические признаки.',
    diagnosis: 'Сформулируйте клинический диагноз или заключение по итогам приема.',
    prescriptions: 'Перечислите назначения, обследования, препараты и рекомендации по режиму.',
    treatmentPlan: 'Опишите дальнейший план лечения и наблюдения.',
  };
}

function hasReportFields(form) {
  return Boolean(
    form?.complaints ||
    form?.anamnesis ||
    form?.objectiveFindings ||
    form?.diagnosis ||
    form?.prescriptions ||
    form?.treatmentPlan
  );
}

function buildStatusForm(item) {
  return {
    status: item?.status === 'NO_SHOW' ? 'NO_SHOW' : item?.status === 'COMPLETED' ? 'COMPLETED' : 'CONFIRMED',
    completionSummary: item?.completionSummary || '',
    complaints: item?.complaints || '',
    anamnesis: item?.anamnesis || '',
    objectiveFindings: item?.objectiveFindings || '',
    diagnosis: item?.diagnosis || '',
    prescriptions: item?.prescriptions || '',
    treatmentPlan: item?.treatmentPlan || '',
  };
}

function formatDocumentType(value) {
  return DOCUMENT_TYPE_LABELS[value] || value || 'Документ';
}

export default function DoctorCabinet() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [profile, setProfile] = useState(null);
  const [account, setAccount] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [completedAppointments, setCompletedAppointments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [statusForms, setStatusForms] = useState({});
  const [completedSearch, setCompletedSearch] = useState('');
  const [completedDate, setCompletedDate] = useState('');
  const [documentsAppointment, setDocumentsAppointment] = useState(null);
  const [uploadAppointment, setUploadAppointment] = useState(null);
  const [uploadDocType, setUploadDocType] = useState('CONCLUSION');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const reportTemplate = useMemo(() => getReportTemplate(profile?.specialty), [profile?.specialty]);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [
        doctorResponse,
        accountResponse,
        appointmentsResponse,
        completedResponse,
        documentsResponse,
      ] = await Promise.all([
        doctorApi.getMe(),
        authSessionApi.getMe(),
        doctorApi.getUpcomingAppointments(),
        doctorApi.getCompletedAppointments(),
        doctorApi.getDocuments(),
      ]);

      const activeItems = appointmentsResponse.data || [];
      const completedItems = completedResponse.data || [];
      const allAppointments = [...activeItems, ...completedItems];

      setProfile(doctorResponse.data || null);
      setAccount(accountResponse.data || null);
      setUpcoming(activeItems);
      setCompletedAppointments(completedItems);
      setDocuments(documentsResponse.data || []);
      setStatusForms(() => {
        const next = {};
        allAppointments.forEach((item) => {
          next[item.id] = buildStatusForm(item);
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
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(item);
    });
    return map;
  }, [documents]);

  const filteredCompletedAppointments = useMemo(() => {
    const query = completedSearch.trim().toLowerCase();

    return completedAppointments.filter((item) => {
      const matchesSearch =
        !query || (item.patientFullName || '').toLowerCase().includes(query);
      const matchesDate = !completedDate || String(item.appointmentDate) === completedDate;
      return matchesSearch && matchesDate;
    });
  }, [completedAppointments, completedDate, completedSearch]);

  const handleUpload = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!uploadAppointment || !uploadFile) {
      setError('Выберите файл для загрузки.');
      return;
    }

    setUploading(true);

    try {
      await doctorApi.uploadDocument(uploadFile, uploadAppointment.id, uploadDocType);
      setUploadAppointment(null);
      setUploadDocType('CONCLUSION');
      setUploadFile(null);
      setMessage('Документ добавлен к приему. Пациент получит уведомление.');
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
        ...(prev[id] || EMPTY_STATUS_FORM),
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

  const openAppointmentDocuments = (item) => {
    setDocumentsAppointment(item);
    setError('');
    setMessage('');
  };

  const openUploadModal = (item) => {
    setUploadAppointment(item);
    setUploadDocType('CONCLUSION');
    setUploadFile(null);
    setError('');
    setMessage('');
  };

  const closeUploadModal = () => {
    if (uploading) {
      return;
    }
    setUploadAppointment(null);
    setUploadDocType('CONCLUSION');
    setUploadFile(null);
  };

  const closeDocumentsModal = () => {
    setDocumentsAppointment(null);
  };

  return (
    <>
      <section className="doctor-cabinet-page">
        <header className="doctor-cabinet-head">
          <div>
            <h1>Кабинет врача</h1>
            <p className="doctor-cabinet-head__subtitle">
              Рабочее место врача для приема пациентов, заполнения заключения и прикрепления документов к конкретному приему.
            </p>
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

        <section className="doctor-card">
          <h2>Активные приемы</h2>
          {loading ? (
            <p>Загрузка...</p>
          ) : upcoming.length === 0 ? (
            <p>У вас нет активных приемов.</p>
          ) : (
            <div className="doctor-list">
              {upcoming.map((item) => {
                const form = statusForms[item.id] || EMPTY_STATUS_FORM;
                const showReportFields = form.status === 'COMPLETED' || hasReportFields(form);

                return (
                  <article className="doctor-list-item" key={item.id}>
                    <h3>{item.patientFullName || `Прием #${item.id}`}</h3>
                    <p><strong>Услуга:</strong> {item.serviceName || 'Консультация'}</p>
                    <p><strong>Дата:</strong> {item.appointmentDate}</p>
                    <p><strong>Время:</strong> {formatTime(item.appointmentTime)}</p>
                    <p><strong>Email пациента:</strong> {item.patientEmail || '—'}</p>
                    <p><strong>Статус:</strong> {formatAppointmentStatus(item.status)}</p>
                    {item.completionSummary ? <p><strong>Итог приема:</strong> {item.completionSummary}</p> : null}

                    <div className="doctor-upload-form">
                      <label>
                        Новый статус
                        <select
                          value={form.status}
                          onChange={(event) => updateForm(item.id, 'status', event.target.value)}
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </label>

                      {showReportFields ? (
                        <div className="doctor-report-block">
                          <div className="doctor-report-block__head">
                            <strong>{reportTemplate.intro}</strong>
                          </div>

                          <label>
                            Жалобы
                            <textarea
                              rows="3"
                              placeholder={reportTemplate.complaints}
                              value={form.complaints}
                              onChange={(event) => updateForm(item.id, 'complaints', event.target.value)}
                            />
                          </label>

                          <label>
                            Анамнез
                            <textarea
                              rows="4"
                              placeholder={reportTemplate.anamnesis}
                              value={form.anamnesis}
                              onChange={(event) => updateForm(item.id, 'anamnesis', event.target.value)}
                            />
                          </label>

                          <label>
                            Объективные данные
                            <textarea
                              rows="4"
                              placeholder={reportTemplate.objectiveFindings}
                              value={form.objectiveFindings}
                              onChange={(event) => updateForm(item.id, 'objectiveFindings', event.target.value)}
                            />
                          </label>

                          <label>
                            Диагноз
                            <textarea
                              rows="3"
                              placeholder={reportTemplate.diagnosis}
                              value={form.diagnosis}
                              onChange={(event) => updateForm(item.id, 'diagnosis', event.target.value)}
                            />
                          </label>

                          <label>
                            Назначения
                            <textarea
                              rows="4"
                              placeholder={reportTemplate.prescriptions}
                              value={form.prescriptions}
                              onChange={(event) => updateForm(item.id, 'prescriptions', event.target.value)}
                            />
                          </label>

                          <label>
                            План лечения и наблюдения
                            <textarea
                              rows="4"
                              placeholder={reportTemplate.treatmentPlan}
                              value={form.treatmentPlan}
                              onChange={(event) => updateForm(item.id, 'treatmentPlan', event.target.value)}
                            />
                          </label>
                        </div>
                      ) : null}

                      <label>
                        Итог приема / комментарий врача
                        <textarea
                          rows="3"
                          value={form.completionSummary}
                          onChange={(event) => updateForm(item.id, 'completionSummary', event.target.value)}
                        />
                      </label>

                      <button className="doctor-upload-btn" type="button" onClick={() => handleStatusUpdate(item.id)}>
                        Сохранить статус
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="doctor-card">
          <div className="doctor-section-head">
            <div>
              <h2>Завершенные приемы</h2>
              <p className="doctor-card__hint">Ищите прошедший прием по дате или по ФИО пациента и работайте с документами прямо из карточки.</p>
            </div>
            <div className="doctor-history-filters">
              <input
                type="search"
                placeholder="Поиск пациента по ФИО"
                value={completedSearch}
                onChange={(event) => setCompletedSearch(event.target.value)}
              />
              <input
                type="date"
                value={completedDate}
                onChange={(event) => setCompletedDate(event.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <p>Загрузка...</p>
          ) : filteredCompletedAppointments.length === 0 ? (
            <p>Завершенные приемы по этому фильтру не найдены.</p>
          ) : (
            <div className="doctor-list">
              {filteredCompletedAppointments.map((item) => {
                const appointmentDocuments = documentsByAppointment.get(String(item.id)) || [];
                const extraDocumentsCount = appointmentDocuments.filter((doc) => doc.documentType !== 'VISIT_REPORT').length;

                return (
                  <article className="doctor-list-item doctor-list-item--completed" key={item.id}>
                    <h3>{item.patientFullName || `Прием #${item.id}`}</h3>
                    <p><strong>Услуга:</strong> {item.serviceName || 'Консультация'}</p>
                    <p><strong>Дата:</strong> {item.appointmentDate}</p>
                    <p><strong>Время:</strong> {formatTime(item.appointmentTime)}</p>
                    <p><strong>Email пациента:</strong> {item.patientEmail || '—'}</p>
                    <p><strong>Статус:</strong> {formatAppointmentStatus(item.status)}</p>
                    {item.completionSummary ? <p><strong>Итог приема:</strong> {item.completionSummary}</p> : null}

                    <div className="doctor-completed-actions">
                      <button
                        className="doctor-upload-btn"
                        type="button"
                        onClick={() => openAppointmentDocuments(item)}
                        disabled={appointmentDocuments.length === 0}
                      >
                        Документы по приему
                      </button>
                      <button
                        className="doctor-upload-btn doctor-upload-btn--secondary"
                        type="button"
                        onClick={() => openUploadModal(item)}
                      >
                        {extraDocumentsCount > 0 ? `Добавить документы (${extraDocumentsCount})` : 'Добавить документы'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>

      {documentsAppointment ? (
        <div className="doctor-modal-backdrop" onClick={closeDocumentsModal}>
          <div className="doctor-modal" onClick={(event) => event.stopPropagation()}>
            <div className="doctor-modal__header">
              <div>
                <h3>Документы по приему</h3>
                <p>{documentsAppointment.patientFullName} • {documentsAppointment.appointmentDate} • {formatTime(documentsAppointment.appointmentTime)}</p>
              </div>
              <button type="button" className="doctor-modal__close" onClick={closeDocumentsModal}>
                Закрыть
              </button>
            </div>

            <div className="doctor-documents-modal-list">
              {(documentsByAppointment.get(String(documentsAppointment.id)) || []).map((doc) => (
                <article className="doctor-documents-modal-item" key={doc.id}>
                  <div>
                    <strong>{formatDocumentType(doc.documentType)}</strong>
                    <p>{doc.fileName}</p>
                  </div>
                  <a
                    className="doctor-documents-modal-link"
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Открыть
                  </a>
                </article>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {uploadAppointment ? (
        <div className="doctor-modal-backdrop" onClick={closeUploadModal}>
          <div className="doctor-modal" onClick={(event) => event.stopPropagation()}>
            <div className="doctor-modal__header">
              <div>
                <h3>Добавить документы</h3>
                <p>{uploadAppointment.patientFullName} • {uploadAppointment.appointmentDate} • {formatTime(uploadAppointment.appointmentTime)}</p>
              </div>
              <button type="button" className="doctor-modal__close" onClick={closeUploadModal}>
                Закрыть
              </button>
            </div>

            <form className="doctor-upload-form doctor-upload-form--modal" onSubmit={handleUpload}>
              <label>
                Тип документа
                <select value={uploadDocType} onChange={(event) => setUploadDocType(event.target.value)} disabled={uploading}>
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
                  onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
                  disabled={uploading}
                />
              </label>

              <div className="doctor-modal__actions">
                <button className="doctor-upload-btn doctor-upload-btn--secondary" type="button" onClick={closeUploadModal} disabled={uploading}>
                  Отмена
                </button>
                <button className="doctor-upload-btn" type="submit" disabled={uploading}>
                  {uploading ? 'Загрузка...' : 'Добавить документ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
