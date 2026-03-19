import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  appointmentsApi,
  doctorsApi,
  labResultsApi,
  notificationsApi,
  patientDocumentsApi,
  patientsApi,
} from '../api';
import '../styles/Cabinet.css';

const AUTH_API_BASE = import.meta.env.VITE_AUTH_URL || 'http://localhost:8081';
const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const MEDCARD_STORAGE_KEY = 'cabinet_medcard';

const STATUS_LABELS = {
  SCHEDULED: 'Запланирована',
  CONFIRMED: 'Подтверждена',
  COMPLETED: 'Завершена',
  CANCELLED: 'Отменена',
  NO_SHOW: 'Неявка',
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
  const [medcardForm, setMedcardForm] = useState({
    height: '',
    weight: '',
    bloodGroup: '',
    rhFactor: '',
    gender: '',
    age: '',
  });
  const [medcardMessage, setMedcardMessage] = useState('');
  const [medcardError, setMedcardError] = useState('');
  const [editForm, setEditForm] = useState({
    email: '',
    password: '',
    birthDate: '',
    address: '',
  });
  const [editMessage, setEditMessage] = useState('');
  const [editError, setEditError] = useState('');

  const logout = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    navigate('/?auth=register');
  };

  const loadCabinet = async () => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      logout();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const meResponse = await axios.get(`${AUTH_API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
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
        doctorsResponse,
        labResultsResponse,
        notificationsResponse,
        documentsResponse,
      ] = await Promise.all([
        appointmentsApi.getMine(),
        doctorsApi.getAll(),
        labResultsApi.getMine(),
        notificationsApi.getMine(),
        patientDocumentsApi.getMine(),
      ]);

      setAppointments(appointmentsResponse.data || []);
      setDoctors(doctorsResponse.data || []);
      setLabResults(labResultsResponse.data || []);
      setNotifications(notificationsResponse.data || []);
      setPatientDocuments(documentsResponse.data || []);
    } catch {
      setAppointments([]);
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
      email: profile?.email || '',
      password: '',
      birthDate: patient?.birthDate || '',
      address: patient?.address || '',
    });
  }, [profile?.email, patient?.birthDate, patient?.address]);

  useEffect(() => {
    if (!profile?.userId) return;

    let storedByUser = {};
    try {
      storedByUser = JSON.parse(localStorage.getItem(MEDCARD_STORAGE_KEY) || '{}');
    } catch {
      storedByUser = {};
    }

    const stored = storedByUser[String(profile.userId)] || {};
    setMedcardForm({
      height: stored.height || '',
      weight: stored.weight || '',
      bloodGroup: stored.bloodGroup || patient?.bloodGroup || '',
      rhFactor: stored.rhFactor || patient?.rhFactor || '',
      gender: stored.gender || patient?.gender || '',
      age: stored.age || '',
    });
  }, [profile?.userId, patient?.bloodGroup, patient?.rhFactor, patient?.gender]);

  const handleMedcardChange = (event) => {
    const { name, value } = event.target;
    setMedcardForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleMedcardSave = async (event) => {
    event.preventDefault();
    setMedcardError('');
    setMedcardMessage('');

    let storedByUser = {};
    try {
      storedByUser = JSON.parse(localStorage.getItem(MEDCARD_STORAGE_KEY) || '{}');
    } catch {
      storedByUser = {};
    }

    if (profile?.userId) {
      storedByUser[String(profile.userId)] = medcardForm;
      localStorage.setItem(MEDCARD_STORAGE_KEY, JSON.stringify(storedByUser));
    }

    if (patient) {
      try {
        await patientsApi.updateMe({
          gender: medcardForm.gender || null,
          bloodGroup: medcardForm.bloodGroup || null,
          rhFactor: medcardForm.rhFactor || null,
        });
      } catch {
        setMedcardError('Медкарта сохранена локально, но не удалось синхронизировать часть данных с сервером.');
        return;
      }
    }

    setMedcardMessage('Данные медкарты сохранены.');
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSave = async (event) => {
    event.preventDefault();
    setEditError('');
    setEditMessage('');

    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      setEditError('Сессия истекла. Выполните вход заново.');
      return;
    }

    try {
      await axios.patch(
        `${AUTH_API_BASE}/api/auth/me`,
        { email: editForm.email || null, password: editForm.password || null },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (refreshToken) {
        const refreshResponse = await axios.post(`${AUTH_API_BASE}/api/auth/refresh`, { refreshToken });
        const { accessToken: nextAccessToken, refreshToken: nextRefreshToken } = refreshResponse.data || {};
        if (nextAccessToken && nextRefreshToken) {
          localStorage.setItem(ACCESS_TOKEN_KEY, nextAccessToken);
          localStorage.setItem(REFRESH_TOKEN_KEY, nextRefreshToken);
        }
      }
    } catch {
      setEditError('Не удалось сохранить email или пароль.');
      return;
    }

    if (patient) {
      try {
        await patientsApi.updateMe({
          birthDate: editForm.birthDate || null,
          email: editForm.email || null,
          address: editForm.address || null,
        });
      } catch {
        setEditError('Email и пароль сохранены, но не удалось обновить персональные данные.');
        return;
      }
    }

    await loadCabinet();
    setEditForm((prev) => ({ ...prev, password: '' }));
    setEditMessage('Данные успешно обновлены.');
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
          return {
            id: item.id,
            title: `Приём ${item.appointmentDate || 'без даты'}`,
            subtitle: doctor ? `${doctor.fullName}${doctor.specialty ? `, ${doctor.specialty}` : ''}` : 'Посещение врача',
            time: formatTime(item.appointmentTime),
            status: STATUS_LABELS[item.status] || item.status,
            completionSummary: item.completionSummary || '',
            documents,
          };
        }),
    [appointments, doctors, patientDocuments]
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
                      if (window.confirm('Отменить эту запись?')) cancelAppointment(item.id);
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
                <div className="cabinet-list-item" key={item.id}>
                  <h4>{item.title}</h4>
                  <p>{item.subtitle}</p>
                  <p><strong>Время:</strong> {item.time}</p>
                  <p><strong>Статус:</strong> {item.status}</p>
                  {item.completionSummary ? <p><strong>Заключение:</strong> {item.completionSummary}</p> : null}
                  {item.documents.length > 0 ? (
                    <div className="cabinet-doc-links">
                      {item.documents.map((doc) => (
                        <a key={doc.id} href={doc.fileUrl} target="_blank" rel="noreferrer">
                          {doc.fileName}
                        </a>
                      ))}
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
          <p className="cabinet-hint">Заполните подробную информацию о себе.</p>
          <form className="cabinet-medcard-form" onSubmit={handleMedcardSave}>
            {[
              ['height', 'Рост (см)', 'number'],
              ['weight', 'Вес (кг)', 'number'],
              ['age', 'Возраст', 'number'],
            ].map(([name, label, type]) => (
              <label className="cabinet-medcard-field" key={name}>
                <span>{label}</span>
                <input type={type} name={name} value={medcardForm[name]} onChange={handleMedcardChange} />
              </label>
            ))}
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

  return (
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
}
