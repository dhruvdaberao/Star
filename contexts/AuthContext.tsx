import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User } from '../types';
import * as api from '../api';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for user session on initial load
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const userJson = localStorage.getItem('currentUser');
      if (token && userJson) {
        try {
          const user = JSON.parse(userJson);
          setCurrentUser(user);
        } catch (error) {
           console.error("Failed to parse stored user:", error);
           localStorage.removeItem('token');
           localStorage.removeItem('currentUser');
        }
      }
      setIsLoading(false);
    };
    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.login({ email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('currentUser', JSON.stringify(data.user));
    setCurrentUser(data.user);
  };

  const register = async (name: string, username: string, email: string, password: string) => {
    const { data } = await api.register({ name, username, email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('currentUser', JSON.stringify(data.user));
    setCurrentUser(data.user);
  };
  
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
  };

  const value = {
      currentUser,
      setCurrentUser,
      login,
      register,
      logout,
      isLoading
  };

  // Render a loading screen while checking for authentication, to prevent flicker
  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
