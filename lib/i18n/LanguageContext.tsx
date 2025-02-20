import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { I18nManager } from 'react-native';
import i18n from './i18n';

type Language = 'en' | 'ar';

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  isRTL: boolean;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    loadSavedLanguage();
  }, []);

  async function loadSavedLanguage() {
    try {
      const savedLanguage = await AsyncStorage.getItem('language');
      const deviceLanguage = Localization.locale.split('-')[0];
      const initialLang = (savedLanguage || deviceLanguage === 'ar' ? 'ar' : 'en') as Language;
      
      await handleLanguageChange(initialLang);
      setIsInitialized(true);
    } catch (error) {
      console.error('Error loading language:', error);
      await handleLanguageChange('en');
      setIsInitialized(true);
    }
  }

  async function handleLanguageChange(lang: Language) {
    try {
      // Update AsyncStorage
      await AsyncStorage.setItem('language', lang);

      // Update i18n
      await i18n.changeLanguage(lang);

      // Update RTL
      const isRTL = lang === 'ar';
      I18nManager.allowRTL(isRTL);
      I18nManager.forceRTL(isRTL);

      // Update state
      setLanguageState(lang);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  }

  const value = {
    language,
    setLanguage: handleLanguageChange,
    isRTL: language === 'ar',
  };

  if (!isInitialized) {
    return null; // or a loading spinner
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
} 