import React, { useState } from 'react';
import '../styles/AuthModal.css';

const AuthModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);

    const toggleModal = () => {
        setIsOpen(!isOpen);
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!phone || !password) {
            alert('Заполните все поля');
            return;
        }

        setLoading(true);
        // Имитация запроса к серверу
        setTimeout(() => {
            setUser({ phone, name: phone });
            setIsOpen(false);
            setPhone('');
            setPassword('');
            setLoading(false);
        }, 1000);
    };

    const handleLogout = () => {
        setUser(null);
        setPhone('');
        setPassword('');
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!phone || !password) {
            alert('Заполните все поля');
            return;
        }

        setLoading(true);
        // Имитация регистрации
        setTimeout(() => {
            setUser({ phone, name: phone });
            setIsOpen(false);
            setPhone('');
            setPassword('');
            setLoading(false);
        }, 1000);
    };

    return (
        <>
            {/* Кнопка авторизации в хедере */}
            <div className="auth-button">
                {!user ? (
                    <button
                        className="auth-icon-btn"
                        onClick={toggleModal}
                        title="Авторизация"
                    >
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <circle cx="12" cy="8" r="4"/>
                            <path d="M 12 14 C 7 14 2 16.5 2 19 V 22 H 22 V 19 C 22 16.5 17 14 12 14"/>
                        </svg>
                    </button>
                ) : (
                    <div className="user-profile">
                        <span className="user-name">{user.name}</span>
                        <button
                            className="auth-icon-btn"
                            onClick={toggleModal}
                            title="Профиль"
                        >
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                            >
                                <circle cx="12" cy="8" r="4"/>
                                <path d="M 12 14 C 7 14 2 16.5 2 19 V 22 H 22 V 19 C 22 16.5 17 14 12 14"/>
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            {/* Модальное окно авторизации */}
            <div className={`auth-modal ${isOpen ? 'active' : ''}`} onClick={toggleModal}>
                <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
                    <button className="auth-modal-close" onClick={toggleModal}>✕</button>

                    {!user ? (
                        <>
                            {/* Заголовок */}
                            <h2 className="auth-modal-title">
                                {isLogin ? 'Вход' : 'Регистрация'}
                            </h2>

                            {/* Форма */}
                            <form onSubmit={isLogin ? handleLogin : handleRegister} className="auth-form">
                                <div className="form-group">
                                    <label htmlFor="phone">Номер телефона</label>
                                    <input
                                        id="phone"
                                        type="tel"
                                        placeholder="+7 (999) 999-99-99"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="form-control"
                                        disabled={loading}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="password">Пароль</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="form-control"
                                            disabled={loading}
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle"
                                            onClick={togglePasswordVisibility}
                                            disabled={loading}
                                        >
                                            {showPassword ? '👁️' : '👁️‍🗨️'}
                                        </button>
                                    </div>
                                </div>

                                {isLogin && (
                                    <a href="#" className="forgot-password">Забыли пароль?</a>
                                )}

                                <button
                                    type="submit"
                                    className="btn btn-primary btn-login"
                                    disabled={loading}
                                >
                                    {loading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Создать аккаунт')}
                                </button>
                            </form>

                            {/* Переключение между входом и регистрацией */}
                            <div className="auth-toggle">
                                <p>
                                    {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
                                    <button
                                        type="button"
                                        className="auth-toggle-btn"
                                        onClick={() => {
                                            setIsLogin(!isLogin);
                                            setPhone('');
                                            setPassword('');
                                        }}
                                    >
                                        {isLogin ? 'Зарегистрируйтесь' : 'Войдите'}
                                    </button>
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Профиль пользователя */}
                            <h2 className="auth-modal-title">Мой профиль</h2>
                            <div className="user-info">
                                <p><strong>Номер:</strong> {user.phone}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="btn btn-danger btn-logout"
                            >
                                Выйти
                            </button>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default AuthModal;
