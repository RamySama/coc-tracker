import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './locales/fr.json';
import en from './locales/en.json';
import { useSession } from './store/session';

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: useSession.getState().locale,
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
});

// garde i18next synchronisé avec le store de session
useSession.subscribe((s) => {
  if (s.locale !== i18n.language) i18n.changeLanguage(s.locale);
});

export default i18n;
