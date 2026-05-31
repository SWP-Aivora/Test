import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import chatService from '../services/chatService';

export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  phone?: string;
  role: 'CLIENT' | 'EXPERT' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED';
}

interface AuthContextType {
  user: UserResponse | null;
  loading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<'CLIENT' | 'EXPERT' | 'ADMIN'>;
  register: (fullName: string, email: string, role: 'CLIENT' | 'EXPERT', password: string) => Promise<'CLIENT' | 'EXPERT' | 'ADMIN'>;
  logout: () => void;
  updateUserProfile: (data: { fullName?: string; phone?: string; avatarUrl?: string }) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Core logout function: wipes storage and disconnects WebSockets
  const logout = () => {
    localStorage.clear();
    setUser(null);
    chatService.disconnect();
  };

  // Restores user session if token exists on application mount
  const restoreSession = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // Fetch currently authenticated profile
      const response = await api.get('/auth/me');
      const profile = response.data as UserResponse;
      setUser(profile);
      
      // Connect to real-time chat
      chatService.connect();
    } catch (err) {
      console.error('[AuthContext] Failed to restore persistent user session:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    restoreSession();

    // Listen to global logout triggers dispatched by our Axios interceptor
    const handleGlobalLogout = () => {
      logout();
      window.location.href = '/login';
    };

    window.addEventListener('auth-logout', handleGlobalLogout);
    return () => {
      window.removeEventListener('auth-logout', handleGlobalLogout);
    };
  }, []);

  // Standard authentication handler
  const login = async (email: string, password: string): Promise<'CLIENT' | 'EXPERT' | 'ADMIN'> => {
    try {
      setError(null);
      const response = await api.post('/auth/login', { email, password });
      const payload = response.data;

      const { accessToken, refreshToken, role } = payload;
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // Instantly load user detail
      const meResponse = await api.get('/auth/me');
      const profile = meResponse.data as UserResponse;

      setUser(profile);
      
      // Start Real-time Chat
      chatService.connect();

      return role as 'CLIENT' | 'EXPERT' | 'ADMIN';
    } catch (err: any) {
      const msg = err?.message || 'Login failed.';
      setError(msg);
      throw err;
    }
  };

  // Registration handler
  const register = async (fullName: string, email: string, role: 'CLIENT' | 'EXPERT', password: string): Promise<'CLIENT' | 'EXPERT' | 'ADMIN'> => {
    try {
      setError(null);
      const response = await api.post('/auth/register', { fullName, email, role, password });
      const payload = response.data;

      const { accessToken, refreshToken } = payload;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      const meResponse = await api.get('/auth/me');
      const profile = meResponse.data as UserResponse;

      setUser(profile);
      chatService.connect();

      return role;
    } catch (err: any) {
      const msg = err?.message || 'Registration failed.';
      setError(msg);
      throw err;
    }
  };

  const clearError = () => setError(null);

  // Helper to dynamically update profile details on the fly
  const updateUserProfile = async (data: { fullName?: string; phone?: string; avatarUrl?: string }) => {
    try {
      const response = await api.put('/users/me', data);
      setUser(response.data as UserResponse);
    } catch (err: any) {
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        error,
        login,
        register,
        logout,
        updateUserProfile,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
};
