import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'PROCUREMENT_OFFICER' | 'VENDOR' | 'MANAGER';
  vendorId: number | null;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  login: (accessToken: string, refreshToken: string, user: UserProfile) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isOfficer: boolean;
  isVendor: boolean;
  isManager: boolean;
  loading: boolean;
  apiFetch: (url: string, options?: RequestInit) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Restore session on bootstrap
    const storedUser = localStorage.getItem('vb_user');
    const storedToken = localStorage.getItem('vb_token');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  const login = (accessToken: string, refreshToken: string, userProfile: UserProfile) => {
    localStorage.setItem('vb_token', accessToken);
    localStorage.setItem('vb_refresh_token', refreshToken);
    localStorage.setItem('vb_user', JSON.stringify(userProfile));
    
    setToken(accessToken);
    setUser(userProfile);
  };

  const logout = () => {
    localStorage.removeItem('vb_token');
    localStorage.removeItem('vb_refresh_token');
    localStorage.removeItem('vb_user');
    
    setToken(null);
    setUser(null);
    navigate('/login');
  };

  // Helper fetch method wrapping requests with Authorization token headers automatically
  const API_URL = (import.meta as any).env.VITE_API_URL;
  const apiFetch = async (url: string, options: RequestInit = {}) => {
    const activeToken = token || localStorage.getItem('vb_token');
    
    const headers = new Headers(options.headers || {});
    if (activeToken) {
      headers.set('Authorization', `Bearer ${activeToken}`);
    }
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const res = await fetch(`${API_URL}${url}`, {
  ...options,
  headers
});
    
    if (res.status === 401 || res.status === 403) {
      // Handle expired token refresh attempt or log out
      const refreshToken = localStorage.getItem('vb_refresh_token');
      if (refreshToken && res.status === 403) {
        try {
          const refreshRes = await fetch(`${API_URL}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshRes.ok) {
            const data = await refreshRes.json();
            localStorage.setItem('vb_token', data.accessToken);
            setToken(data.accessToken);
            // Re-execute request with new token
            headers.set('Authorization', `Bearer ${data.accessToken}`);
            const retryRes = await fetch(url, { ...options, headers });
            if (retryRes.ok) return await retryRes.json();
          }
        } catch (e) {
          console.error('Auto session refresh failed:', e);
        }
      }
      
      // If refresh fails or unauthorized, force logout
      logout();
      throw new Error('Session expired');
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Server request failed');
    }

    return await res.json();
  };

  const role = user?.role;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!user,
        isAdmin: role === 'ADMIN',
        isOfficer: role === 'PROCUREMENT_OFFICER',
        isVendor: role === 'VENDOR',
        isManager: role === 'MANAGER',
        loading,
        apiFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
