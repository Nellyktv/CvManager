# Data-driven CV templates

## Goal

Replace the current dashboard-style CV detail with a candidate-editable, recruiter-scannable document workspace. A candidate maintains reusable profile defaults, tailors a CV without changing other applications, selects one of two document templates, previews it in the application, and downloads a reliable A4 PDF.

The existing MUI application shell, light/dark theme support, i18n, role model, and overall component language remain in place.

## Users and primary job

- **Candidate:** enter reusable career details once, tailor a CV for a position, and download or publish it.
- **Recruiter:** scan a polished, readable CV with clear contact details, education, skills, and project evidence.

The document must prioritize identity and contactability, followed by qualifications and evidence. It is not another dashboard panel.

## Scope

### Included CV content

1. **Contacts:** name, headline, public email, phone, location, and professional links (LinkedIn, GitHub, portfolio).
2. **Skills:** reusable candidate skill defaults copied into the CV snapshot.
3. **Education:** institution, degree, field, location, start/end dates, optional description, and display order.
4. **Projects:** title, role, date range, links, display order, and a lightweight formatted description.

### Excluded from the first release

- Work-history entries.
- Candidate-uploaded/custom-built templates.
- Photos.
- Arbitrary HTML or embedded media in project descriptions.
- Server-side PDF generation or PDF persistence.

## Content ownership and data flow

The system uses explicit profile defaults plus a CV-specific snapshot:

```text
Candidate profile defaults
  └─ contacts, skills, education, projects
          │
          ├─ Create CV: copy profile data
          └─ Refresh from profile: explicit user action
                    │
                    ▼
           CV content snapshot + selected template
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
   Web preview renderer    React-PDF renderer
```

Editing a CV never silently writes back to profile defaults or another CV. Refreshing from profile is explicit and warns that it replaces the selected CV sections.

## Data model changes

### Existing models to extend

#### `Cv`

Add:

- `templateKey`: `editorial-sidebar` or `structured-minimal`.
- `content`: PostgreSQL `JSONB` with a schema-validated, CV-owned snapshot.
- `lastSyncedFromProfileAt`: nullable timestamp.

`content` is the only source used to render and export that CV. This removes the existing coupling in which `CandidateSkills` are loaded directly from the current user while viewing a CV.

#### `Project`

Keep projects as reusable profile defaults and add:

- `role`
- `startDate`
- `endDate`
- `links` (validated URL list)
- `displayOrder`
- `descriptionMarkdown`

Migrate the current plain `description` value into `descriptionMarkdown`. Markdown remains source text; HTML is not stored.

#### `CandidateSkills`

Keep as the user-owned profile-default skills layer. The CV snapshot copies relevant skill label/value/group data instead of reading `CandidateSkills` during document rendering.

### New models

#### `CandidateProfile`

One-to-one with `User`; contains resume-oriented contact defaults:

- `headline`
- `publicEmail`
- `phone`
- `location`
- `linkedinUrl`
- `githubUrl`
- `portfolioUrl`

`User` continues to own authentication and account identity. Resume contact data does not belong in authentication fields.

#### `Education`

Many-to-one with `User`, with:

- `institution`
- `degree`
- `field`
- `location`
- `startDate`
- `endDate`
- `description`
- `displayOrder`

### Typed CV snapshot

The backend validates `Cv.content` before saving. Both renderers receive this typed document view model:

```ts
type CvContent = {
  contact: {
    name: string;
    headline?: string;
    email?: string;
    phone?: string;
    location?: string;
    links: Array<{ label: string; url: string }>;
  };
  skills: Array<{ label: string; value?: string; group?: string }>;
  education: Array<{
    institution: string;
    degree?: string;
    field?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }>;
  projects: Array<{
    title: string;
    role?: string;
    startDate?: string;
    endDate?: string;
    links: Array<{ label: string; url: string }>;
    descriptionMarkdown?: string;
  }>;
};
```

## Document templates

Both templates consume the same `CvContent`.

### Editorial sidebar

- Cool, restrained accent sidebar.
- Contact, skills, and education form a compact reference rail.
- Name, headline, and project descriptions use the larger main reading column.
- Best default for visual storytelling and project-focused candidates.

### Structured minimal

- Contact line in a compact slate header.
- Thin structural rules and a conventional two-column layout.
- Projects lead the left reading column; skills and education stay concise on the right.
- Best for high-density scanning and conventional recruiter workflows.

Templates are application-owned renderers. A user selects a `templateKey`; they do not edit template layout.

## Editor and preview

### Workspace

- Preserve the existing MUI app shell and CV route.
- Header includes CV title, status, template picker, refresh-from-profile, and export controls.
- Desktop: editable section list beside a live A4 preview.
- Mobile: editor and preview use tabs; neither view is compressed into an unreadable split pane.
- A template picker uses existing `Paper`, selected state, translated labels, and compact visual thumbnails.

### Content editing

- Contacts, skills, education, and projects are discrete, reorderable sections.
- Completion requires a contact name, an email address, and at least one education entry; incomplete sections show clear guidance.
- Profile editing creates reusable defaults; CV editing changes the current snapshot only.
- “Refresh from profile” is section-selective and requires confirmation before replacing populated CV content.

### Project formatting

Use `@uiw/react-md-editor` rather than a custom Markdown editor.

- Store Markdown text in `descriptionMarkdown`.
- Restrict available commands to bold, italic, unordered list, and link.
- Render a live safe preview.
- Never accept or persist raw HTML.

## Theme, localization, and accessibility

### Theme

- The editor workspace, picker, form controls, and Markdown editor follow the active MUI light/dark theme.
- The document preview and PDF intentionally use a light paper surface in both themes. This is the export artifact, while the surrounding workspace remains theme-aware.
- Configure the Markdown editor with the active color mode instead of duplicating an independent theme state.

### i18n

- All new interface strings, validation messages, template labels, headings, empty states, and action feedback use existing i18next dictionaries.
- The selected language determines localized date formatting and the document `lang` attribute.
- Candidate-entered text is never translated or rewritten.

### Accessibility

- Template thumbnails have a text name and selected state, not color-only selection.
- All controls, including Markdown toolbar actions, have localized accessible labels.
- The mobile tab view remains keyboard accessible.
- Links have meaningful labels in the document and PDF.

## PDF export

Use `@react-pdf/renderer` for client-side A4 PDF generation and download.

- Generates downloadable, selectable-text PDFs with controlled pagination.
- Uses a dedicated PDF renderer per template, fed by the same typed `CvContent` as the web preview.
- Supports explicit generating, success, and error states.
- Maps the restricted Markdown subset to safe PDF text, lists, emphasis, and links.

Do not use screenshot-based export (`html2canvas`/`jsPDF`) because it degrades text selection and pagination. Native browser print can remain a convenience action, but React-PDF is the reliable download path.

## Validation and error handling

- Server validates the snapshot shape, URLs, display order, and allowed `templateKey`.
- Candidate ownership is required for profile and CV snapshot mutation.
- A failed CV load displays a recoverable error and back action instead of an indefinite skeleton.
- An unavailable export displays a specific retryable error.
- Refresh does not overwrite content until the candidate confirms it.

## Migration

1. Create `CandidateProfile` and `Education` tables.
2. Extend `Project` while retaining/migrating existing plain descriptions to `descriptionMarkdown`.
3. Add nullable snapshot fields to `Cv`.
4. Seed an initial CV snapshot from each CV owner’s currently available user, skill, and project data.
5. Require a completed snapshot for new/updated template-based CVs.

Existing CVs without enough contact/education data remain editable drafts and show completion guidance rather than fabricated content.

## Verification

- Unit tests for profile-to-snapshot copying, selective refresh, snapshot validation, and Markdown restrictions.
- Renderer tests for both templates using the same fixture snapshot.
- PDF test confirms an A4 download is generated from each template.
- Manual checks in English/Russian and light/dark themes.
- Manual keyboard, mobile, print, empty, and error-state checks.

