import React, { useEffect, useState } from 'react';
import axios from 'axios';
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

const getErrorMessage = (error) => {
    const backendMessage = error?.response?.data?.error;
    if (backendMessage) return backendMessage;
    if (error?.response?.status) return `Request failed (${error.response.status})`;
    return 'Network error';
};

const saveTokens = (tokens) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
};

const clearTokens = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
};

const AuthModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [user, setUser] = useState(null);

    const loadCurrentUser = async (accessToken) => {
        const response = await authApi.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        return response.data;
    };

    useEffect(() => {
        const initSession = async () => {
            const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
            const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

            if (!accessToken) {
                setInitializing(false);
                return;
            }

            try {
                const me = await loadCurrentUser(accessToken);
                setUser(me);
            } catch {
                if (!refreshToken) {
                    clearTokens();
                    setUser(null);
                    setInitializing(false);
                    return;
                }

                try {
                    const refreshResponse = await authApi.post('/api/auth/refresh', { refreshToken });
                    saveTokens(refreshResponse.data);
                    const me = await loadCurrentUser(refreshResponse.data.accessToken);
                    setUser(me);
                } catch {
                    clearTokens();
                    setUser(null);
                }
            } finally {
                setInitializing(false);
            }
        };

        initSession();
    }, []);

    const toggleModal = () => {
        setErrorMessage('');
        setIsOpen(!isOpen);
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const switchMode = () => {
        setIsLogin(!isLogin);
        setErrorMessage('');
        setEmail('');
        setPassword('');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            setErrorMessage('Fill in all fields');
            return;
        }

        setLoading(true);
        setErrorMessage('');
        try {
            const loginResponse = await authApi.post('/api/auth/login', { email, password });
            saveTokens(loginResponse.data);
            const me = await loadCurrentUser(loginResponse.data.accessToken);
            setUser(me);
            setIsOpen(false);
            setEmail('');
            setPassword('');
        } catch (error) {
            setErrorMessage(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            setErrorMessage('Fill in all fields');
            return;
        }

        setLoading(true);
        setErrorMessage('');
        try {
            const registerResponse = await authApi.post('/api/auth/register', { email, password });
            saveTokens(registerResponse.data);
            const me = await loadCurrentUser(registerResponse.data.accessToken);
            setUser(me);
            setIsOpen(false);
            setEmail('');
            setPassword('');
        } catch (error) {
            setErrorMessage(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        clearTokens();
        setUser(null);
        setEmail('');
        setPassword('');
        setErrorMessage('');
    };

    const profileName = user?.email || 'Profile';

    return (
        <>
            <div className="auth-button">
                {!user ? (
                    <button
                        className="auth-icon-btn"
                        onClick={toggleModal}
                        title="Authorization"
                        disabled={initializing}
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
                        <span className="user-name">{profileName}</span>
                        <button
                            className="auth-icon-btn"
                            onClick={toggleModal}
                            title="Profile"
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

            <div className={`auth-modal ${isOpen ? 'active' : ''}`} onClick={toggleModal}>
                <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
                    <button className="auth-modal-close" onClick={toggleModal}>x</button>

                    {!user ? (
                        <>
                            <h2 className="auth-modal-title">{isLogin ? 'Login' : 'Register'}</h2>

                            <form onSubmit={isLogin ? handleLogin : handleRegister} className="auth-form">
                                <div className="form-group">
                                    <label htmlFor="email">Email</label>
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="form-control"
                                        disabled={loading}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="password">Password</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="********"
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
                                            aria-label="Toggle password visibility"
                                        >
                                            {showPassword ? 'Hide' : 'Show'}
                                        </button>
                                    </div>
                                </div>

                                {errorMessage && <p className="error-text">{errorMessage}</p>}

                                <button
                                    type="submit"
                                    className="btn btn-primary btn-login"
                                    disabled={loading}
                                >
                                    {loading ? 'Loading...' : (isLogin ? 'Sign in' : 'Create account')}
                                </button>
                            </form>

                            <div className="auth-toggle">
                                <p>
                                    {isLogin ? 'No account?' : 'Already have an account?'}
                                    <button
                                        type="button"
                                        className="auth-toggle-btn"
                                        onClick={switchMode}
                                        disabled={loading}
                                    >
                                        {isLogin ? 'Register' : 'Login'}
                                    </button>
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <h2 className="auth-modal-title">My profile</h2>
                            <div className="user-info">
                                <p><strong>Email:</strong> {user.email}</p>
                                <p><strong>Role:</strong> {user.role}</p>
                                <p><strong>User ID:</strong> {user.userId}</p>
                            </div>
                            <button onClick={handleLogout} className="btn btn-danger btn-logout">
                                Logout
                            </button>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default AuthModal;
