import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import de from '../../locales/de.json';
import en from '../../locales/en.json';

export const DEFAULT_LANGUAGE = 'de';
export const SUPPORTED_LANGUAGES = ['de', 'en'];

i18n.use(initReactI18next).init({
  resources: {
    de: { translation: de },
    en: { translation: en },
  },
  lng: DEFAULT_LANGUAGE,
  fallbackLng: false,
  supportedLngs: SUPPORTED_LANGUAGES,
  interpolation: { escapeValue: false },
  returnEmptyString: false,
});

export default i18n;
