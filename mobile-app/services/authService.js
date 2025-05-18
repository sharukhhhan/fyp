// Путь: services/authService.js

import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Логин пользователя
export const login = async (email, password) => {
  try {
    console.log('Login attempt with email:', email);
    // Вызываем эндпоинт логина
    const response = await api.post('/api/login/', { 
      email, 
      password 
    });
    console.log('Login response received:', response);
    
    // Обрабатываем ответ от Django
    if (!response) {
      console.log('No response received');
      return { error: 'Invalid email or password' };
    }
    
    const { access, refresh, user } = response.data;
    
    if (!access || !refresh) {
      console.log('Missing tokens in response');
      return { error: 'Invalid email or password' };
    }
    
    // Сохраняем токены и данные пользователя
    await AsyncStorage.setItem('token', access);
    await AsyncStorage.setItem('refreshToken', refresh);
    
    // Если объект пользователя не возвращается напрямую, возможно, нужно запросить данные
    let userData = user;
    if (!userData) {
      try {
        userData = await api.get('/api/profile/');
      } catch (profileError) {
        console.log('Failed to fetch profile:', profileError);
        // If we can't get the profile, use a basic user object
        userData = { email };
      }
    }
    
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    
    return {
      user: userData,
      token: access,
      refreshToken: refresh
    };
  } catch (error) {
    console.error('Login error:', error);
    console.error('Login error stack:', error.stack);
    
    // Check response error data
    if (error.response && error.response.data) {
      console.log('Error response data:', error.response.data);
      const data = error.response.data;
      
      if (data.detail === "Не найдено активной учетной записи с указанными данными") {
        return { error: 'Invalid email or password' };
      } else if (data.detail) {
        return { error: data.detail };
      } else if (data.non_field_errors) {
        return { error: data.non_field_errors[0] };
      }
    }
    
    // Direct approach to return error message
    return { error: 'Invalid email or password' };
  }
};

// Регистрация нового пользователя
export const register = async (userData) => {
  try {
    // Форматируем данные согласно ожиданиям Django API
    const formattedData = {
      email: userData.email,
      password: userData.password,
      full_name: userData.firstName + ' ' + userData.lastName,
    };
    
    // Вызываем эндпоинт регистрации
    const response = await api.post('/api/register/', formattedData);
    
    // Если регистрация возвращает токены напрямую
    if (response.data.access && response.data.refresh) {
      await AsyncStorage.setItem('token', response.data.access);
      await AsyncStorage.setItem('refreshToken', response.data.refresh);
      
      // Получаем профиль пользователя, если он не включен в ответ при регистрации
      let user = response.data.user;
      if (!user) {
        user = await api.get('/api/profile/');
      }
      
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      return {
        user,
        token: response.access,
        refreshToken: response.refresh
      };
    }
    console.log('Registration response:', response);
    // Если регистрация не возвращает токены, возможно, нужен отдельный логин
    return await login(userData.email, userData.password);
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    
    // Обрабатываем ошибки валидации Django
    if (error.response && error.response.data) {
      const data = error.response.data;
      if (data.email) {
        throw new Error(`Email: ${data.email[0]}`);
      } else if (data.password) {
        throw new Error(`Пароль: ${data.password[0]}`);
      } else if (data.non_field_errors) {
        throw new Error(data.non_field_errors[0]);
      }
    }
    throw error;
  }
};

// Выход пользователя
export const logout = async () => {
  try {
    // Получаем токен для блокировки
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    
    if (refreshToken) {
      // Вызываем эндпоинт выхода на Django
      await api.post('/api/logout/', { refresh: refreshToken });
    }
    
    // Очищаем локальное хранилище в любом случае
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('user');
    
    return true;
  } catch (error) {
    console.error('Ошибка выхода:', error);
    // Даже если вызов API не удался, всё равно очищаем хранилище
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('user');
    return true;
  }
};

// Остальные функции аутентификации...

// Reset password request
export const requestPasswordReset = async (email) => {
  try {
    // This endpoint might not exist in your API, check with backend
    await api.post('/api/reset-password/', { email });
    return true;
  } catch (error) {
    throw error;
  }
};

// Verify email
export const verifyEmail = async (token) => {
  try {
    // This endpoint might not exist in your API, check with backend
    await api.post('/api/verify-email/', { token });
    return true;
  } catch (error) {
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (userData) => {
  try {
    const response = await api.patch('/api/profile/', userData);
    return response;
  } catch (error) {
    throw error;
  }
};

// Change password
export const changePassword = async (currentPassword, newPassword) => {
  try {
    // This endpoint might not exist in your API, check with backend
    await api.put('/api/change-password/', {
      current_password: currentPassword,
      new_password: newPassword
    });
    return true;
  } catch (error) {
    throw error;
  }
};