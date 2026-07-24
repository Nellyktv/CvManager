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
import CvPdfRouter from './CvPdfRouter';

const labels = {
  contact: 'Contact',
  skills: 'Skills',
  education: 'Education',
  projects: 'Projects',
};

const linkStyle = (name: string) =>
  JSON.parse(screen.getByRole('link', { name }).getAttribute('data-style') ?? '{}') as {
    textDecoration?: string;
    color?: string;
  };

describe('CvPdfRouter', () => {
  it('routes editorial-sidebar to the sidebar-link treatment with fixture content', () => {
    render(
      <CvPdfRouter
        templateKey="editorial-sidebar"
        content={cvContentFixture}
        labels={labels}
        locale="en"
      />,
    );

    expect(screen.getByText('Artem Ilyin')).toBeInTheDocument();
    expect(screen.getByText('CV Manager')).toBeInTheDocument();
    expect(screen.getByText('BSUIR')).toBeInTheDocument();
    expect(linkStyle('LinkedIn').textDecoration).toBe('none');
    expect(linkStyle('Repo').textDecoration).toBe('underline');
  });

  it('routes structured-minimal to the underlined contact-link treatment with fixture content', () => {
    render(
      <CvPdfRouter
        templateKey="structured-minimal"
        content={cvContentFixture}
        labels={labels}
        locale="en"
      />,
    );

    expect(screen.getByText('Artem Ilyin')).toBeInTheDocument();
    expect(screen.getByText('CV Manager')).toBeInTheDocument();
    expect(screen.getByText('BSUIR')).toBeInTheDocument();
    expect(linkStyle('LinkedIn').textDecoration).toBe('underline');
    expect(linkStyle('Repo').textDecoration).toBe('underline');
    expect(linkStyle('Repo').color).not.toBe(linkStyle('LinkedIn').color);
  });
});
