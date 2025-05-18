import React, { createContext, useContext, useState, useEffect } from 'react';
import { I18n } from 'i18n-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translations
import en from '../translations/en';
import ru from '../translations/ru';
import kg from '../translations/kg';

// Create I18n instance
const i18n = new I18n({
  en,
  ru,
  kg
});

// Create context
const LocalizationContext = createContext();

export const useLocalization = () => {
  return useContext(LocalizationContext);
};

export const LocalizationProvider = ({ children }) => {
  const [locale, setLocale] = useState('en');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved locale when app starts
  useEffect(() => {
    const loadLocale = async () => {
      try {
        const savedLocale = await AsyncStorage.getItem('appLocale');
        if (savedLocale) {
          setLocale(savedLocale);
          i18n.locale = savedLocale;
        } else {
          // Default to English if no locale is saved
          setLocale('en');
          i18n.locale = 'en';
        }
      } catch (error) {
        console.error('Error loading locale:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLocale();
  }, []);

  // Change language function
  const changeLanguage = async (language) => {
    try {
      setLocale(language);
      i18n.locale = language;
      await AsyncStorage.setItem('appLocale', language);
    } catch (error) {
      console.error('Error saving locale:', error);
    }
  };

  // Get text function
  const t = (key, options = {}) => {
    return i18n.t(key, options);
  };

  const value = {
    locale,
    t,
    changeLanguage,
    isLoading,
    locales: {
      en: { code: 'en', name: 'English' },
      ru: { code: 'ru', name: 'Русский' },
      kg: { code: 'kg', name: 'Кыргызча' }
    }
  };

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
};
