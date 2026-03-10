import { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/AuthModal.css';

const AUTH_API_BASE = import.meta.env.VITE_AUTH_URL || 'http://localhost:8081';
const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';

const authApi = axios.create({
  baseURL: AUTH_API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

  const hasSession = Boolean(localStorage.getItem(ACCESS_TOKEN_KEY));

  const saveTokens = (payload) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, payload.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, payload.refreshToken);
  };

  const clearSession = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setUser(null);
  };

  const goToCabinet = () => {
    setIsOpen(false);
    navigate('/cabinet/info');
  };

  const fetchMe = async (token) => {
    const response = await authApi.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  };

  const refreshSession = async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      return null;
    }

    const response = await authApi.post('/api/auth/refresh', { refreshToken });
    saveTokens(response.data);
    return fetchMe(response.data.accessToken);
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
    const restoreSession = async () => {
      const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
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
    if (localStorage.getItem(ACCESS_TOKEN_KEY)) {
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
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const response = await authApi.post(endpoint, {
        email: formData.email.trim(),
        password: formData.password,
      });

      saveTokens(response.data);
      const me = await fetchMe(response.data.accessToken);
      setUser(me);
      setFormData({ email: '', password: '' });
      goToCabinet();
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

  return (
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

      <div className={`auth-modal ${isOpen ? 'active' : ''}`} onClick={closeModal}>
        <div className="auth-modal-content" onClick={(event) => event.stopPropagation()}>
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
    </div>
  );
}
