import { afterEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import i18n from '../../../shared/i18n/translate';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { cvContentFixture } from '../fixtures/cvContent.fixture';
import StructuredMinimalPreview from './StructuredMinimalPreview';

afterEach(async () => {
  await i18n.changeLanguage('en');
});

describe('StructuredMinimalPreview', () => {
  it('renders fixture contact, education, project, skill groups, and translated section headings', () => {
    renderWithProviders(<StructuredMinimalPreview content={cvContentFixture} />);

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

    renderWithProviders(<StructuredMinimalPreview content={cvContentFixture} />);

    expect(screen.getByRole('heading', { name: 'Контакты' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Навыки' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Образование' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Проекты' })).toBeInTheDocument();
    expect(screen.getByText('сент. 2018 – июнь 2022')).toBeInTheDocument();
    expect(document.querySelector('article')?.getAttribute('lang')).toBe('ru');
  });

  it('keeps stable preview section targets when skills, education, and projects are empty', () => {
    renderWithProviders(
      <StructuredMinimalPreview
        content={{ ...cvContentFixture, skills: [], education: [], projects: [] }}
        highlightedSection="skills"
      />,
    );

    expect(screen.getByTestId('cv-preview-skills')).toHaveAttribute(
      'data-highlighted',
      'true',
    );
    expect(screen.getByTestId('cv-preview-education')).toBeInTheDocument();
    expect(screen.getByTestId('cv-preview-projects')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Skills' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Education' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument();
  });

  it('marks contact highlight as a dark-surface target inside the header', () => {
    renderWithProviders(
      <StructuredMinimalPreview
        content={cvContentFixture}
        highlightedSection="contact"
      />,
    );

    const contact = screen.getByTestId('cv-preview-contact');
    expect(contact).toHaveAttribute('data-highlighted', 'true');
    expect(contact).toHaveAttribute('data-highlight-surface', 'dark');
    expect(contact.closest('header')).not.toBeNull();
  });
});
