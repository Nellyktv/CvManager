import { describe, expect, it } from 'vitest';
import type { CvContent } from '../types/cv';
import { isSafeUrl } from './isSafeUrl';
import { moveItem } from './moveItem';
import { isCvComplete } from './cvCompletion';
import { formatCvDateRange } from './formatDate';

describe('isSafeUrl', () => {
  it.each(['https://github.com', 'http://example.com', 'HTTPS://EXAMPLE.COM'])('allows %s', (url) => {
    expect(isSafeUrl(url)).toBe(true);
  });

  it.each(['javascript:alert(1)', 'data:text/html,hi', 'ftp://example.com', 'github.com'])(
    'blocks %s',
    (url) => {
      expect(isSafeUrl(url)).toBe(false);
    },
  );
});

describe('moveItem', () => {
  it('moves an item up and down', () => {
    expect(moveItem(['a', 'b', 'c'], 1, -1)).toEqual(['b', 'a', 'c']);
    expect(moveItem(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'c', 'b']);
  });

  it('returns the same array when the move is out of bounds', () => {
    const items = ['a', 'b'];

    expect(moveItem(items, 0, -1)).toBe(items);
    expect(moveItem(items, 1, 1)).toBe(items);
  });

  it('does not mutate the original array', () => {
    const items = ['a', 'b'];

    moveItem(items, 0, 1);

    expect(items).toEqual(['a', 'b']);
  });
});

describe('isCvComplete', () => {
  const content = (overrides: Partial<CvContent> = {}): CvContent => ({
    contact: { name: 'Ivan', email: 'ivan@demo.com', links: [] },
    skills: [],
    education: [{ institution: 'MSU' }],
    projects: [],
    ...overrides,
  });

  it('is true when name, email and an institution are filled', () => {
    expect(isCvComplete(content())).toBe(true);
  });

  it('is false without a name', () => {
    expect(isCvComplete(content({ contact: { name: ' ', email: 'ivan@demo.com', links: [] } }))).toBe(false);
  });

  it('is false without education', () => {
    expect(isCvComplete(content({ education: [] }))).toBe(false);
  });
});

describe('formatCvDateRange', () => {
  it('formats a full range', () => {
    expect(formatCvDateRange('2018-09-01', '2022-06-30', 'en')).toBe('Sep 2018 – Jun 2022');
  });

  it('shows a single date when only one is given', () => {
    expect(formatCvDateRange('2018-09-01', undefined, 'en')).toBe('Sep 2018');
    expect(formatCvDateRange(undefined, '2022-06-30', 'en')).toBe('Jun 2022');
  });

  it('returns an empty string without dates', () => {
    expect(formatCvDateRange(undefined, undefined, 'en')).toBe('');
  });

  it('uses the given locale', () => {
    expect(formatCvDateRange('2018-09-01', undefined, 'ru')).toMatch(/2018/);
    expect(formatCvDateRange('2018-09-01', undefined, 'ru')).not.toContain('Sep');
  });
});
