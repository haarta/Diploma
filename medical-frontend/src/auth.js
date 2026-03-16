const ACCESS_TOKEN_KEY = 'auth_access_token';
const AUTH_CHANGE_EVENT = 'auth-change';

const decodeBase64Url = (value) => {
  try {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4 || 4)) % 4);
    return atob(padded);
  } catch {
    return null;
  }
};

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);

export const notifyAuthChanged = () => {
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
};

export const subscribeAuthChange = (callback) => {
  window.addEventListener(AUTH_CHANGE_EVENT, callback);
  window.addEventListener('storage', callback);

  return () => {
    window.removeEventListener(AUTH_CHANGE_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
};

export const getTokenPayload = () => {
  const token = getAccessToken();
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length < 2) return null;

  const decoded = decodeBase64Url(parts[1]);
  if (!decoded) return null;

  try {
    const payload = JSON.parse(decoded);
    const subject = payload?.sub;
    return {
      ...payload,
      userId: payload?.userId ?? (subject != null ? Number(subject) : null),
    };
  } catch {
    return null;
  }
};

export const getUserRole = () => {
  const payload = getTokenPayload();
  return payload?.role || null;
};

export const isAdmin = () => getUserRole() === 'ADMIN';
export const isDoctor = () => getUserRole() === 'DOCTOR';
