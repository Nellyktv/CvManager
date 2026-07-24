import { describe, expect, it, vi } from 'vitest';
import { type CSSProperties, type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';

vi.mock('@react-pdf/renderer', () => ({
  Document: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  Page: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  View: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  Text: ({ children }: { children?: ReactNode }) => <span>{children}</span>,
  Link: ({
    children,
    src,
    style,
  }: {
    children?: ReactNode;
    src?: string;
    style?: CSSProperties;
  }) => (
    <a href={src} data-style={JSON.stringify(style)}>
      {children}
    </a>
  ),
  StyleSheet: { create: (styles: unknown) => styles },
}));

import { cvContentFixture } from '../fixtures/cvContent.fixture';
import EditorialSidebarPdf from './EditorialSidebarPdf';

const labels = {
  contact: 'Contact',
  skills: 'Skills',
  education: 'Education',
  projects: 'Projects',
};

const ruLabels = {
  contact: 'Контакты',
  skills: 'Навыки',
  education: 'Образование',
  projects: 'Проекты',
};

describe('EditorialSidebarPdf', () => {
  it('renders fixture contact, skills, education, projects, and markdown content', () => {
    render(
      <EditorialSidebarPdf
        content={cvContentFixture}
        labels={labels}
        locale="en"
      />,
    );

    expect(screen.getByText('Artem Ilyin')).toBeInTheDocument();
    expect(screen.getByText('Frontend Engineer')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByText('artem@example.com')).toBeInTheDocument();
    expect(screen.getByText('+370 600 00000')).toBeInTheDocument();
    expect(screen.getByText('Vilnius, Lithuania')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
      'href',
      'https://linkedin.com/in/example',
    );
    expect(screen.getByRole('link', { name: 'Repo' })).toHaveAttribute(
      'href',
      'https://github.com/example/cv-manager',
    );

    expect(screen.getByText('Skills')).toBeInTheDocument();
    expect(screen.getByText('Languages')).toBeInTheDocument();
    expect(screen.getByText('Frameworks')).toBeInTheDocument();
    expect(screen.getByText(/TypeScript — Advanced/)).toBeInTheDocument();
    expect(screen.getByText(/• React/)).toBeInTheDocument();

    expect(screen.getByText('Education')).toBeInTheDocument();
    expect(screen.getByText('BSUIR')).toBeInTheDocument();
    expect(screen.getByText('BSc, Computer Science')).toBeInTheDocument();
    expect(screen.getByText('Sep 2018 – Jun 2022')).toBeInTheDocument();

    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('CV Manager')).toBeInTheDocument();
    expect(
      screen.getByText(/Full-stack developer · Jan 2024 – Dec 2025/),
    ).toBeInTheDocument();
    expect(screen.getByText('CV workspace')).toBeInTheDocument();
    expect(screen.getByText('preview')).toBeInTheDocument();
    expect(screen.getByText('Templates')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'docs' })).toHaveAttribute(
      'href',
      'https://example.dev/docs',
    );
  });

  it('formats education dates with the active locale', () => {
    render(
      <EditorialSidebarPdf
        content={cvContentFixture}
        labels={ruLabels}
        locale="ru"
      />,
    );

    expect(screen.getByText('Контакты')).toBeInTheDocument();
    expect(screen.getByText('Навыки')).toBeInTheDocument();
    expect(screen.getByText('Образование')).toBeInTheDocument();
    expect(screen.getByText('Проекты')).toBeInTheDocument();
    expect(screen.getByText('сент. 2018 – июнь 2022')).toBeInTheDocument();
  });

  it('uses high-contrast underlined main-column links distinct from sidebar links', () => {
    render(
      <EditorialSidebarPdf
        content={cvContentFixture}
        labels={labels}
        locale="en"
      />,
    );

    const sidebarLink = screen.getByRole('link', { name: 'LinkedIn' });
    const mainLink = screen.getByRole('link', { name: 'Repo' });

    const sidebarStyle = JSON.parse(sidebarLink.getAttribute('data-style') ?? '{}') as {
      color?: string;
      textDecoration?: string;
    };
    const mainStyle = JSON.parse(mainLink.getAttribute('data-style') ?? '{}') as {
      color?: string;
      textDecoration?: string;
    };

    expect(sidebarStyle.textDecoration).toBe('none');
    expect(mainStyle.textDecoration).toBe('underline');
    expect(mainStyle.color).toBeTruthy();
    expect(mainStyle.color).not.toBe(sidebarStyle.color);
  });
});
