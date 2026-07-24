import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { renderMarkdown } from './renderMarkdown';

describe('renderMarkdown', () => {
  it('renders emphasis, unordered lists, and http(s) links', () => {
    render(
      <>
        {renderMarkdown(
          'Built a **CV workspace** with *preview*.\n\n- Templates\n- Snapshots\n\nSee [docs](https://example.dev/docs).',
        )}
      </>,
    );

    expect(screen.getByText('CV workspace').tagName).toBe('STRONG');
    expect(screen.getByText('preview').tagName).toBe('EM');
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getByText('Templates')).toBeInTheDocument();
    expect(screen.getByText('Snapshots')).toBeInTheDocument();

    const link = screen.getByRole('link', { name: 'docs' });
    expect(link).toHaveAttribute('href', 'https://example.dev/docs');
  });

  it('keeps raw HTML as literal text', () => {
    render(<>{renderMarkdown('Hello <script>alert(1)</script> world')}</>);

    expect(screen.getByText(/Hello <script>alert\(1\)<\/script> world/)).toBeInTheDocument();
    expect(document.querySelector('script')).toBeNull();
  });

  it('does not turn invalid URL schemes into links', () => {
    render(<>{renderMarkdown('Click [evil](javascript:alert(1)) please')}</>);

    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText(/\[evil\]\(javascript:alert\(1\)\)/)).toBeInTheDocument();
  });
});
