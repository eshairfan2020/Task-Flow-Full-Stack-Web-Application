// Context API — every page needs to know "who is logged in", and without
// Context you'd have to pass `user` and `login`/`logout` down through
// every intermediate component that doesn't itself care about auth
// (Prop Drilling). Context lets any descendant call useAuth() directly.
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiFetch, setTokens, clearTokens } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // useEffect: on first mount, if we already have a token, fetch the
  // current user so a page refresh doesn't lose the session.
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }
    apiFetch('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => clearTokens())
      .finally(() => setLoading(false));
  }, []);

  // useCallback: these functions are passed down via context value; wrapping
  // them means components consuming only `login`/`logout` (not `user`)
  // don't get a new function reference on every render.
  const login = useCallback(async (email, password) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setTokens(data);
    setUser(data.user);
  }, []);

  const register = useCallback(async (name, email, password) => {
    await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    await login(email, password);
  }, [login]);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    clearTokens();
    setUser(null);
    try {
      await apiFetch('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) });
    } catch {
      // logout is best-effort client-side regardless of server response
    }
  }, []);

  const value = { user, loading, login, register, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook wrapping useContext — the idiomatic way to consume a context.
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
