// Путь: services/api.js

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Установите базовый URL на ваш Django бэкенд
const API_BASE_URL = 'https://3.92.108.217/notary';

// Создаем экземпляр axios с настройками для самоподписанного сертификата
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000, // 15 секунд таймаут
  
  // На Expo Web эти параметры будут игнорироваться
  validateStatus: function() {
    return true; // Всегда возвращает true для обхода проверки кода состояния
  }
});

// Перехватчик запросов для добавления токена авторизации
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Ошибка запроса:', error);
    return Promise.reject(error);
  }
);

// Перехватчик ответов для обработки ошибок
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.data);
    return response.data;
  },
  async (error) => {
    console.log('API Error:', error);
    
    if (error.response) {
      console.log('Error Response Data:', error.response.data);
      console.log('Error Response Status:', error.response.status);
    }
    
    // Для Expo Web обрабатываем ошибки CORS отдельно
    if (Platform.OS === 'web' && error.message.includes('CORS')) {
      console.error('CORS ошибка - проверьте настройки сервера и браузера');
    }
    
    // Обработка ошибки истечения срока действия токена
    if (error.response && error.response.status === 401) {
      const originalRequest = error.config;
      
      // Предотвращаем бесконечный цикл
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          // Логика обновления токена
          const refreshToken = await AsyncStorage.getItem('refreshToken');
          if (refreshToken) {
            const response = await axios.post(
              `${API_BASE_URL}/api/token/refresh/`,
              { refresh: refreshToken },
              { headers: { 'Content-Type': 'application/json' } }
            );
            
            const { access } = response.data;
            await AsyncStorage.setItem('token', access);
            
            // Обновляем заголовок авторизации
            originalRequest.headers.Authorization = `Bearer ${access}`;
            
            // Повторяем исходный запрос
            return api(originalRequest);
          }
        } catch (refreshError) {
          // Если обновление не удалось, выходим из системы
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('refreshToken');
          await AsyncStorage.removeItem('user');
          
          return Promise.reject(new Error('Сессия истекла. Пожалуйста, войдите снова.'));
        }
      }
    }
    
    // Обработка других ошибок
    if (error.response && error.response.data) {
      if (error.response.data.detail) {
        return Promise.reject({
          response: {
            data: error.response.data
          }
        });
      }
    }
    
    const errorMessage = 
      error.response && error.response.data.message
        ? error.response.data.message
        : error.message || 'Что-то пошло не так';
    
    return Promise.reject(new Error(errorMessage));
  }
);

export default api;