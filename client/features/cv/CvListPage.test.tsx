import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';

import i18n from '../../shared/i18n/translate';
import { renderWithProviders } from '../../test/renderWithProviders';
import CvListPage from './CvListPage';

vi.mock('../../shared/hooks/useCvList', () => ({
  useCvList: () => ({
    cvs: [
      {
        id: 11,
        candidate: 'Artem Ilyin',
        position: 'Frontend Engineer',
        version: 2,
        updated: '24.07.2026',
        status: 'draft',
        templateKey: 'editorial-sidebar',
      },
      {
        id: 12,
        candidate: 'Artem Ilyin',
        position: 'Backend Engineer',
        version: 1,
        updated: '20.07.2026',
        status: 'published',
        templateKey: 'structured-minimal',
      },
    ],
    isLoading: false,
    error: null,
  }),
}));

afterEach(async () => {
  await i18n.changeLanguage('en');
});

describe('CvListPage', () => {
  it.each([
    {
      language: 'en' as const,
      headers: ['STATUS', 'TEMPLATE'],
      statuses: ['Draft', 'Published'],
      templates: ['Editorial sidebar', 'Structured minimal'],
    },
    {
      language: 'ru' as const,
      headers: ['СТАТУС', 'ШАБЛОН'],
      statuses: ['Черновик', 'Опубликовано'],
      templates: ['Редакционный сайдбар', 'Структурированный минимализм'],
    },
  ])(
    'shows localized status and template columns with Chip labels in $language',
    async ({ language, headers, statuses, templates }) => {
      await i18n.changeLanguage(language);
      renderWithProviders(<CvListPage />);

      for (const header of headers) {
        expect(screen.getByText(header)).toBeInTheDocument();
      }
      for (const status of statuses) {
        expect(screen.getByText(status)).toBeInTheDocument();
      }
      for (const template of templates) {
        expect(screen.getByText(template)).toBeInTheDocument();
      }
    },
  );
});
