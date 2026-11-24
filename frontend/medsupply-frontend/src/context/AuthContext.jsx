import { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/medsupplyApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('medsupply_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('medsupply_token'));
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    const handleUnauthorized = () => logout();
    window.addEventListener('medsupply:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('medsupply:unauthorized', handleUnauthorized);
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((profile) => {
        const merged = {
          userId: profile.id,
          name: profile.name,
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          role: profile.role,
          hospitalId: profile.hospitalId,
          hospitalName: profile.hospitalName,
        };
        setUser(merged);
        localStorage.setItem('medsupply_user', JSON.stringify(merged));
      })
      .catch(() => {
        // Keep token claims if /me fails transiently; interceptor clears on 401
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = async (email, password) => {
    const data = await authApi.login({ email, password });
    localStorage.setItem('medsupply_token', data.token);
    const userObj = {
      userId: data.userId,
      name: data.name || data.email.split('@')[0],
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      role: data.role,
      hospitalId: data.hospitalId,
      hospitalName: data.hospitalName,
    };
    localStorage.setItem('medsupply_user', JSON.stringify(userObj));
    setToken(data.token);
    setUser(userObj);
    return userObj;
  };

  const register = async ({
    firstName,
    lastName,
    hospitalName,
    email,
    password,
    confirmPassword,
  }) => {
    await authApi.register({
      firstName,
      lastName,
      hospitalName,
      email,
      password,
      confirmPassword,
    });
    return login(email, password);
  };

  const logout = () => {
    localStorage.removeItem('medsupply_token');
    localStorage.removeItem('medsupply_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);