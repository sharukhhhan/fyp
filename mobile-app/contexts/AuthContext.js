import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login, register, logout } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user from storage when app starts
  useEffect(() => {
    const loadUser = async () => {
      try {
        await clearAuthData();
        setUser(null);
        const storedUser = await AsyncStorage.getItem('user');
        const storedToken = await AsyncStorage.getItem('token');
        
        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error loading user data: ', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const clearAuthData = async () => {
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('refreshToken');
      console.log('Auth data cleared on app startup');
      return true;
    } catch (error) {
      console.error('Error clearing auth data:', error);
      return false;
    }
  };
  // Login user
  const handleLogin = async (email, password) => {
    try {
      setError(null);
      setIsLoading(true);
      
      // Вызов логин-сервиса
      const result = await login(email, password);
      console.log('Auth context login result:', result);
      
      // Проверяем наличие ошибки
      if (result && result.error) {
        console.log('Auth context setting error:', result.error);
        // Возвращаем объект ошибки, чтобы LoginScreen мог его обработать
        return { error: result.error };
      }
      
      // Проверяем, что результат содержит необходимые данные
      if (!result || !result.user || !result.token) {
        console.log('Auth context invalid result:', result);
        // Возвращаем объект ошибки, чтобы LoginScreen мог его обработать
        return { error: 'Invalid email or password' };
      }
      
      const { user, token } = result;
      
      // Store user and token
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('token', token);
      
      setUser(user);
      return true;
    } catch (error) {
      console.error('Auth context login error:', error);
      await clearAuthData();
      
      // Возвращаем объект ошибки, чтобы LoginScreen мог его обработать
      return { error: 'Login failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  // Register user
  const handleRegister = async (userData) => {
    try {
      setError(null);
      setIsLoading(true);
      
      const response = await register(userData);
      const { user, token } = response;
      
      // Store user and token
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('token', token);
      
      setUser(user);
      return true;
    } catch (error) {
      setError(error.message || 'Registration failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout user
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      
      // Call logout endpoint (if available)
      try {
        await logout();
        
      } catch (error) {
        console.warn('Logout API call failed, continuing with local logout:', error);
        // Continue with local logout even if API call fails
      }
      
      // Clear all storage
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('refreshToken');
      
      // Clear user state
      setUser(null);
      return true;
    } catch (error) {
      console.error('Logout error: ', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (updatedData) => {
    try {
      setIsLoading(true);
      // API call would go here
      
      // Update local storage
      const updatedUser = { ...user, ...updatedData };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      
      setUser(updatedUser);
      return true;
    } catch (error) {
      setError(error.message || 'Profile update failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};