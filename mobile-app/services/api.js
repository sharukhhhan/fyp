// Путь: services/api.js

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import axiosHttpsProxyFix from 'axios-https-proxy-fix';

// Установите базовый URL на ваш Django бэкенд
const API_BASE_URL = 'https://mynotary-app.online/notary';

// Configure axios with SSL handling for development
let axiosConfig = {
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: Platform.OS === 'android' ? 30000 : 15000,
};

// Special handling for iOS in development
if (Platform.OS === 'ios') {
  axiosConfig = {
    ...axiosConfig,
    httpsAgent: new (axiosHttpsProxyFix.httpsAgent || axiosHttpsProxyFix)({
      rejectUnauthorized: false, // This is only for development!
    }),
  };
} else if (Platform.OS === 'android') {
  axiosConfig = {
    ...axiosConfig,
    validateStatus: () => true,
    maxRedirects: 5,
  };
}

// Create axios instance with the configuration
export const api = axios.create(axiosConfig);

// Request interceptor for handling document downloads
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Set arraybuffer response type only for document downloads
    if (config.url.includes('/download/')) {
      config.responseType = 'arraybuffer';
      config.headers['Accept'] = 'application/octet-stream';
    }
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling different response types
api.interceptors.response.use(
  (response) => {
    // Log the response status, but not the full data which could be large
    console.log('API Response:', response.status, response.config.url);
    
    // Handle binary responses (documents)
    if (response.config.responseType === 'arraybuffer') {
      console.log('Received arraybuffer response');
      return response;
    }
    
    // Handle login endpoint specifically to parse JSON from ArrayBuffer
    if (response.config.url.includes('/login/') && response.data instanceof ArrayBuffer) {
      console.log('Processing arraybuffer login response');
      const decoder = new TextDecoder('utf-8');
      const jsonStr = decoder.decode(response.data);
      try {
        response.data = JSON.parse(jsonStr);
      } catch (error) {
        console.error('Error parsing JSON from ArrayBuffer', error);
        // Return original response if parsing fails
      }
      return response;
    }
    
    // Handle documents endpoint for consistent response format
    if (response.config.url.includes('/documents/') && !response.config.url.includes('/download/')) {
      // Ensure we return data in a consistent format
      if (Array.isArray(response.data)) {
        // Response is already the array of documents
        return response;
      } else if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data.results)) {
          // Response follows Django REST pagination format
          response.data = response.data.results;
          return response;
        } else if (!Array.isArray(response.data) && !response.config.url.match(/\/documents\/\d+\/?$/)) {
          // Wrap single object in array if it's not a detail view
          response.data = [response.data];
          return response;
        }
      }
    }
    
    return response;
  },
  async (error) => {
    console.log('API Error:', error.message);
    
    // Log more detailed error information for debugging
    if (error.response) {
      console.log('Error Status:', error.response.status);
      if (error.response.data instanceof ArrayBuffer) {
        // Try to decode error message from binary response
        try {
          const decoder = new TextDecoder('utf-8');
          const jsonStr = decoder.decode(error.response.data);
          const errorData = JSON.parse(jsonStr);
          console.log('Error Data (decoded):', errorData);
        } catch (decodeError) {
          console.log('Could not decode error response:', decodeError.message);
        }
      } else {
        console.log('Error Data:', error.response.data);
      }
    } else if (error.request) {
      // Request was made but no response received
      console.log('No response received:', error.request);
    }
    
    // Handle CORS errors
    if (Platform.OS === 'web' && error.message.includes('CORS')) {
      console.error('CORS error detected - check server configuration');
    }
    
    // Handle network errors
    if (error.message.includes('Network Error') || !error.response) {
      console.log('Network error or server unreachable');
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