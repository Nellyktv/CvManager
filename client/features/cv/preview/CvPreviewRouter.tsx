import type { CvContent, CvTemplateKey } from '../../../shared/types/cv';
import type { CvEditorSection } from '../CvPage.constants';
import EditorialSidebarPreview from './EditorialSidebarPreview';
import StructuredMinimalPreview from './StructuredMinimalPreview';

type CvPreviewRouterProps = {
  templateKey: CvTemplateKey;
  content: CvContent;
  highlightedSection?: CvEditorSection;
};

const CvPreviewRouter = ({
  templateKey,
  content,
  highlightedSection,
}: CvPreviewRouterProps) => {
  if (templateKey === 'structured-minimal') {
    return (
      <StructuredMinimalPreview
        content={content}
        highlightedSection={highlightedSection}
      />
    );
  }

  return (
    <EditorialSidebarPreview
      content={content}
      highlightedSection={highlightedSection}
    />
  );
};

export default CvPreviewRouter;
