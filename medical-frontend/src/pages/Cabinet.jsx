import { useEffect, useMemo, useState } from 'react';
import { NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  appointmentsApi,
  authSessionApi,
  doctorsApi,
  labResultsApi,
  notificationsApi,
  patientDocumentsApi,
  patientsApi,
} from '../api';
import {
  clearAuthTokens,
  getAccessToken,
} from '../auth';
import '../styles/Cabinet.css';

const STATUS_LABELS = {
  SCHEDULED: 'Запланирована',
  CONFIRMED: 'Подтверждена',
  COMPLETED: 'Завершена',
  CANCELLED: 'Отменена',
  NO_SHOW: 'Неявка',
};

const EMPTY_MEDCARD_FORM = {
  height: '',
  weight: '',
  bloodGroup: '',
  rhFactor: '',
  gender: '',
};

const EMPTY_EDIT_FORM = {
  fullName: '',
  phone: '',
  email: '',
  password: '',
  birthDate: '',
  address: '',
};

const EMPTY_REVIEW_FORM = {
  rating: '5',
  text: '',
};

const DOCUMENT_TYPE_LABELS = {
  CERTIFICATE: 'Справка',
  CONCLUSION: 'Заключение',
  VISIT_REPORT: 'Итог приема',
  ANALYSIS: 'Анализы',
  OTHER: 'Документ',
};

function formatTime(value) {
  return value ? String(value).slice(0, 5) : '—';
}

function formatBirthDate(value) {
  if (!value) return 'не указана';
  const [year, month, day] = String(value).split('-');
  return year && month && day ? `${day}-${month}-${year}` : value;
}

function formatDateTime(value) {
  if (!value) return 'Дата не указана';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function calculateAge(value) {
  if (!value) return 'не указан';
  const birthDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) return 'не указан';
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  const dayDiff = now.getDate() - birthDate.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age -= 1;
  return age >= 0 ? age : 'не указан';
}

function normalizeNullableText(value) {
  if (value == null) {
    return null;
  }
  const trimmed = String(value).trim();
  return trimmed || null;
}

function formatDocumentType(value) {
  return DOCUMENT_TYPE_LABELS[value] || value || 'Документ';
}

export default function Cabinet() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [labResults, setLabResults] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [patientDocuments, setPatientDocuments] = useState([]);
  const [appointmentReviews, setAppointmentReviews] = useState([]);
  const [medcardForm, setMedcardForm] = useState(EMPTY_MEDCARD_FORM);
  const [medcardMessage, setMedcardMessage] = useState('');
  const [medcardError, setMedcardError] = useState('');
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
  const [editMessage, setEditMessage] = useState('');
  const [editError, setEditError] = useState('');
  const [reviewForm, setReviewForm] = useState(EMPTY_REVIEW_FORM);
  const [reviewError, setReviewError] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewAppointment, setReviewAppointment] = useState(null);
  const [documentsAppointment, setDocumentsAppointment] = useState(null);

  const logout = () => {
    clearAuthTokens();
    navigate('/?auth=register');
  };

  const loadCabinet = async () => {
    if (!getAccessToken()) {
      logout();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const meResponse = await authSessionApi.getMe();
      setProfile(meResponse.data);
    } catch {
      setError('Сессия истекла. Выполните вход заново.');
      logout();
      return;
    }

    try {
      const patientResponse = await patientsApi.getMe();
      setPatient(patientResponse.data || null);
    } catch {
      setPatient(null);
    }

    try {
      const [
        appointmentsResponse,
        reviewsResponse,
        doctorsResponse,
        labResultsResponse,
        notificationsResponse,
        documentsResponse,
      ] = await Promise.all([
        appointmentsApi.getMine(),
        appointmentsApi.getMyReviews(),
        doctorsApi.getAll(),
        labResultsApi.getMine(),
        notificationsApi.getMine(),
        patientDocumentsApi.getMine(),
      ]);

      setAppointments(appointmentsResponse.data || []);
      setAppointmentReviews(reviewsResponse.data || []);
      setDoctors(doctorsResponse.data || []);
      setLabResults(labResultsResponse.data || []);
      setNotifications(notificationsResponse.data || []);
      setPatientDocuments(documentsResponse.data || []);
    } catch {
      setAppointments([]);
      setAppointmentReviews([]);
      setDoctors([]);
      setLabResults([]);
      setNotifications([]);
      setPatientDocuments([]);
      setError('Не удалось загрузить данные личного кабинета.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCabinet();
  }, []);

  useEffect(() => {
    setEditForm({
      fullName: patient?.fullName || '',
      phone: patient?.phone || '',
      email: profile?.email || '',
      password: '',
      birthDate: patient?.birthDate || '',
      address: patient?.address || '',
    });
  }, [patient?.address, patient?.birthDate, patient?.fullName, patient?.phone, profile?.email]);

  useEffect(() => {
    setMedcardForm({
      height: patient?.heightCm != null ? String(patient.heightCm) : '',
      weight: patient?.weightKg != null ? String(patient.weightKg) : '',
      bloodGroup: patient?.bloodGroup || '',
      rhFactor: patient?.rhFactor || '',
      gender: patient?.gender || '',
    });
  }, [patient?.bloodGroup, patient?.gender, patient?.heightCm, patient?.rhFactor, patient?.weightKg]);

  const handleMedcardChange = (event) => {
    const { name, value } = event.target;
    setMedcardForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleMedcardSave = async (event) => {
    event.preventDefault();
    setMedcardError('');
    setMedcardMessage('');

    if (!patient) {
      setMedcardError('Сначала создайте профиль пациента в разделе Редактировать данные.');
      return;
    }

    try {
      await patientsApi.updateMe({
        gender: medcardForm.gender || null,
        bloodGroup: medcardForm.bloodGroup || null,
        rhFactor: medcardForm.rhFactor || null,
        heightCm: medcardForm.height ? Number(medcardForm.height) : null,
        weightKg: medcardForm.weight ? Number(medcardForm.weight) : null,
      });
      await loadCabinet();
      setMedcardMessage('Данные медкарты сохранены.');
    } catch {
      setMedcardError('Не удалось сохранить данные медкарты.');
    }
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSave = async (event) => {
    event.preventDefault();
    setEditError('');
    setEditMessage('');

    if (!getAccessToken()) {
      setEditError('Сессия истекла. Выполните вход заново.');
      return;
    }

    try {
      const authResponse = await authSessionApi.updateMe({
        email: normalizeNullableText(editForm.email),
        password: normalizeNullableText(editForm.password),
      });
      setProfile(authResponse.data || null);
    } catch {
      setEditError('Не удалось сохранить email или пароль.');
      return;
    }

    try {
      const patientPayload = {
        fullName: normalizeNullableText(editForm.fullName),
        birthDate: editForm.birthDate || null,
        phone: normalizeNullableText(editForm.phone),
        email: normalizeNullableText(editForm.email),
        address: normalizeNullableText(editForm.address),
      };

      let currentPatient = patient;

      if (!currentPatient) {
        try {
          const existingPatientResponse = await patientsApi.getMe();
          currentPatient = existingPatientResponse.data || null;
          setPatient(currentPatient);
        } catch {
          currentPatient = null;
        }
      }

      if (currentPatient) {
        await patientsApi.updateMe(patientPayload);
      } else {
        if (!patientPayload.fullName || !patientPayload.phone) {
          setEditError('Для создания профиля пациента укажите ФИО и телефон.');
          return;
        }

        const createPayload = {
          ...patientPayload,
          gender: null,
          allergies: null,
          chronicConditions: null,
          bloodGroup: null,
          rhFactor: null,
          emergencyContactName: null,
          emergencyContactPhone: null,
          heightCm: null,
          weightKg: null,
        };

        try {
          await patientsApi.createMe(createPayload);
        } catch (createError) {
          try {
            const existingPatientResponse = await patientsApi.getMe();
            currentPatient = existingPatientResponse.data || null;
          } catch {
            currentPatient = null;
          }

          if (!currentPatient) {
            throw createError;
          }

          await patientsApi.updateMe(patientPayload);
        }
      }

      await loadCabinet();
      setEditForm((prev) => ({ ...prev, password: '' }));
      setEditMessage('Данные успешно обновлены.');
    } catch {
      setEditError('Email и пароль сохранены, но не удалось обновить персональные данные.');
    }
  };

  const cancelAppointment = async (appointmentId) => {
    try {
      await appointmentsApi.cancelMine(appointmentId);
      await loadCabinet();
      setError('');
      window.alert('Запись отменена.');
    } catch (requestError) {
      const message =
        requestError?.response?.data?.error ||
        requestError?.response?.data?.message ||
        requestError?.message ||
        'Не удалось отменить запись.';
      setError(message);
      window.alert(message);
    }
  };

  const openNotification = async (item) => {
    try {
      if (!item.read) {
        await notificationsApi.markAsRead(item.id);
      }
    } catch {
      // ignore
    }
    await loadCabinet();
    if (item.linkPath) {
      navigate(item.linkPath);
    }
  };

  const openVisitReport = async (item) => {
    if (!item?.reportDocument?.fileUrl) {
      return;
    }

    window.open(item.reportDocument.fileUrl, '_blank', 'noopener,noreferrer');
  };

  const openDocumentsModal = (event, item) => {
    event.stopPropagation();
    setDocumentsAppointment(item);
  };

  const closeDocumentsModal = () => {
    setDocumentsAppointment(null);
  };

  const openReviewModal = (event, item) => {
    event.stopPropagation();
    setReviewAppointment(item);
    setReviewForm(EMPTY_REVIEW_FORM);
    setReviewError('');
    setReviewMessage('');
  };

  const closeReviewModal = () => {
    if (reviewSaving) {
      return;
    }
    setReviewAppointment(null);
    setReviewForm(EMPTY_REVIEW_FORM);
    setReviewError('');
    setReviewMessage('');
  };

  const handleReviewChange = (event) => {
    const { name, value } = event.target;
    setReviewForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitReview = async (event) => {
    event.preventDefault();
    if (!reviewAppointment) {
      return;
    }

    setReviewSaving(true);
    setReviewError('');
    setReviewMessage('');

    try {
      await appointmentsApi.createReviewMine(reviewAppointment.id, {
        rating: Number(reviewForm.rating),
        text: reviewForm.text.trim(),
      });
      setReviewMessage('Отзыв сохранен и опубликован.');
      await loadCabinet();
      setReviewAppointment(null);
      setReviewForm(EMPTY_REVIEW_FORM);
    } catch (requestError) {
      const message =
        requestError?.response?.data?.error ||
        requestError?.response?.data?.message ||
        'Не удалось сохранить отзыв.';
      setReviewError(message);
    } finally {
      setReviewSaving(false);
    }
  };

  const downloadVisitReport = async (event, item) => {
    event.stopPropagation();

    if (!item?.reportDocument?.fileUrl) {
      return;
    }

    const fileName = item.reportDocument.fileName || `visit-report-${item.id}.pdf`;

    try {
      const response = await fetch(item.reportDocument.fileUrl);
      if (!response.ok) {
        throw new Error('Failed to download visit report');
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      const link = document.createElement('a');
      link.href = item.reportDocument.fileUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  };

  const activeAppointments = useMemo(
    () =>
      appointments
        .filter((item) => item.status === 'SCHEDULED' || item.status === 'CONFIRMED')
        .filter((item) => {
          if (!item.appointmentDate || !item.appointmentTime) return false;
          const appointmentDateTime = new Date(`${item.appointmentDate}T${item.appointmentTime}`);
          return !Number.isNaN(appointmentDateTime.getTime()) && appointmentDateTime >= new Date();
        })
        .sort((a, b) => {
          const left = `${a.appointmentDate || ''}T${a.appointmentTime || '00:00'}`;
          const right = `${b.appointmentDate || ''}T${b.appointmentTime || '00:00'}`;
          return left.localeCompare(right);
        }),
    [appointments]
  );

  const servicesItems = useMemo(
    () =>
      activeAppointments.map((item) => {
        const doctor = doctors.find((doctorItem) => String(doctorItem.id) === String(item.doctorId));
        return {
          id: item.id,
          title: `Запись на ${item.appointmentDate || 'дату без уточнения'}`,
          doctorLine: doctor ? `${doctor.fullName}${doctor.specialty ? `, ${doctor.specialty}` : ''}` : 'Специалист не найден',
          serviceLine: item.serviceName || 'Услуга не указана',
          status: STATUS_LABELS[item.status] || item.status,
          time: formatTime(item.appointmentTime),
        };
      }),
    [activeAppointments, doctors]
  );

  const visitsItems = useMemo(
    () =>
      appointments
        .filter((item) => item.status === 'COMPLETED' || item.status === 'NO_SHOW')
        .map((item) => {
          const doctor = doctors.find((doctorItem) => String(doctorItem.id) === String(item.doctorId));
          const documents = patientDocuments.filter((doc) => String(doc.appointmentId) === String(item.id));
          const reportDocument = documents.find((doc) => doc.documentType === 'VISIT_REPORT') || null;
          const review = appointmentReviews.find((reviewItem) => String(reviewItem.appointmentId) === String(item.id)) || null;
          return {
            id: item.id,
            title: `Приём ${item.appointmentDate || 'без даты'}`,
            subtitle: doctor ? `${doctor.fullName}${doctor.specialty ? `, ${doctor.specialty}` : ''}` : 'Посещение врача',
            time: formatTime(item.appointmentTime),
            status: STATUS_LABELS[item.status] || item.status,
            statusCode: item.status,
            completionSummary: item.completionSummary || '',
            documents,
            doctor,
            appointment: item,
            reportDocument,
            review,
            canOpenReport: item.status === 'COMPLETED' && Boolean(reportDocument),
            canLeaveReview: item.status === 'COMPLETED' && Boolean(doctor) && !review,
          };
        }),
    [appointments, appointmentReviews, doctors, patientDocuments]
  );

  const labResultCards = useMemo(
    () =>
      labResults.map((item) => {
        const readyDate = new Date(item.readyAt);
        const isReady = !Number.isNaN(readyDate.getTime()) && readyDate <= new Date();
        return {
          ...item,
          statusLabel: isReady ? 'Готов' : 'В обработке',
          isReady,
          displayDate: formatDateTime(isReady ? item.readyAt : item.orderedAt),
        };
      }),
    [labResults]
  );

  const unreadNotifications = notifications.filter((item) => !item.read);
  const medcardAge = calculateAge(patient?.birthDate);

  const renderContent = () => {
    if (loading) {
      return <div className="cabinet-card"><p>Загрузка профиля...</p></div>;
    }

    if (location.pathname === '/cabinet/info') {
      return (
        <div className="cabinet-card">
          <h2>Общая информация</h2>
          <h3>{patient?.fullName || 'Профиль'}</h3>
          <p><strong>Электронная почта:</strong> {profile?.email || '—'}</p>
          <hr />
          <p><strong>Телефон:</strong> {patient?.phone || 'не указан'}</p>
          <p><strong>Дата рождения:</strong> {formatBirthDate(patient?.birthDate)}</p>
          <p><strong>Возраст:</strong> {calculateAge(patient?.birthDate)}</p>
          <p><strong>Рост:</strong> {patient?.heightCm ? `${patient.heightCm} см` : 'не указан'}</p>
          <p><strong>Вес:</strong> {patient?.weightKg ? `${patient.weightKg} кг` : 'не указан'}</p>
          <p><strong>Адрес:</strong> {patient?.address || 'не указан'}</p>
        </div>
      );
    }

    if (location.pathname === '/cabinet/notifications') {
      return (
        <div className="cabinet-card">
          <h2>Уведомления</h2>
          <div className="cabinet-list">
            {notifications.length === 0 ? (
              <p className="cabinet-hint">Уведомлений пока нет.</p>
            ) : (
              notifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`cabinet-notification-item${item.read ? '' : ' cabinet-notification-item--unread'}`}
                  onClick={() => openNotification(item)}
                >
                  <strong>{item.title}</strong>
                  <span>{item.message}</span>
                  <small>{formatDateTime(item.createdAt)}</small>
                </button>
              ))
            )}
          </div>
        </div>
      );
    }

    if (location.pathname === '/cabinet/services') {
      return (
        <div className="cabinet-card">
          <h2>Мои записи и услуги</h2>
          <div className="cabinet-list">
            {servicesItems.length === 0 ? (
              <p className="cabinet-hint">У вас пока нет активных записей.</p>
            ) : (
              servicesItems.map((item) => (
                <div className="cabinet-list-item" key={item.id}>
                  <h4>{item.title}</h4>
                  <p><strong>Врач:</strong> {item.doctorLine}</p>
                  <p><strong>Услуга:</strong> {item.serviceLine}</p>
                  <p><strong>Время:</strong> {item.time}</p>
                  <p><strong>Статус:</strong> {item.status}</p>
                  <button
                    className="cabinet-inline-action"
                    type="button"
                    onClick={() => {
                      if (window.confirm('Отменить эту запись?')) {
                        cancelAppointment(item.id);
                      }
                    }}
                  >
                    Отменить запись
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    if (location.pathname === '/cabinet/visits') {
      return (
        <div className="cabinet-card">
          <h2>Мои приёмы</h2>
          <div className="cabinet-list">
            {visitsItems.length === 0 ? (
              <p className="cabinet-hint">Завершённых приёмов пока нет.</p>
            ) : (
              visitsItems.map((item) => (
                <div
                  className={`cabinet-list-item${item.canOpenReport ? ' cabinet-list-item--interactive' : ''}`}
                  key={item.id}
                  onClick={() => openVisitReport(item)}
                  onKeyDown={(event) => {
                    if (item.canOpenReport && (event.key === 'Enter' || event.key === ' ')) {
                      event.preventDefault();
                      openVisitReport(item);
                    }
                  }}
                  role={item.canOpenReport ? 'button' : undefined}
                  tabIndex={item.canOpenReport ? 0 : undefined}
                >
                  <h4>{item.title}</h4>
                  <p>{item.subtitle}</p>
                  <p><strong>Время:</strong> {item.time}</p>
                  <p><strong>Статус:</strong> {item.status}</p>
                  {item.completionSummary ? <p><strong>Заключение:</strong> {item.completionSummary}</p> : null}
                  {item.canOpenReport ? (
                    <div className="cabinet-visit-actions">
                      <button
                        className="cabinet-inline-action"
                        type="button"
                        onClick={(event) => openDocumentsModal(event, item)}
                      >
                        Документы приема
                      </button>
                      {item.reportDocument ? (
                        <button
                          className="cabinet-inline-action cabinet-inline-action--secondary"
                          type="button"
                          onClick={(event) => downloadVisitReport(event, item)}
                        >
                          Скачать PDF заключения
                        </button>
                      ) : null}
                      {item.canLeaveReview ? (
                        <button
                          className="cabinet-inline-action cabinet-inline-action--lavender"
                          type="button"
                          onClick={(event) => openReviewModal(event, item)}
                        >
                          Оставить отзыв о враче
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                  {item.review ? (
                    <div className="cabinet-review-summary">
                      <strong>Ваш отзыв:</strong>
                      <span>{`★ ${item.review.rating} • ${item.review.text}`}</span>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    if (location.pathname === '/cabinet/labs') {
      return (
        <div className="cabinet-card">
          <h2>Результаты анализов</h2>
          <p className="cabinet-hint">Готовые результаты открываются в формате PDF по нажатию на карточку.</p>
          <div className="cabinet-labs-list">
            {labResultCards.map((item) => (
              <button
                type="button"
                className={`cabinet-lab-card${item.isReady ? '' : ' cabinet-lab-card--pending'}`}
                key={item.id}
                onClick={() => {
                  if (item.isReady) {
                    window.open(item.pdfUrl, '_blank', 'noopener,noreferrer');
                  } else {
                    window.alert('Результат ещё не готов. Он появится после завершения обработки.');
                  }
                }}
              >
                <span className="cabinet-lab-card__date">{item.displayDate}</span>
                <span className="cabinet-lab-card__title">{item.title} ({item.statusLabel})</span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (location.pathname === '/cabinet/medcard') {
      return (
        <div className="cabinet-card">
          <h2>Медкарта</h2>
          <p className="cabinet-hint">Данные медкарты теперь хранятся на сервере и доступны во всех сессиях. </p>
          <form className="cabinet-medcard-form" onSubmit={handleMedcardSave}>
            <label className="cabinet-medcard-field">
              <span>Рост (см)</span>
              <input type="number" name="height" value={medcardForm.height} onChange={handleMedcardChange} />
            </label>
            <label className="cabinet-medcard-field">
              <span>Вес (кг)</span>
              <input type="number" step="0.1" name="weight" value={medcardForm.weight} onChange={handleMedcardChange} />
            </label>
            <label className="cabinet-medcard-field">
              <span>Возраст</span>
              <input type="text" value={medcardAge} readOnly />
            </label>
            <label className="cabinet-medcard-field">
              <span>Группа крови</span>
              <select name="bloodGroup" value={medcardForm.bloodGroup} onChange={handleMedcardChange}>
                <option value="">Не выбрано</option>
                <option value="I">I (O)</option>
                <option value="II">II (A)</option>
                <option value="III">III (B)</option>
                <option value="IV">IV (AB)</option>
              </select>
            </label>
            <label className="cabinet-medcard-field">
              <span>Резус-фактор</span>
              <select name="rhFactor" value={medcardForm.rhFactor} onChange={handleMedcardChange}>
                <option value="">Не выбрано</option>
                <option value="+">Положительный (+)</option>
                <option value="-">Отрицательный (-)</option>
              </select>
            </label>
            <label className="cabinet-medcard-field">
              <span>Пол</span>
              <select name="gender" value={medcardForm.gender} onChange={handleMedcardChange}>
                <option value="">Не выбрано</option>
                <option value="Мужской">Мужской</option>
                <option value="Женский">Женский</option>
              </select>
            </label>
            <div className="cabinet-medcard-actions">
              <button className="cabinet-refresh" type="submit">Сохранить</button>
            </div>
          </form>
          {medcardError ? <p className="cabinet-error">{medcardError}</p> : null}
          {medcardMessage ? <p className="cabinet-success">{medcardMessage}</p> : null}
        </div>
      );
    }

    if (location.pathname === '/cabinet/edit') {
      return (
        <div className="cabinet-card">
          <h2>Редактировать данные</h2>
          <form className="cabinet-medcard-form" onSubmit={handleEditSave}>
            <label className="cabinet-medcard-field">
              <span>ФИО</span>
              <input type="text" name="fullName" value={editForm.fullName} onChange={handleEditChange} />
            </label>
            <label className="cabinet-medcard-field">
              <span>Телефон</span>
              <input type="tel" name="phone" value={editForm.phone} onChange={handleEditChange} />
            </label>
            <label className="cabinet-medcard-field">
              <span>Электронная почта</span>
              <input type="email" name="email" value={editForm.email} onChange={handleEditChange} required />
            </label>
            <label className="cabinet-medcard-field">
              <span>Новый пароль</span>
              <input type="password" name="password" value={editForm.password} onChange={handleEditChange} minLength={8} />
            </label>
            <label className="cabinet-medcard-field">
              <span>Дата рождения</span>
              <input type="date" name="birthDate" value={editForm.birthDate} onChange={handleEditChange} />
            </label>
            <label className="cabinet-medcard-field">
              <span>Адрес</span>
              <input type="text" name="address" value={editForm.address} onChange={handleEditChange} />
            </label>
            <div className="cabinet-medcard-actions">
              <button className="cabinet-refresh" type="submit">Сохранить изменения</button>
            </div>
          </form>
          {editError ? <p className="cabinet-error">{editError}</p> : null}
          {editMessage ? <p className="cabinet-success">{editMessage}</p> : null}
        </div>
      );
    }

    return <Navigate to="/cabinet/info" replace />;
  };

  const pageMarkup = (
    <section className="cabinet-page">
      <div className="cabinet-top">
        <div>
          <h1>Личный кабинет</h1>
          {error ? <p className="cabinet-error">{error}</p> : null}
        </div>
        <div className="cabinet-actions">
          <button className="cabinet-refresh" type="button" onClick={loadCabinet}>Обновить</button>
          <button className="cabinet-logout" type="button" onClick={logout}>Выйти</button>
        </div>
      </div>

      <div className="cabinet-layout">
        <aside className="cabinet-menu">
          <NavLink className="cabinet-menu-item" to="/cabinet/info">Общая информация</NavLink>
          <NavLink className="cabinet-menu-item" to="/cabinet/notifications">
            Уведомления{unreadNotifications.length ? ` (${unreadNotifications.length})` : ''}
          </NavLink>
          <NavLink className="cabinet-menu-item" to="/cabinet/services">Мои записи и услуги</NavLink>
          <NavLink className="cabinet-menu-item" to="/cabinet/visits">Мои приёмы</NavLink>
          <NavLink className="cabinet-menu-item" to="/cabinet/labs">Результаты анализов</NavLink>
          <NavLink className="cabinet-menu-item" to="/cabinet/medcard">Медкарта</NavLink>
          <NavLink className="cabinet-menu-item" to="/cabinet/edit">Редактировать данные</NavLink>
          <NavLink className="cabinet-menu-item" to="/cabinet/doctor-verification">Заявка на роль врача</NavLink>
        </aside>

        {renderContent()}

        <aside className="cabinet-card">
          <h2>Предстоящие услуги</h2>
          <div className="cabinet-mini-list">
            {servicesItems.length === 0 ? (
              <p className="cabinet-hint">Пока нет ближайших услуг.</p>
            ) : (
              servicesItems.slice(0, 4).map((item) => (
                <div className="cabinet-mini-item" key={item.id}>
                  {item.title} в {item.time}
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </section>
  );

  return (
    <>
      {pageMarkup}
      {documentsAppointment ? (
        <div className="cabinet-modal-backdrop" onClick={closeDocumentsModal}>
          <div className="cabinet-modal" onClick={(event) => event.stopPropagation()}>
            <div className="cabinet-modal__header">
              <div>
                <h3>Документы приема</h3>
                <p>{documentsAppointment.subtitle}</p>
              </div>
              <button type="button" className="cabinet-modal__close" onClick={closeDocumentsModal}>
                Закрыть
              </button>
            </div>

            <div className="cabinet-documents-modal-list">
              {documentsAppointment.documents.map((doc) => (
                <article className="cabinet-documents-modal-item" key={doc.id}>
                  <div>
                    <strong>{formatDocumentType(doc.documentType)}</strong>
                    <p>{doc.fileName}</p>
                  </div>
                  <a
                    className="cabinet-documents-modal-link"
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
      {reviewAppointment ? (
        <div className="cabinet-modal-backdrop" onClick={closeReviewModal}>
          <div className="cabinet-modal" onClick={(event) => event.stopPropagation()}>
            <div className="cabinet-modal__header">
              <div>
                <h3>Отзыв о враче</h3>
                <p>{reviewAppointment.subtitle}</p>
              </div>
              <button type="button" className="cabinet-modal__close" onClick={closeReviewModal}>
                Закрыть
              </button>
            </div>

            <form className="cabinet-review-form" onSubmit={submitReview}>
              <label className="cabinet-medcard-field">
                <span>Оценка</span>
                <select name="rating" value={reviewForm.rating} onChange={handleReviewChange} disabled={reviewSaving}>
                  <option value="5">5</option>
                  <option value="4">4</option>
                  <option value="3">3</option>
                  <option value="2">2</option>
                  <option value="1">1</option>
                </select>
              </label>

              <label className="cabinet-medcard-field cabinet-review-form__full">
                <span>Текст отзыва</span>
                <textarea
                  className="cabinet-medcard-textarea"
                  name="text"
                  rows="6"
                  value={reviewForm.text}
                  onChange={handleReviewChange}
                  placeholder="Опишите, как прошел прием и чем врач помог."
                  disabled={reviewSaving}
                  required
                />
              </label>

              {reviewError ? <p className="cabinet-error cabinet-review-form__full">{reviewError}</p> : null}
              {reviewMessage ? <p className="cabinet-success cabinet-review-form__full">{reviewMessage}</p> : null}

              <div className="cabinet-visit-actions cabinet-review-form__full">
                <button className="cabinet-inline-action cabinet-inline-action--lavender" type="submit" disabled={reviewSaving}>
                  {reviewSaving ? 'Сохранение...' : 'Опубликовать отзыв'}
                </button>
                <button
                  className="cabinet-inline-action cabinet-inline-action--secondary"
                  type="button"
                  onClick={closeReviewModal}
                  disabled={reviewSaving}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
