import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { appointmentsApi, doctorsApi, patientsApi } from '../api';
import '../styles/Cabinet.css';

const AUTH_API_BASE = import.meta.env.VITE_AUTH_URL || 'http://localhost:8081';
const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const MEDCARD_STORAGE_KEY = 'cabinet_medcard';

const STATUS_LABELS = {
  SCHEDULED: 'Запланирована',
  COMPLETED: 'Завершена',
  CANCELLED: 'Отменена',
};

function formatTime(value) {
  if (!value) {
    return '—';
  }
  return String(value).slice(0, 5);
}

function formatBirthDate(value) {
  if (!value) {
    return 'не указана';
  }

  const [year, month, day] = String(value).split('-');
  if (!year || !month || !day) {
    return value;
  }

  return `${day}-${month}-${year}`;
}

function calculateAge(value) {
  if (!value) {
    return 'не указан';
  }

  const birthDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) {
    return 'не указан';
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

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

    let meResponse;
    try {
      meResponse = await axios.get(`${AUTH_API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      setError('Сессия истекла. Выполните вход заново.');
      logout();
      return;
    }

    setProfile(meResponse.data);

    let patientData = null;
    try {
      const patientResponse = await patientsApi.getMe();
      patientData = patientResponse.data || null;
      setPatient(patientData);
    } catch {
      setPatient(null);
    }

    try {
      const [appointmentsResponse, doctorsResponse] = await Promise.all([
        appointmentsApi.getMine(),
        doctorsApi.getAll(),
      ]);

      setAppointments(appointmentsResponse.data || []);
      setDoctors(doctorsResponse.data || []);
    } catch {
      setAppointments([]);
      setDoctors([]);
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
    if (!profile?.userId) {
      return;
    }

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
        {
          email: editForm.email || null,
          password: editForm.password || null,
        },
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
        setEditError('Email/пароль сохранены, но не удалось обновить дату рождения.');
        return;
      }
    }

    await loadCabinet();
    setEditForm((prev) => ({ ...prev, password: '' }));
    setEditMessage('Данные успешно обновлены.');
  };

  const servicesItems = useMemo(
    () =>
      appointments.map((item) => {
        const doctor = doctors.find((doctorItem) => String(doctorItem.id) === String(item.doctorId));
        const serviceName = String(item.notes || '').replace(/^Услуга:\s*/i, '').trim();

        return {
          id: item.id,
          title: `Запись на ${item.appointmentDate || 'дату без уточнения'}`,
          doctorLine: doctor
            ? `${doctor.fullName}${doctor.specialty ? `, ${doctor.specialty}` : ''}`
            : 'Специалист не найден',
          serviceLine: serviceName || 'Услуга не указана',
          status: STATUS_LABELS[item.status] || item.status,
          time: formatTime(item.appointmentTime),
        };
      }),
    [appointments, doctors]
  );

  const visitsItems = useMemo(
    () =>
      appointments
        .filter((item) => item.status === 'COMPLETED')
        .map((item) => {
          const doctor = doctors.find((doctorItem) => String(doctorItem.id) === String(item.doctorId));
          return {
            id: item.id,
            title: `Прием ${item.appointmentDate || 'без даты'}`,
            subtitle: doctor
              ? `${doctor.fullName}${doctor.specialty ? `, ${doctor.specialty}` : ''}`
              : 'Посещение врача',
            time: formatTime(item.appointmentTime),
          };
        }),
    [appointments, doctors]
  );

  const analysisItems = [
    { id: 1, title: 'Общий анализ крови', result: 'Без отклонений', date: '2026-03-05' },
    { id: 2, title: 'Биохимический анализ', result: 'Требуется консультация врача', date: '2026-02-19' },
    { id: 3, title: 'Анализ мочи', result: 'Показатели в норме', date: '2026-01-28' },
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <div className="cabinet-card">
          <p>Загрузка профиля...</p>
        </div>
      );
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
          {!patient ? <p className="cabinet-hint">Карточка пациента пока не создана.</p> : null}
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
          <h2>Мои приемы</h2>
          <div className="cabinet-list">
            {visitsItems.length === 0 ? (
              <p className="cabinet-hint">Завершенных приемов пока нет.</p>
            ) : (
              visitsItems.map((item) => (
                <div className="cabinet-list-item" key={item.id}>
                  <h4>{item.title}</h4>
                  <p>{item.subtitle}</p>
                  <p><strong>Время:</strong> {item.time}</p>
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
          <div className="cabinet-list">
            {analysisItems.map((item) => (
              <div className="cabinet-list-item" key={item.id}>
                <h4>{item.title}</h4>
                <p><strong>Дата:</strong> {item.date}</p>
                <p><strong>Результат:</strong> {item.result}</p>
              </div>
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
            <label className="cabinet-medcard-field">
              <span>Рост (см)</span>
              <input
                type="number"
                min="50"
                max="300"
                name="height"
                value={medcardForm.height}
                onChange={handleMedcardChange}
              />
            </label>
            <label className="cabinet-medcard-field">
              <span>Вес (кг)</span>
              <input
                type="number"
                min="20"
                max="500"
                name="weight"
                value={medcardForm.weight}
                onChange={handleMedcardChange}
              />
            </label>
            <label className="cabinet-medcard-field">
              <span>Группа крови</span>
              <select name="bloodGroup" value={medcardForm.bloodGroup} onChange={handleMedcardChange}>
                <option value="" disabled hidden />
                <option value="I">I (O)</option>
                <option value="II">II (A)</option>
                <option value="III">III (B)</option>
                <option value="IV">IV (AB)</option>
              </select>
            </label>
            <label className="cabinet-medcard-field">
              <span>Резус-фактор</span>
              <select name="rhFactor" value={medcardForm.rhFactor} onChange={handleMedcardChange}>
                <option value="" disabled hidden />
                <option value="+">Положительная (+)</option>
                <option value="-">Отрицательная (-)</option>
              </select>
            </label>
            <label className="cabinet-medcard-field">
              <span>Пол</span>
              <select name="gender" value={medcardForm.gender} onChange={handleMedcardChange}>
                <option value="" disabled hidden />
                <option value="Мужской">Мужской</option>
                <option value="Женский">Женский</option>
              </select>
            </label>
            <label className="cabinet-medcard-field">
              <span>Возраст</span>
              <input
                type="number"
                min="0"
                max="130"
                name="age"
                value={medcardForm.age}
                onChange={handleMedcardChange}
              />
            </label>
            <div className="cabinet-medcard-actions">
              <button className="cabinet-refresh" type="submit">
                Сохранить
              </button>
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
              <input
                type="email"
                name="email"
                value={editForm.email}
                onChange={handleEditChange}
                required
              />
            </label>
            <label className="cabinet-medcard-field">
              <span>Новый пароль</span>
              <input
                type="password"
                name="password"
                value={editForm.password}
                onChange={handleEditChange}
                minLength={8}
                autoComplete="new-password"
              />
            </label>
            <label className="cabinet-medcard-field">
              <span>Дата рождения</span>
              <input
                type="date"
                name="birthDate"
                value={editForm.birthDate}
                onChange={handleEditChange}
              />
            </label>
            <label className="cabinet-medcard-field">
              <span>Адрес</span>
              <input
                type="text"
                name="address"
                value={editForm.address}
                onChange={handleEditChange}
              />
            </label>
            <div className="cabinet-medcard-actions">
              <button className="cabinet-refresh" type="submit">
                Сохранить изменения
              </button>
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
          <button className="cabinet-refresh" type="button" onClick={loadCabinet}>
            Обновить
          </button>
          <button className="cabinet-logout" type="button" onClick={logout}>
            Выйти
          </button>
        </div>
      </div>

      <div className="cabinet-layout">
        <aside className="cabinet-menu">
          <NavLink className="cabinet-menu-item" to="/cabinet/info">Общая информация</NavLink>
          <NavLink className="cabinet-menu-item" to="/cabinet/services">Мои записи и услуги</NavLink>
          <NavLink className="cabinet-menu-item" to="/cabinet/visits">Мои приемы</NavLink>
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
