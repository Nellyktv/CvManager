export const cvDocumentLocale = (language: string): 'en' | 'ru' =>
  language.startsWith('ru') ? 'ru' : 'en';
