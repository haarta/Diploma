import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { appointmentsApi, doctorsApi } from '../api';
import '../styles/Cabinet.css';

const AUTH_API_BASE = import.meta.env.VITE_AUTH_URL || 'http://localhost:8081';
const PATIENT_API_BASE = import.meta.env.VITE_PATIENT_API_URL || 'http://localhost:8082/api';
const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';

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

export default function Cabinet() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);

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
      const patientResponse = await axios.get(`${PATIENT_API_BASE}/patients/by-user/${meResponse.data.userId}`);
      patientData = patientResponse.data;
      setPatient(patientData);
    } catch {
      try {
        const patientsResponse = await axios.get(`${PATIENT_API_BASE}/patients`, {
          params: { page: 0, size: 200, active: true, sort: 'id,desc' },
        });
        const items = patientsResponse.data?.content || patientsResponse.data || [];
        const normalizedEmail = String(meResponse.data.email || '').trim().toLowerCase();
        patientData =
          items.find((item) => String(item.email || '').trim().toLowerCase() === normalizedEmail) || null;
        setPatient(patientData);
      } catch {
        setPatient(null);
      }
    }

    try {
      const [appointmentsResponse, doctorsResponse] = await Promise.all([
        appointmentsApi.getAll(),
        doctorsApi.getAll(),
      ]);

      const allAppointments = appointmentsResponse.data || [];
      setAppointments(patientData ? allAppointments.filter((item) => item.patientId === patientData.id) : []);
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
          <p><strong>Идентификатор пользователя:</strong> {profile?.userId || '—'}</p>
          <p><strong>Электронная почта:</strong> {profile?.email || '—'}</p>
          <p><strong>Роль:</strong> {profile?.role || '—'}</p>
          <hr />
          <p><strong>Телефон:</strong> {patient?.phone || 'не указан'}</p>
          <p><strong>Дата рождения:</strong> {patient?.birthDate || 'не указана'}</p>
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
