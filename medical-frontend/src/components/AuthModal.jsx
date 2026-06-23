import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  saveAuthTokens,
} from '../auth';
import { authSessionApi } from '../api';
import '../styles/AuthModal.css';

function extractErrorMessage(error) {
  const apiMessage = error.response?.data?.message || error.response?.data?.error;
  if (apiMessage) {
    return apiMessage;
  }

  if (error.response?.status) {
    return `Ошибка запроса (${error.response.status})`;
  }

  return 'Ошибка сети';
}

export default function AuthModal() {
  const navigate = useNavigate();
  const location = useLocation();
  const modalContentRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const hasSession = Boolean(getAccessToken());

  const clearSession = () => {
    clearAuthTokens();
    setUser(null);
  };

  const goToCabinet = (role = user?.role) => {
    setIsOpen(false);
    if (role === 'DOCTOR') {
      navigate('/doctor/cabinet');
      return;
    }
    navigate('/cabinet/info');
  };

  const fetchMe = async (token) => {
    if (!token) {
      return null;
    }
    const response = await authSessionApi.getMe();
    return response.data;
  };

  const refreshSession = async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    const response = await authSessionApi.refresh(refreshToken);
    saveAuthTokens(response.data || {});
    return fetchMe(response.data?.accessToken);
  };

  useEffect(() => {
    const authParam = new URLSearchParams(location.search).get('auth');

    if (authParam === 'register') {
      setMode('register');
      setIsOpen(true);
    } else if (authParam === 'login') {
      setMode('login');
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [location.search]);

  useEffect(() => {
    if (!isOpen || !modalContentRef.current) {
      return;
    }

    modalContentRef.current.scrollTop = 0;
  }, [isOpen, mode]);

  useEffect(() => {
    const restoreSession = async () => {
      const accessToken = getAccessToken();
      if (!accessToken) {
        return;
      }

      try {
        const me = await fetchMe(accessToken);
        setUser(me);
      } catch {
        try {
          const me = await refreshSession();
          setUser(me);
        } catch {
          clearSession();
        }
      }
    };

    restoreSession();
  }, []);

  const closeModal = () => {
    setIsOpen(false);
    setError('');
    setShowPassword(false);
    navigate(location.pathname, { replace: true });
  };

  const openModal = (nextMode) => {
    if (getAccessToken()) {
      goToCabinet();
      return;
    }

    setMode(nextMode);
    setError('');
    setIsOpen(true);
    navigate(`/?auth=${nextMode}`, { replace: true });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!formData.email.trim() || !formData.password.trim()) {
      setError('Заполните все поля');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        email: formData.email.trim(),
        password: formData.password,
      };
      const response = mode === 'login'
        ? await authSessionApi.login(payload)
        : await authSessionApi.register(payload);

      saveAuthTokens(response.data || {});
      const me = await fetchMe(response.data.accessToken);
      setUser(me);
      setFormData({ email: '', password: '' });
      goToCabinet(me?.role);
    } catch (requestError) {
      setError(extractErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    closeModal();
    navigate('/?auth=register');
  };

  const modalMarkup = (
    <div className={`auth-modal ${isOpen ? 'active' : ''}`} onClick={closeModal}>
      <div
        ref={modalContentRef}
        className="auth-modal-content"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="auth-modal-close" type="button" onClick={closeModal} aria-label="Закрыть">
          ×
        </button>

        {hasSession && user ? (
          <>
            <h2 className="auth-modal-title">Профиль</h2>
            <div className="user-info">
              <p><strong>Электронная почта:</strong> {user.email}</p>
              <p><strong>Роль:</strong> {user.role}</p>
              <p><strong>Идентификатор пользователя:</strong> {user.userId}</p>
            </div>
            <button type="button" className="btn btn-secondary btn-logout" onClick={goToCabinet}>
              Личный кабинет
            </button>
            <button type="button" className="btn btn-danger btn-logout" onClick={handleLogout}>
              Выйти
            </button>
          </>
        ) : (
          <>
            <h2 className="auth-modal-title">{mode === 'login' ? 'Вход' : 'Регистрация'}</h2>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Электронная почта</label>
                <input
                  id="email"
                  className="form-control"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Введите электронную почту"
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Пароль</label>
                <div className="password-input-wrapper">
                  <input
                    id="password"
                    className="form-control"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Введите пароль"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                  <button
                    className="password-toggle"
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={loading}
                  >
                    {showPassword ? 'Скрыть' : 'Показать'}
                  </button>
                </div>
              </div>

              {error ? <p className="error-text">{error}</p> : null}

              <button type="submit" className="btn btn-primary btn-login" disabled={loading}>
                {loading ? 'Загрузка...' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
              </button>
            </form>

            <div className="auth-toggle">
              {mode === 'login' ? (
                <p>
                  Нет аккаунта?
                  <button type="button" className="auth-toggle-btn" onClick={() => setMode('register')}>
                    Зарегистрироваться
                  </button>
                </p>
              ) : (
                <p>
                  Уже есть аккаунт?
                  <button type="button" className="auth-toggle-btn" onClick={() => setMode('login')}>
                    Войти
                  </button>
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="auth-button">
      {hasSession ? (
        <div className="user-profile">
          <button
            className="auth-icon-btn"
            type="button"
            aria-label="Открыть личный кабинет"
            onClick={goToCabinet}
          >
            👤
          </button>
          <span className="user-name">{user?.email || 'Личный кабинет'}</span>
        </div>
      ) : (
        <button
          className="auth-icon-btn"
          type="button"
          aria-label="Открыть авторизацию"
          onClick={() => openModal('login')}
        >
          👤
        </button>
      )}
      </div>
      {createPortal(modalMarkup, document.body)}
    </>
  );
}
