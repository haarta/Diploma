import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { appointmentsApi } from '../api';
import '../styles/Cabinet.css';

const AUTH_API_BASE = import.meta.env.VITE_AUTH_URL || 'http://localhost:8081';
const PATIENT_API_BASE = import.meta.env.VITE_PATIENT_API_URL || 'http://localhost:8082/api';
const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';

export default function Cabinet() {
  const [profile, setProfile] = useState(null);
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    navigate('/?auth=register', { replace: true });
  };

  const loadCabinet = async () => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) {
      navigate('/', { replace: true });
      return;
    }

    setLoading(true);
    setError('');

    try {
      const meResp = await axios.get(`${AUTH_API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(meResp.data);

      let patientData = null;
      try {
        const patientResp = await axios.get(`${PATIENT_API_BASE}/patients/by-user/${meResp.data.userId}`);
        patientData = patientResp.data;
        setPatient(patientData);
      } catch {
        setPatient(null);
      }

      try {
        const appointmentsResp = await appointmentsApi.getAll();
        const all = appointmentsResp.data || [];
        if (patientData?.id) {
          setAppointments(all.filter((a) => String(a.patientId) === String(patientData.id)));
        } else {
          setAppointments([]);
        }
      } catch {
        setAppointments([]);
      }
    } catch {
      setError('Session expired. Please sign in again.');
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCabinet();
  }, []);

  const analysisItems = useMemo(() => {
    return [
      { id: 1, name: 'Общий анализ крови', date: '2026-03-01', status: 'Готов' },
      { id: 2, name: 'Биохимия крови', date: '2026-02-25', status: 'В обработке' },
      { id: 3, name: 'ТТГ', date: '2026-02-10', status: 'Готов' },
    ];
  }, []);

  const servicesItems = useMemo(() => {
    return appointments.map((a) => ({
      id: a.id,
      title: 'Запись на прием',
      date: a.appointmentDate,
      time: a.appointmentTime,
      status: a.status,
      notes: a.notes || '-',
    }));
  }, [appointments]);

  const visitsItems = useMemo(() => {
    return appointments
      .filter((a) => a.status === 'COMPLETED')
      .map((a) => ({
        id: a.id,
        date: a.appointmentDate,
        time: a.appointmentTime,
        notes: a.notes || '-',
      }));
  }, [appointments]);

  const renderContent = () => {
    if (location.pathname.endsWith('/info')) {
      return (
        <section className="cabinet-card">
          <h2>{patient?.fullName || profile?.email || 'Профиль'}</h2>
          <p>Роль: {profile?.role || '-'}</p>
          <p>User ID: {profile?.userId || '-'}</p>
          <hr />
          <p>Телефон: {patient?.phone || '-'}</p>
          <p>Email: {patient?.email || profile?.email || '-'}</p>
          <p>Дата рождения: {patient?.birthDate || '-'}</p>
          <p>Адрес: {patient?.address || '-'}</p>
          {!patient && <p className="cabinet-hint">Карточка пациента пока не создана.</p>}
        </section>
      );
    }

    if (location.pathname.endsWith('/services')) {
      return (
        <section className="cabinet-card">
          <h2>Мои записи и услуги</h2>
          {servicesItems.length === 0 ? (
            <p>Пока нет записей и услуг.</p>
          ) : (
            <div className="cabinet-list">
              {servicesItems.map((item) => (
                <div className="cabinet-list-item" key={item.id}>
                  <h4>{item.title}</h4>
                  <p>Дата: {item.date || '-'}</p>
                  <p>Время: {item.time || '-'}</p>
                  <p>Статус: {item.status || '-'}</p>
                  <p>Комментарий: {item.notes}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      );
    }

    if (location.pathname.endsWith('/visits')) {
      return (
        <section className="cabinet-card">
          <h2>Мои приемы</h2>
          {visitsItems.length === 0 ? (
            <p>Завершенных приемов пока нет.</p>
          ) : (
            <div className="cabinet-list">
              {visitsItems.map((item) => (
                <div className="cabinet-list-item" key={item.id}>
                  <h4>Посещение врача</h4>
                  <p>Дата: {item.date || '-'}</p>
                  <p>Время: {item.time || '-'}</p>
                  <p>Комментарий: {item.notes}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      );
    }

    if (location.pathname.endsWith('/labs')) {
      return (
        <section className="cabinet-card">
          <h2>Результаты анализов</h2>
          {analysisItems.length === 0 ? (
            <p>Результатов анализов пока нет.</p>
          ) : (
            <div className="cabinet-list">
              {analysisItems.map((item) => (
                <div className="cabinet-list-item" key={item.id}>
                  <h4>{item.name}</h4>
                  <p>Дата: {item.date}</p>
                  <p>Статус: {item.status}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      );
    }

    return <Navigate to="/cabinet/info" replace />;
  };

  if (loading) {
    return (
      <div className="cabinet-page">
        <div className="cabinet-card">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="cabinet-page">
      <div className="cabinet-top">
        <h1>Личный кабинет</h1>
        <div className="cabinet-actions">
          <button className="cabinet-refresh" onClick={loadCabinet}>Обновить</button>
          <button className="cabinet-logout" onClick={logout}>Выйти</button>
        </div>
      </div>

      {error && <div className="cabinet-error">{error}</div>}

      <div className="cabinet-layout">
        <aside className="cabinet-menu">
          <NavLink to="/cabinet/info" className={({ isActive }) => `cabinet-menu-item ${isActive ? 'active' : ''}`}>
            Общая информация
          </NavLink>
          <NavLink to="/cabinet/services" className={({ isActive }) => `cabinet-menu-item ${isActive ? 'active' : ''}`}>
            Мои записи и услуги
          </NavLink>
          <NavLink to="/cabinet/visits" className={({ isActive }) => `cabinet-menu-item ${isActive ? 'active' : ''}`}>
            Мои приемы
          </NavLink>
          <NavLink to="/cabinet/labs" className={({ isActive }) => `cabinet-menu-item ${isActive ? 'active' : ''}`}>
            Результаты анализов
          </NavLink>
        </aside>

        {renderContent()}

        <section className="cabinet-card side">
          <h3>Предстоящие услуги</h3>
          {servicesItems.length === 0 ? (
            <p>Нет активных записей.</p>
          ) : (
            <div className="cabinet-mini-list">
              {servicesItems.slice(0, 3).map((item) => (
                <div key={item.id} className="cabinet-mini-item">
                  <strong>{item.date || '-'}</strong> {item.time || '-'}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
