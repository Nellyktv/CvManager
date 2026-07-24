import dayjs from 'dayjs';
import 'dayjs/locale/en.js';
import 'dayjs/locale/ru.js';

const formatPart = (value: string | undefined, locale: string) => {
  if (!value) return '';
  return dayjs(value).locale(locale).format('MMM YYYY');
};

export const formatCvDateRange = (
  startDate: string | undefined,
  endDate: string | undefined,
  locale: string,
): string => {
  const start = formatPart(startDate, locale);
  const end = formatPart(endDate, locale);

  if (!start && !end) return '';
  if (start && end) return `${start} – ${end}`;
  return start || end;
};
