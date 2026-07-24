import { describe, expect, it, vi } from 'vitest';
import { type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';

vi.mock('@react-pdf/renderer', () => ({
  Document: ({ children }: { children?: ReactNode }) => children ?? null,
  Page: ({ children }: { children?: ReactNode }) => children ?? null,
  View: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  Text: ({ children }: { children?: ReactNode }) => <span>{children}</span>,
  Link: ({
    children,
    src,
  }: {
    children?: ReactNode;
    src?: string;
  }) => <a href={src}>{children}</a>,
  StyleSheet: { create: (styles: unknown) => styles },
}));

import { markdownToPdf } from './markdownToPdf';

describe('markdownToPdf', () => {
  it('renders emphasis, unordered lists, and http(s) links', () => {
    render(
      <>
        {markdownToPdf(
          'Built a **CV workspace** with *preview*.\n\n- Templates\n- Snapshots\n\nSee [docs](https://example.dev/docs).',
        )}
      </>,
    );

    expect(screen.getByText('CV workspace')).toBeInTheDocument();
    expect(screen.getByText('preview')).toBeInTheDocument();
    expect(screen.getByText('Templates')).toBeInTheDocument();
    expect(screen.getByText('Snapshots')).toBeInTheDocument();

    const link = screen.getByRole('link', { name: 'docs' });
    expect(link).toHaveAttribute('href', 'https://example.dev/docs');
  });

  it('keeps raw HTML as literal text', () => {
    render(<>{markdownToPdf('Hello <script>alert(1)</script> world')}</>);

    expect(screen.getByText(/Hello <script>alert\(1\)<\/script> world/)).toBeInTheDocument();
    expect(document.querySelector('script')).toBeNull();
  });

  it('does not turn invalid URL schemes into links', () => {
    render(<>{markdownToPdf('Click [evil](javascript:alert(1)) please')}</>);

    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText(/\[evil\]\(javascript:alert\(1\)\)/)).toBeInTheDocument();
  });
});
