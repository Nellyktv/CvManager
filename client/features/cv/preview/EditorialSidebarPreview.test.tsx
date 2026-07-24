import { afterEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import i18n from '../../../shared/i18n/translate';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { cvContentFixture } from '../fixtures/cvContent.fixture';
import EditorialSidebarPreview from './EditorialSidebarPreview';

afterEach(async () => {
  await i18n.changeLanguage('en');
});

describe('EditorialSidebarPreview', () => {
  it('renders fixture contact, education, project, skill groups, and translated section headings', () => {
    renderWithProviders(<EditorialSidebarPreview content={cvContentFixture} />);

    expect(screen.getByText('Artem Ilyin')).toBeInTheDocument();
    expect(screen.getByText('BSUIR')).toBeInTheDocument();
    expect(screen.getByText('CV Manager')).toBeInTheDocument();
    expect(screen.getByText('Languages')).toBeInTheDocument();
    expect(screen.getByText('Frameworks')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Contact' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Skills' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Education' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument();
  });

  it('derives headings and dates from active i18n language', async () => {
    await i18n.changeLanguage('ru');

    renderWithProviders(<EditorialSidebarPreview content={cvContentFixture} />);

    expect(screen.getByRole('heading', { name: 'Контакты' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Навыки' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Образование' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Проекты' })).toBeInTheDocument();
    expect(screen.getByText('сент. 2018 – июнь 2022')).toBeInTheDocument();
    expect(document.querySelector('article')?.getAttribute('lang')).toBe('ru');
  });

  it('keeps a stable projects preview target when there are no projects', () => {
    renderWithProviders(
      <EditorialSidebarPreview
        content={{ ...cvContentFixture, projects: [] }}
        highlightedSection="projects"
      />,
    );

    expect(screen.getByTestId('cv-preview-projects')).toHaveAttribute(
      'data-highlighted',
      'true',
    );
    expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument();
  });
});
