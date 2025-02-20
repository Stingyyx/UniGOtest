import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations } from './translations';
import * as Localization from 'expo-localization';
import { I18nManager } from 'react-native';
import { InitOptions } from 'i18next';

// Get device language
const deviceLanguage = Localization.locale.split('-')[0];
const isRTL = false; // Force LTR layout

// Force RTL layout if needed
if (isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

const i18nConfig: InitOptions = {
  resources: {
    en: {
      translation: translations.en
    },
    ar: {
      translation: translations.ar
    }
  },
  lng: deviceLanguage === 'ar' ? 'ar' : 'en', // Set initial language
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v4',
  react: {
    useSuspense: false
  }
};

i18n
  .use(initReactI18next)
  .init(i18nConfig);

export default i18n; 