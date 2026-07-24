/** Normalize i18n language to the locales our document formatting supports. */
export const cvDocumentLocale = (language: string): 'en' | 'ru' =>
  language.startsWith('ru') ? 'ru' : 'en';
