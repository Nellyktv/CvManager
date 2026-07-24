import type { CvContent, CvTemplateKey } from '../../../shared/types/cv';
import EditorialSidebarPdf from './EditorialSidebarPdf';
import StructuredMinimalPdf from './StructuredMinimalPdf';

export type CvPdfLabels = {
  contact: string;
  skills: string;
  education: string;
  projects: string;
};

type CvPdfRouterProps = {
  templateKey: CvTemplateKey;
  content: CvContent;
  labels: CvPdfLabels;
  locale: 'en' | 'ru';
};

const CvPdfRouter = ({ templateKey, content, labels, locale }: CvPdfRouterProps) => {
  if (templateKey === 'structured-minimal') {
    return (
      <StructuredMinimalPdf content={content} labels={labels} locale={locale} />
    );
  }

  return <EditorialSidebarPdf content={content} labels={labels} locale={locale} />;
};

export default CvPdfRouter;
