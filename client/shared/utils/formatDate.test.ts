import { describe, expect, it } from 'vitest';
import { formatCvDateRange } from './formatDate';

describe('formatCvDateRange', () => {
  it('formats EN and RU ranges with fixed input dates', () => {
    expect(formatCvDateRange('2020-01-15', '2022-12-01', 'en')).toBe('Jan 2020 – Dec 2022');
    expect(formatCvDateRange('2020-01-15', '2022-12-01', 'ru')).toBe('янв. 2020 – дек. 2022');
  });

  it('returns empty string when both dates are absent', () => {
    expect(formatCvDateRange(undefined, undefined, 'en')).toBe('');
  });

  it('formats a single bound when only one date is present', () => {
    expect(formatCvDateRange('2020-01-15', undefined, 'en')).toBe('Jan 2020');
    expect(formatCvDateRange(undefined, '2022-12-01', 'ru')).toBe('дек. 2022');
  });
});
