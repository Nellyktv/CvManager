import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useEffect } from 'react';
import { screen, within } from '@testing-library/react';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';

import { en } from '../../../shared/i18n/languages/en';
import { ru } from '../../../shared/i18n/languages/ru';
import i18n from '../../../shared/i18n/translate';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { cvContentFixture } from '../fixtures/cvContent.fixture';
import CvLoadError from '../components/CvLoadError';
import CvTemplatePicker from '../components/CvTemplatePicker';
import CvWorkspaceHeader from '../components/CvWorkspaceHeader';
import MarkdownProjectEditor from '../components/MarkdownProjectEditor';
import RefreshFromProfileDialog from '../components/RefreshFromProfileDialog';
import EditorialSidebarPreview from '../preview/EditorialSidebarPreview';
import StructuredMinimalPreview from '../preview/StructuredMinimalPreview';

let mockTheme: 'light' | 'dark' = 'dark';

vi.mock('../../../store/ThemeStore', () => ({
  useThemeStore: (selector: (state: { theme: 'light' | 'dark' }) => unknown) =>
    selector({ theme: mockTheme }),
}));

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

const RAW_KEY = /\b(cv|profile|common)\.[a-zA-Z][a-zA-Z0-9.]*\b/;

const leafKeys = (obj: Record<string, unknown>, prefix = ''): string[] =>
  Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object') {
      return leafKeys(value as Record<string, unknown>, path);
    }
    return [path];
  });

const SuccessCopyProbe = ({ keys }: { keys: string[] }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();

  useEffect(() => {
    for (const key of keys) {
      enqueueSnackbar(t(key), { variant: 'success' });
    }
  }, [enqueueSnackbar, keys, t]);

  return null;
};

const headerProps = {
  title: '',
  status: 'draft' as const,
  templateKey: 'editorial-sidebar' as const,
  canEdit: true,
  onTemplateChange: () => {},
  onRefreshClick: () => {},
  onPublish: () => {},
  onPrint: () => {},
  onDownloadPdf: () => {},
};

beforeEach(() => {
  mockTheme = 'dark';
});

afterEach(async () => {
  await i18n.changeLanguage('en');
  mockTheme = 'dark';
});

describe('CV EN/RU copy coverage', () => {
  it('keeps parallel cv and profile keys in both dictionaries', () => {
    const enKeys = new Set(leafKeys(en as unknown as Record<string, unknown>));
    const ruKeys = new Set(leafKeys(ru as unknown as Record<string, unknown>));

    const enFeature = [...enKeys].filter(
      (key) => key.startsWith('cv.') || key.startsWith('profile.'),
    );
    const ruFeature = [...ruKeys].filter(
      (key) => key.startsWith('cv.') || key.startsWith('profile.'),
    );

    expect(enFeature.sort()).toEqual(ruFeature.sort());
    expect(enKeys.has('cv.columnTemplate')).toBe(true);
    expect(ruKeys.has('cv.columnTemplate')).toBe(true);
  });

  it.each([
    {
      language: 'en' as const,
      templateNames: ['Editorial sidebar', 'Structured minimal'],
      sectionTitles: ['Contact', 'Skills', 'Education', 'Projects'],
      workspace: [
        'Refresh from profile',
        'Print',
        'Publish',
        'Contact email is required',
        'At least one education entry is required',
        'All changes saved',
        'Could not load this CV.',
      ],
      load: ['Could not load this CV.', 'Try again', 'Back to CVs'],
      refresh: [
        'Refresh from profile',
        'Replace selected sections',
        'Contact',
        'Skills',
        'Education',
        'Projects',
      ],
      markdown: ['Bold', 'Italic', 'Unordered list', 'Link', 'Project description'],
      exportGenerating: 'Generating PDF…',
      saving: 'Saving…',
      pdfSuccess: 'PDF downloaded',
      publishSuccess: 'CV published',
    },
    {
      language: 'ru' as const,
      templateNames: ['Редакционный сайдбар', 'Структурированный минимализм'],
      sectionTitles: ['Контакты', 'Навыки', 'Образование', 'Проекты'],
      workspace: [
        'Обновить из профиля',
        'Печать',
        'Опубликовать',
        'Требуется email в контактах',
        'Требуется хотя бы одна запись об образовании',
        'Все изменения сохранены',
        'Не удалось загрузить это резюме.',
      ],
      load: ['Не удалось загрузить это резюме.', 'Попробовать снова', 'К списку резюме'],
      refresh: [
        'Обновить из профиля',
        'Заменить выбранные разделы',
        'Контакты',
        'Навыки',
        'Образование',
        'Проекты',
      ],
      markdown: [
        'Полужирный',
        'Курсив',
        'Маркированный список',
        'Ссылка',
        'Описание проекта',
      ],
      exportGenerating: 'Создание PDF…',
      saving: 'Сохранение…',
      pdfSuccess: 'PDF скачан',
      publishSuccess: 'Резюме опубликовано',
    },
  ])(
    'renders templates and workspace chrome in $language without raw i18n keys',
    async ({
      language,
      templateNames,
      sectionTitles,
      workspace,
      load,
      refresh,
      markdown,
      exportGenerating,
      saving,
      pdfSuccess,
      publishSuccess,
    }) => {
      await i18n.changeLanguage(language);
      mockTheme = 'dark';

      const incomplete = {
        ...cvContentFixture,
        contact: { ...cvContentFixture.contact, email: '' },
        education: [],
      };

      const { container, unmount } = renderWithProviders(
        <>
          <CvWorkspaceHeader
            {...headerProps}
            content={incomplete}
            saving={false}
            isSaved
            pdfExportStatus="generating"
          />
          <CvTemplatePicker value="structured-minimal" onChange={() => {}} />
          <EditorialSidebarPreview content={cvContentFixture} />
          <StructuredMinimalPreview content={cvContentFixture} />
          <CvLoadError onRetry={() => {}} />
          <MarkdownProjectEditor value="**hello**" onChange={() => {}} />
          <SuccessCopyProbe keys={['cv.pdfSuccess', 'cv.publishSuccess']} />
        </>,
      );

      const bodyText = container.textContent ?? '';
      expect(bodyText).not.toMatch(RAW_KEY);

      for (const name of templateNames) {
        expect(screen.getAllByText(name).length).toBeGreaterThan(0);
      }

      for (const title of sectionTitles) {
        expect(screen.getAllByText(title).length).toBeGreaterThan(0);
      }

      for (const copy of workspace) {
        expect(screen.getAllByText(copy).length).toBeGreaterThan(0);
      }

      expect(screen.getByRole('button', { name: exportGenerating })).toBeDisabled();
      expect(await screen.findByText(pdfSuccess)).toBeInTheDocument();
      expect(screen.getByText(publishSuccess)).toBeInTheDocument();

      for (const copy of load) {
        expect(screen.getByText(copy)).toBeInTheDocument();
      }

      for (const label of markdown) {
        const byText = screen.queryAllByText(label).length;
        const byLabel = screen.queryAllByLabelText(new RegExp(`^${label}$`, 'i')).length;
        expect(byText + byLabel).toBeGreaterThan(0);
      }

      expect(document.querySelector('[data-color-mode="dark"]')).toBeTruthy();

      const article = document.querySelector('article');
      expect(article?.getAttribute('lang')).toBe(language);
      expect(article).toHaveStyle({
        backgroundColor: '#ffffff',
        color: '#1a1a1a',
      });

      unmount();

      const savingView = renderWithProviders(
        <CvWorkspaceHeader
          {...headerProps}
          content={incomplete}
          saving
          pdfExportStatus="idle"
        />,
      );
      expect(screen.getByText(saving)).toBeInTheDocument();
      expect(savingView.container.textContent ?? '').not.toMatch(RAW_KEY);
      savingView.unmount();

      mockTheme = 'light';
      const lightMarkdown = renderWithProviders(
        <MarkdownProjectEditor value="**hello**" onChange={() => {}} />,
      );
      expect(document.querySelector('[data-color-mode="light"]')).toBeTruthy();
      expect(document.querySelector('[data-color-mode="dark"]')).toBeNull();
      lightMarkdown.unmount();
      mockTheme = 'dark';

      const dialogView = renderWithProviders(
        <RefreshFromProfileDialog open onClose={() => {}} onConfirm={() => {}} />,
      );
      const dialog = screen.getByRole('dialog');
      for (const copy of refresh) {
        expect(within(dialog).getAllByText(copy).length).toBeGreaterThan(0);
      }
      expect(dialogView.container.textContent ?? '').not.toMatch(RAW_KEY);
    },
  );
});
