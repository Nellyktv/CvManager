# Data-driven CV templates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build profile-backed, CV-specific content snapshots that render in two selectable A4 templates, support light/dark workspace modes and EN/RU UI, and export reliable downloadable PDFs.

**Architecture:** Reusable candidate defaults live in normalized profile, education, project, and skill models. CVs store a validated JSONB snapshot plus a template key; web and PDF template renderers consume the same TypeScript `CvContent` contract. The existing MUI application shell remains unchanged, while the document preview stays light paper in both application themes.

**Tech Stack:** React 19, TypeScript, MUI 7, Zustand, react-i18next, React Hook Form/Zod, Express 5, Sequelize/PostgreSQL, `@uiw/react-md-editor`, `@react-pdf/renderer`, Vitest, Testing Library.

## Global Constraints

- Preserve the existing MUI component language and both active light/dark application themes.
- All user-facing UI copy, errors, labels, and document headings must use EN/RU i18next dictionaries.
- A CV is rendered only from its own typed `content` snapshot; never load live profile skills/projects while viewing a CV.
- Store project formatting as restricted Markdown text, never raw HTML.
- Use `@uiw/react-md-editor` with only bold, italic, unordered-list, and link commands.
- Use `@react-pdf/renderer` for downloadable selectable-text A4 PDFs; browser print remains optional convenience only.
- Existing Sequelize schema changes use `sequelize.sync({ alter: true })`; new fields must remain nullable through the backfill release.
- Candidate CV reads/mutations must enforce ownership; recruiters may read published CVs only.
- Do not create a git commit or push changes unless the user explicitly asks.

---

## File structure and ownership

| Area | Files | Responsibility |
|---|---|---|
| Server data | `server/models/models.js`, `server/schemas/cvContentSchema.js`, `server/service/cv-snapshot-service.js` | Persistent models, validated snapshot contract, profile-to-snapshot mapping |
| Server API | `server/controllers/{CandidateProfile,Education,Cv,Project}Controller.js`, `server/routes/{profile,education,cv}Router.js` | Profile defaults, education CRUD, snapshot create/edit/refresh/publish, project defaults |
| Server migration | `server/scripts/backfillCvSnapshots.js` | Idempotent transitional backfill |
| Shared client contract | `client/shared/types/{cv,candidateProfile}.ts`, `client/shared/utils/{cvSchemas,cvCompletion,profileToSnapshot,refreshFromProfile,formatDate}.ts` | Typed data, validation, completion, section merge, locale dates |
| Client APIs | `client/api/{cv,candidateProfile,education,skills}.api.ts` | Typed wrappers around existing Axios instance |
| Profile defaults | `client/features/profile/components/*`, `client/features/profile/hooks/*` | Candidate contact, education, extended projects, skill defaults |
| CV workspace | `client/features/cv/{components,hooks,preview,pdf}/**` | Editing, template selection, preview, refresh, PDF download |
| Quality | `vitest.config.ts`, `client/test/**`, co-located `*.test.*` | Unit, component, renderer, export, and API-contract tests |

## API contract

```ts
type CvTemplateKey = 'editorial-sidebar' | 'structured-minimal';
type CvLink = { label: string; url: string };

type CvContent = {
  contact: {
    name: string;
    headline?: string;
    email?: string;
    phone?: string;
    location?: string;
    links: CvLink[];
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
    links: CvLink[];
    descriptionMarkdown?: string;
  }>;
};
```

| Endpoint | Request | Response |
|---|---|---|
| `GET/PUT /api/profile` | Candidate contact defaults | `{ profile }` |
| `GET/POST/PUT/DELETE /api/education` | Education fields | `{ education }` / `{ educations }` |
| `POST /api/cv/create_resume` | `{ positionId }` | `{ cv }` with default template and snapshot |
| `GET /api/cv/:id` | — | `{ cv }` with `content` and `templateKey` |
| `PUT /api/cv/:id` | `{ content?, templateKey? }` | `{ cv }` |
| `PUT /api/cv/:id/refresh-from-profile` | `{ sections }` | `{ cv, refreshedAt }` |
| `PUT /api/cv/:id/publish` | — | `{ message }` after snapshot completion validation |

---

### Task 1: Establish dependencies, test harness, and shared client contract

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Modify: `tsconfig.app.json`
- Create: `vitest.config.ts`
- Create: `client/test/setup.ts`
- Create: `client/test/renderWithProviders.tsx`
- Create: `client/shared/types/cv.ts`
- Create: `client/shared/types/candidateProfile.ts`
- Create: `client/shared/utils/cvSchemas.ts`
- Create: `client/shared/utils/cvCompletion.ts`
- Create: `client/shared/utils/profileToSnapshot.ts`
- Create: `client/shared/utils/refreshFromProfile.ts`
- Create: `client/shared/utils/formatDate.ts`
- Create: `client/shared/utils/cvCompletion.test.ts`
- Create: `client/shared/utils/profileToSnapshot.test.ts`
- Create: `client/shared/utils/refreshFromProfile.test.ts`
- Create: `client/shared/utils/cvSchemas.test.ts`

**Interfaces:**
- Produces `CvContent`, `CvTemplateKey`, `CandidateProfile`, `Education`, `Project`.
- Produces `isCvComplete(content: CvContent): boolean`.
- Produces `copyProfileToCvContent(input): CvContent` and `refreshCvSections(current, defaults, sections): CvContent`.

- [ ] **Step 1: Install the approved production and test dependencies**

Run:

```bash
npm install @uiw/react-md-editor @react-pdf/renderer
npm install -D vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Expected: both `package.json` and `package-lock.json` list the installed packages; do not select or pin invented versions.

- [ ] **Step 2: Write failing pure-contract tests**

```ts
import { describe, expect, it } from 'vitest';
import { isCvComplete } from './cvCompletion';

const complete = {
  contact: { name: 'Artem Ilyin', email: 'artem@example.com', links: [] },
  skills: [],
  education: [{ institution: 'BSUIR' }],
  projects: [],
};

describe('isCvComplete', () => {
  it('requires a name, email, and at least one education entry', () => {
    expect(isCvComplete(complete)).toBe(true);
    expect(isCvComplete({ ...complete, contact: { ...complete.contact, email: '' } })).toBe(false);
    expect(isCvComplete({ ...complete, education: [] })).toBe(false);
  });
});
```

Add matching tests that:

- map `CandidateProfile`, existing skills, education, and projects to a detached `CvContent`;
- refresh only requested `contact | skills | education | projects` sections;
- reject invalid URLs, unsupported template keys, and malformed `CvContent`.

- [ ] **Step 3: Configure Vitest and run the failing tests**

Add `test` and `test:run` scripts (`vitest`, `vitest run`), and configure Vitest v4 with projects:

```ts
test: {
  projects: [
    {
      test: {
        name: 'client',
        include: ['client/**/*.test.{ts,tsx}'],
        environment: 'jsdom',
        setupFiles: ['client/test/setup.ts'],
      },
    },
    {
      test: {
        name: 'server',
        include: ['server/**/*.test.js'],
        environment: 'node',
      },
    },
  ],
}
```

Keep the Vite React plugin at the root configuration level. Initialize `@testing-library/jest-dom` only through the client jsdom setup file. Every server test in this plan uses Vitest (`describe`, `it`, `expect`, `vi`); do not mix `node:test` with Vitest.

Run:

```bash
npm run test:run
```

Expected: FAIL because the shared contract modules do not exist.

- [ ] **Step 4: Implement the minimal shared contract**

Implement:

```ts
export type CvTemplateKey = 'editorial-sidebar' | 'structured-minimal';
export const isCvComplete = (content: CvContent) =>
  Boolean(content.contact.name.trim() && content.contact.email?.trim() && content.education.length);
```

Use Zod to enforce `https?` URLs, the two template keys, string-only Markdown, and arrays for links/sections. `profileToSnapshot` must copy values rather than retain source object references. `refreshFromProfile` must replace only the selected keys and preserve all unselected values.

- [ ] **Step 5: Add locale date formatting**

Implement a narrow utility:

```ts
export const formatCvDateRange = (
  startDate: string | undefined,
  endDate: string | undefined,
  locale: string,
): string => { /* dayjs locale-aware range, empty when both are absent */ };
```

Test EN and RU output using fixed input dates; do not format dates inline in template components.

- [ ] **Step 6: Verify the contract layer**

Run:

```bash
npm run test:run -- client/shared/utils
npm run lint
```

Expected: all new contract tests and lint pass.

---

### Task 2: Add nullable profile, education, project, and CV snapshot persistence

**Files:**
- Modify: `server/models/models.js`
- Modify: `server/package.json`
- Create: `server/schemas/cvContentSchema.js`
- Create: `server/service/cv-snapshot-service.js`
- Create: `server/service/cv-snapshot-service.test.js`

**Interfaces:**
- Produces `CandidateProfile` (`User.hasOne`), `Education` (`User.hasMany`).
- Extends `Cv` with nullable `templateKey`, `content` JSONB, `lastSyncedFromProfileAt`.
- Extends `Project` with `role`, `startDate`, `endDate`, `links` JSONB, `displayOrder`, `descriptionMarkdown`.
- Produces `buildSnapshotFromProfile(userId)`, `mergeSnapshotSections(existing, defaults, sections)`, `isSnapshotComplete(content)`.

- [ ] **Step 1: Add a server validation dependency**

Run:

```bash
npm --prefix server install zod
```

Expected: `server/package.json` and lockfile record `zod`.

- [ ] **Step 2: Write failing snapshot service tests**

Use the configured Vitest Node environment. Mock model calls and assert:

```js
assert.deepEqual(await buildSnapshotFromProfile(7), {
  contact: { name: 'Artem Ilyin', email: 'artem@example.com', links: [] },
  skills: [{ label: 'React', value: 'advanced' }],
  education: [{ institution: 'BSUIR' }],
  projects: [{ title: 'CV Manager', links: [], descriptionMarkdown: 'Built **it**.' }],
});
```

Also assert that `mergeSnapshotSections` does not mutate `existing`, and that completion requires name, email, and one education item.

Add null-normalization cases for every persisted optional field: null contact links become `[]`, null project links become `[]`, missing optional fields are omitted, null skill values are omitted, null user names become empty string segments rather than `"null"`, and projects without a non-empty title are excluded from the snapshot.

- [ ] **Step 3: Run the service tests to confirm failure**

Run:

```bash
npm run test:run -- server/service/cv-snapshot-service.test.js
```

Expected: FAIL because schema/service modules and model fields are absent.

- [ ] **Step 4: Extend Sequelize models with nullable transitional fields**

In `server/models/models.js`:

- Create `CandidateProfile` with one unique `userId` association and fields from the approved spec.
- Create `Education` with the approved content fields, `displayOrder`, and a `User` ownership association.
- Add `templateKey`, `content: DataTypes.JSONB`, and `lastSyncedFromProfileAt` to `Cv`.
- Add the approved project metadata and `descriptionMarkdown`; retain current `description` for backfill compatibility.
- Use `DataTypes.DATEONLY` for project/education dates and `DataTypes.JSONB` for links/content.
- Export both new models.

Do not make the new fields non-null yet: `sequelize.sync({ alter: true })` runs at server startup and existing rows must remain readable during backfill.

- [ ] **Step 5: Implement validation and snapshot mapping**

`cvContentSchema.js` must export:

```js
export const cvTemplateKeys = ['editorial-sidebar', 'structured-minimal'];
export const validateCvContent = (content) => cvContentSchema.parse(content);
export const validateCvUpdate = (payload) => cvUpdateSchema.parse(payload);
```

Reject HTML tags in newly submitted `descriptionMarkdown`; validate link URL and label strings; reject unknown template keys. Export `sanitizeLegacyMarkdown(value)` for migration only: it strips HTML tags while preserving their text content (for example, `Built <strong>fast</strong>` becomes `Built fast`). Test this conversion. Normalize nullable Sequelize values by omitting optional properties from the snapshot rather than emitting `null`, except collection fields `links`, `skills`, `education`, and `projects`, which must always become arrays; `Attribute` has no group field, so omit `group` until a real persisted field exists. The snapshot service must read defaults in display order, map `Attribute.name` to skill labels, compose name from `User.firstName`/`lastName`, and never expose credentials.

- [ ] **Step 6: Verify model sync and service behavior**

Run:

```bash
npm run test:run -- server/service/cv-snapshot-service.test.js
npm --prefix server run dev
```

Expected: tests pass; on a disposable local database, Sequelize completes `sync({ alter: true })` without schema errors. Stop the server after inspecting startup output.

---

### Task 3: Implement candidate profile, education, and enriched project default APIs

**Files:**
- Create: `server/controllers/CandidateProfileController.js`
- Create: `server/controllers/EducationController.js`
- Create: `server/routes/profileRouter.js`
- Create: `server/routes/educationRouter.js`
- Modify: `server/controllers/ProjectController.js`
- Modify: `server/routes/index.js`
- Create: `server/controllers/profile-education-project.test.js`

**Interfaces:**
- `GET/PUT /api/profile` operates only on `req.user.id`.
- `GET/POST/PUT/DELETE /api/education` operates only on owned rows.
- Project create/update accepts and returns the extended project shape.

- [ ] **Step 1: Write failing ownership and request-contract tests**

Cover these cases:

```js
// profile GET creates/returns an empty row only for the authenticated user
// profile PUT rejects malformed publicEmail and invalid professional URLs
// PUT /education/:id returns 403 when education.userId !== req.user.id
// education rejects non-integer displayOrder and an invalid date range
// project update rejects a link with an invalid URL
// project update rejects raw HTML in descriptionMarkdown and non-integer displayOrder
// project list returns displayOrder ascending
```

Use request/response mocks consistent with existing controller tests; if no harness exists, test exported controller functions directly with `req`, `res`, and `next` doubles.

- [ ] **Step 2: Run the new tests to confirm failure**

Run:

```bash
npm run test:run -- server/controllers/profile-education-project.test.js
```

Expected: FAIL because the controllers/routes and extended validation are not implemented.

- [ ] **Step 3: Implement profile and education controllers**

Implement lazy profile creation on `GET /api/profile`. `PUT /api/profile` upserts only the fields below:

```js
['headline', 'publicEmail', 'phone', 'location', 'linkedinUrl', 'githubUrl', 'portfolioUrl']
```

Define `profile`, `education`, and `project` Zod request schemas in `server/schemas/cvContentSchema.js`; they validate email/URLs, integer `displayOrder`, ISO `DATEONLY` values, and reject raw HTML in Markdown. Education create requires `institution`; update/delete must load the row and return `403` for any non-owner. Both controllers must return the established `ApiError` shape through `next`.

- [ ] **Step 4: Extend project defaults without breaking existing project data**

Accept only schema-validated new fields, write only `descriptionMarkdown` for new updates, and return `descriptionMarkdown ?? description` while the backfill has not completed. Order project reads by `displayOrder ASC, id ASC`.

- [ ] **Step 5: Mount routes and verify access rules**

Mount:

```js
allRoutes.use('/profile', profileRouter);
allRoutes.use('/education', educationRouter);
```

Apply existing auth middleware to every route. Do not add a cross-user “get profile” route.

- [ ] **Step 6: Verify API behavior**

Run:

```bash
npm run test:run -- server/controllers/profile-education-project.test.js
npm run lint
```

Expected: controller contract tests pass; lint is clean.

---

### Task 4: Add safe CV snapshot creation, reads, edits, refresh, publish, and access control

**Files:**
- Modify: `server/controllers/CvController.js`
- Modify: `server/routes/cvRouter.js`
- Create: `server/controllers/CvController.test.js`

**Interfaces:**
- `POST /api/cv/create_resume` seeds `{ templateKey: 'editorial-sidebar', content }`.
- `GET /api/cv/:id` returns `{ cv }` only.
- `PUT /api/cv/:id` accepts `content?` and/or `templateKey?`.
- `PUT /api/cv/:id/refresh-from-profile` accepts non-empty selected sections.

- [ ] **Step 1: Write failing security and snapshot behavior tests**

Implement tests for:

```js
// candidate A cannot list or read candidate B's draft
// recruiter can read candidate B's published CV but not their draft
// create_resume rejects a candidate without PositionAccess
// PUT /cv/:id rejects a non-owner and malformed content
// refresh only replaces requested sections
// publish rejects an incomplete snapshot and accepts a complete one
// tag search matches cv.content.skills and is unchanged after later profile-skill edits
```

- [ ] **Step 2: Run the tests to confirm current gaps**

Run:

```bash
npm run test:run -- server/controllers/CvController.test.js
```

Expected: FAIL against current unrestricted candidate list/read and live skill/project rendering.

- [ ] **Step 3: Extract narrow CV access and position-access helpers**

Implement:

```js
const canReadCv = (cv, user) =>
  user.role === 'ADMIN' ||
  cv.userId === user.id ||
  (user.role === 'RECRUITER' && cv.status === 'published');
```

For creation, load the position and verify it exists; candidates may create only when it has no `allowedCandidates` restriction or includes their user ID. Preserve existing admin behavior.

- [ ] **Step 4: Seed snapshots and stop live document joins**

`createCv` calls `buildSnapshotFromProfile(req.user.id)` and stores the default template. `getCv` returns only the CV, its position title, and safe owner identity; remove the current join that builds document attributes from live `CandidateSkills` and `Project` rows.

Filter `getAllCv`:

```js
if (req.user.role === 'CANDIDATE') where.userId = req.user.id;
if (req.user.role === 'RECRUITER') where.status = 'published';
```

Keep admin behavior explicit.

When `tag` is supplied, filter CV discovery against the immutable snapshot (`content.skills`) with PostgreSQL JSONB containment for `{ label: tag }`; do not join `CandidateSkills`. Apply the recruiter published constraint before the tag condition. Add the regression test above with a snapshot containing `React`, then mutate the user’s live skill defaults and assert the tagged result remains unchanged.

- [ ] **Step 5: Add update, selective refresh, and publication validation**

`updateCv` validates the partial update payload before saving. `refreshCvFromProfile` rejects an empty or unknown section list, builds defaults fresh, merges selected keys, and updates `lastSyncedFromProfileAt`. `publishCv` calls `isSnapshotComplete(cv.content)` and returns a translated-client-ready plain API error when incomplete.

Register the specific refresh route before the `/:id` route:

```js
router.put('/:id/refresh-from-profile', authMiddleware, CvController.refreshCvFromProfile);
router.put('/:id', authMiddleware, CvController.updateCv);
```

- [ ] **Step 6: Verify CV correctness and existing routes**

Run:

```bash
npm run test:run -- server/controllers/CvController.test.js
npm run test:run
```

Expected: new CV tests pass and no existing test regresses.

---

### Task 5: Backfill existing data before switching the client to snapshots

**Files:**
- Create: `server/scripts/backfillCvSnapshots.js`
- Modify: `server/seedTestData.js`
- Modify: `server/package.json`
- Create: `server/scripts/backfillCvSnapshots.test.js`

**Interfaces:**
- `backfillCvSnapshots()` is idempotent and returns `{ profilesCreated, projectsMigrated, cvsBackfilled }`.

- [ ] **Step 1: Write a failing idempotency test**

Mock candidate users, projects, and CVs. Assert that a second invocation reports zero additional migration work and does not overwrite a non-null `cv.content`.

- [ ] **Step 2: Implement the script**

The script must:

1. Upsert empty `CandidateProfile` rows for candidates missing one.
2. Copy `sanitizeLegacyMarkdown(Project.description)` to `descriptionMarkdown` only when `descriptionMarkdown` is null.
3. Set `content`, `templateKey: 'editorial-sidebar'`, and `lastSyncedFromProfileAt` only for CVs where content is null.
4. Log final counts and call `sequelize.close()` in a `finally` block.

Do not fabricate education rows. Backfilled CVs without education remain drafts and receive completion guidance in the client.

Add the explicit server script:

```json
{ "backfill:cv-snapshots": "node scripts/backfillCvSnapshots.js" }
```

- [ ] **Step 3: Run and verify the script safely**

Run:

```bash
npm run test:run -- server/scripts/backfillCvSnapshots.test.js
npm --prefix server run backfill:cv-snapshots
```

Expected: unit test passes; run the script only against the intended local/development database and record its printed counts.

- [ ] **Step 4: Update seed data**

Add one candidate profile, education row, extended project, and complete template CV fixture so local visual verification has representative content.

---

### Task 6: Build candidate profile defaults UI and API integration

**Files:**
- Create: `client/api/candidateProfile.api.ts`
- Create: `client/api/education.api.ts`
- Create: `client/api/skills.api.ts`
- Create: `client/features/profile/hooks/useCandidateProfile.ts`
- Create: `client/features/profile/hooks/useEducation.ts`
- Create: `client/features/profile/components/CandidateContactForm.tsx`
- Create: `client/features/profile/components/EducationSection.tsx`
- Create: `client/features/profile/components/EducationFormDialog.tsx`
- Create: `client/features/cv/components/MarkdownProjectEditor.tsx`
- Modify: `client/features/profile/ProfilePage.tsx`
- Modify: `client/features/profile/ProfilePage.constants.ts`
- Modify: `client/features/profile/ProjectFormDialog.tsx`
- Modify: `client/features/profile/useProfile.ts`
- Modify: `client/shared/i18n/languages/en.ts`
- Modify: `client/shared/i18n/languages/ru.ts`
- Create: `client/features/profile/components/CandidateContactForm.test.tsx`
- Create: `client/features/profile/components/EducationSection.test.tsx`
- Create: `client/features/cv/components/MarkdownProjectEditor.test.tsx`

**Interfaces:**
- Contact/profile defaults save through `PUT /profile`.
- Education CRUD follows existing MUI `CrudToolbar`, dialog, and DataGrid patterns.
- Project default editing uses `descriptionMarkdown` and extended metadata.

- [ ] **Step 1: Add feature copy, then write failing profile component tests**

Add EN/RU keys used by this task before rendering a component: contacts, education, project metadata, required-field errors, Markdown labels, and save/error feedback. Use the same semantic key in both dictionaries.

Test that:

```tsx
render(<CandidateContactForm initialProfile={profile} onSave={onSave} />);
await user.clear(screen.getByLabelText(/public email/i));
await user.type(screen.getByLabelText(/public email/i), 'bad-email');
expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
```

Also test the education list’s empty state CTA, add/edit dialog, and owner-only controls.

- [ ] **Step 2: Implement typed API wrappers and hooks**

All wrappers use the existing `api` from `client/api/axios.api.ts`; do not create a second Axios client. Expose loading/error/mutation state so buttons are disabled while saving and failures are shown through the existing Snackbar/Alert patterns.

- [ ] **Step 3: Implement contact and education defaults**

Use existing `Paper`, `Stack`, `TextField`, `DataGrid`, `CrudToolbar`, and dialog patterns. Contact fields include headline, email, phone, location, LinkedIn, GitHub, and portfolio. Validate URLs and public email with the shared schemas. Education dialog requires institution and supports date range, optional degree/field/location/description, and display order.

- [ ] **Step 4: Build the shared library-backed Markdown editor and use it for profile projects**

Create `MarkdownProjectEditor` here so `ProjectFormDialog` does not temporarily ship a plain-text substitute. Configure `@uiw/react-md-editor` with only `commands.bold`, `commands.italic`, `commands.unorderedListCommand`, and `commands.link`; drive its `data-color-mode` from `ThemeStore`. Add localized surrounding labels and test the restricted toolbar. Use it in `ProjectFormDialog` for `descriptionMarkdown`. Keep skills as profile defaults: edits update `/skills` only and never update a CV snapshot.

- [ ] **Step 5: Verify defaults UI**

Run:

```bash
npm run test:run -- client/features/profile
npm run build
```

Expected: profile tests pass; production TypeScript build succeeds.

---

### Task 7: Create template preview renderers from one fixture contract

**Files:**
- Create: `client/features/cv/fixtures/cvContent.fixture.ts`
- Create: `client/features/cv/preview/CvDocumentFrame.tsx`
- Create: `client/features/cv/preview/CvPreviewRouter.tsx`
- Create: `client/features/cv/preview/EditorialSidebarPreview.tsx`
- Create: `client/features/cv/preview/StructuredMinimalPreview.tsx`
- Create: `client/features/cv/preview/renderMarkdown.tsx`
- Create: `client/features/cv/preview/EditorialSidebarPreview.test.tsx`
- Create: `client/features/cv/preview/StructuredMinimalPreview.test.tsx`
- Create: `client/features/cv/components/CvTemplatePicker.tsx`
- Create: `client/features/cv/components/CvTemplatePicker.test.tsx`
- Modify: `client/shared/i18n/languages/en.ts`
- Modify: `client/shared/i18n/languages/ru.ts`

**Interfaces:**
- `CvPreviewRouter({ templateKey, content })` renders exactly one template using the active i18n language for headings, dates, and document `lang`.
- `CvTemplatePicker({ value, onChange, disabled })` exposes both semantic options.

- [ ] **Step 1: Add template/document translation keys, then write failing template tests**

Add parallel EN/RU keys for template names, template selection, and document section headings. For both renderers assert the same fixture’s contact name, education institution, project title, and translated section headings appear. For the picker, assert two named choices, a selected state available to screen readers, and keyboard selection.

- [ ] **Step 2: Build the forced-light document frame**

Use an A4-proportioned container with `lang={i18n.language}`, a white document background, dark readable text, and no dependency on app color mode. The surrounding `Paper`/workspace remains theme-aware. Use translated section headings and `formatCvDateRange`.

- [ ] **Step 3: Implement the two deliberately distinct templates**

Editorial sidebar:

```text
[contact / skills / education rail] [name, headline, project evidence]
```

Structured minimal:

```text
[name + contact line]
[projects reading column] [skills + education reference column]
```

Use semantic `section`, headings, lists, links, and text hierarchy. Do not reuse dashboard Chips inside the document.

- [ ] **Step 4: Implement safe restricted-Markdown preview rendering**

Render only paragraphs, `**bold**`, `*italic*`, unordered lists, and links. Treat all other characters as text; do not call `dangerouslySetInnerHTML`.

- [ ] **Step 5: Verify templates**

Run:

```bash
npm run test:run -- client/features/cv/preview client/features/cv/components/CvTemplatePicker.test.tsx
npm run build
```

Expected: both templates render the identical fixture data correctly and the build succeeds.

---

### Task 8: Replace the CV dashboard with the editable, responsive document workspace

**Files:**
- Create: `client/api/cv.api.ts`
- Create: `client/features/cv/hooks/useCvWorkspace.ts`
- Create: `client/features/cv/components/CvWorkspaceHeader.tsx`
- Create: `client/features/cv/components/CvEditorPanel.tsx`
- Create: `client/features/cv/components/CvPreviewPanel.tsx`
- Create: `client/features/cv/components/CvMobileTabs.tsx`
- Create: `client/features/cv/components/CvLoadError.tsx`
- Create: `client/features/cv/components/RefreshFromProfileDialog.tsx`
- Create: `client/features/cv/components/sections/CvContactSectionEditor.tsx`
- Create: `client/features/cv/components/sections/CvSkillsSectionEditor.tsx`
- Create: `client/features/cv/components/sections/CvEducationSectionEditor.tsx`
- Create: `client/features/cv/components/sections/CvProjectsSectionEditor.tsx`
- Modify: `client/features/cv/CvPage.tsx`
- Modify: `client/features/cv/CvPage.constants.ts`
- Create: `client/features/cv/hooks/useCvWorkspace.test.ts`
- Create: `client/features/cv/components/RefreshFromProfileDialog.test.tsx`
- Create: `client/features/cv/components/CvMobileTabs.test.tsx`
- Modify: `client/shared/i18n/languages/en.ts`
- Modify: `client/shared/i18n/languages/ru.ts`

**Interfaces:**
- `useCvWorkspace(id)` returns `{ cv, content, templateKey, loading, error, saving, updateContent, updateTemplate, refresh, publish }`.
- Editors call `updateContent(nextContent)`; only `PUT /cv/:id` persists snapshot edits.

- [ ] **Step 1: Add workspace copy, then write failing workspace and interaction tests**

Add EN/RU keys for workspace title, editor/preview tabs, save state, load errors, completion guidance, refresh dialog, publish feedback, and print action before rendering workspace tests.

Cover:

```ts
// load error renders CvLoadError and a back-to-CVs action, not a permanent skeleton
// incomplete content disables Publish and announces what is missing
// save sends only { content } or { templateKey }
// Refresh dialog does not call refresh until sections are selected and confirmed
// refresh flushes a pending save, preserves unselected local sections, and aborts when that save fails
// mobile tabs change editor/preview with keyboard navigation
// project editor reuses the tested restricted Markdown component from Task 6
```

- [ ] **Step 2: Implement typed CV API functions**

```ts
export const getCv = (id: string) => api.get<{ cv: Cv }>(`/cv/${id}`);
export const updateCv = (id: string, patch: CvUpdate) => api.put<{ cv: Cv }>(`/cv/${id}`, patch);
export const refreshCv = (id: string, sections: CvSection[]) =>
  api.put<{ cv: Cv; refreshedAt: string }>(`/cv/${id}/refresh-from-profile`, { sections });
```

Publish uses the existing endpoint. API errors must be surfaced to the hook, not swallowed in `console.error`.

- [ ] **Step 3: Implement workspace state and safe save behavior**

Keep local snapshot state while editing. Route every mutation through one serialized queue: before `publish` or `refresh`, flush and await the newest pending snapshot save; if that save fails, abort the later action and retain the local state for retry. After a successful refresh, adopt its server response as the sole local state. Do not cancel a pending save because it may contain unselected sections that refresh must preserve. On failure retain the edited local state, show a retryable error, and do not claim the document saved. Do not permit snapshot mutation for non-owners.

- [ ] **Step 4: Implement header, editor, picker, and refresh flow**

Header includes title, status chip, template picker, refresh, PDF download, and optional print. Desktop uses an `md` breakpoint MUI grid: editor left, preview right. Mobile uses accessible MUI tabs. Refresh dialog exposes contact/skills/education/projects checkboxes, warns before replacement, and only submits selected sections.

- [ ] **Step 5: Reuse the library-backed project Markdown editor**

Use the existing shared component:

```tsx
<MarkdownProjectEditor
  value={value}
  onChange={onChange}
/>
```

The component was created and tested in Task 6. Reuse it in `CvProjectsSectionEditor`; preserve its `data-color-mode` behavior and localized labels/tooltips. Render the same restricted subset in the web preview; do not implement a custom Markdown toolbar.

- [ ] **Step 6: Replace `CvPage`**

Remove inline `/skills` editing and live project fetching. Keep the route `/cv/:id`, role gate, existing app layout, and publish action. Replace indefinite `!cv` skeleton behavior with explicit loading, recoverable error, and loaded workspace states.

- [ ] **Step 7: Verify the workspace**

Run:

```bash
npm run test:run -- client/features/cv
npm run build
npm run lint
```

Expected: workspace/component tests pass, TypeScript build and lint pass.

---

### Task 9: Add matching React-PDF renderers and export state

**Files:**
- Create: `client/features/cv/hooks/useCvExport.ts`
- Create: `client/features/cv/pdf/EditorialSidebarPdf.tsx`
- Create: `client/features/cv/pdf/StructuredMinimalPdf.tsx`
- Create: `client/features/cv/pdf/CvPdfRouter.tsx`
- Create: `client/features/cv/pdf/markdownToPdf.tsx`
- Create: `client/features/cv/pdf/downloadCvPdf.ts`
- Create: `client/features/cv/pdf/downloadCvPdf.test.ts`
- Create: `client/features/cv/pdf/CvPdfRouter.test.tsx`
- Modify: `client/features/cv/components/CvWorkspaceHeader.tsx`
- Modify: `client/shared/i18n/languages/en.ts`
- Modify: `client/shared/i18n/languages/ru.ts`

**Interfaces:**
- `downloadCvPdf({ templateKey, content, fileName }): Promise<void>`.
- `useCvExport()` returns `{ exportPdf, status, error }`, where status is `idle | generating | success | error`.

- [ ] **Step 1: Add export copy, then write failing export tests**

Add EN/RU keys for generating, success, failure, retry, and download action labels before rendering export controls.

Mock `@react-pdf/renderer` `pdf().toBlob()` and assert:

```ts
await downloadCvPdf({ templateKey: 'editorial-sidebar', content: fixture, fileName: 'artem-frontend-engineer.pdf' });
expect(toBlob).toHaveBeenCalledOnce();
```

Repeat for `structured-minimal`. Assert an error puts the hook into `error` state and enables retry.

- [ ] **Step 2: Implement PDF template routing**

Use `Document`, `Page size="A4"`, `View`, `Text`, and `Link`. Keep layout intentionally parallel to the web templates but do not import MUI or DOM components into the PDF renderer. Use page-wrap-safe sections (`wrap={false}` where a project heading must remain with its first line).

- [ ] **Step 3: Implement restricted Markdown-to-PDF mapping**

Map the exact approved subset:

- paragraph → `Text`;
- bold/italic spans → nested `Text` styles;
- unordered list → `View` rows;
- link → `Link`.

Do not parse/render HTML, images, code blocks, or arbitrary Markdown extensions.

- [ ] **Step 4: Implement blob download and header feedback**

Generate a filename from sanitized CV owner/position data. While generating, disable only the export action and show translated generating text. On success, show a success Snackbar; on error, show a translated retry action. Do not upload or persist the PDF.

- [ ] **Step 5: Verify PDF export**

Run:

```bash
npm run test:run -- client/features/cv/pdf
npm run build
```

Expected: both template routes invoke PDF generation and the production build succeeds.

---

### Task 10: Complete EN/RU copy, theme integration, migration rollout checks, and end-to-end verification

**Files:**
- Modify: `client/shared/i18n/languages/en.ts`
- Modify: `client/shared/i18n/languages/ru.ts`
- Modify: `client/features/cv/CvListPage.tsx`
- Modify: `client/features/cv/CvPage.constants.ts`
- Modify: `README.md`

**Interfaces:**
- Every new feature key exists in both language dictionaries.
- CV list uses role-appropriate data returned by the secured API.

- [ ] **Step 1: Add failing translation coverage**

Create a test that renders both templates and workspace header under EN and RU and asserts no untranslated key string is visible. Include template names, section titles, validation, refresh, export, loading, error, and success copy.

- [ ] **Step 2: Complete and audit both dictionaries**

Earlier tasks add their keys before their components. Add any remaining parallel `cv` and `profile` keys for:

```text
workspace, editor, preview, templates, contacts, skills, education, projects,
completion, refresh, export, print, load errors, Markdown controls
```

Use the same semantic key in each language; remove any temporary/hardcoded copy discovered by the audit. Do not hardcode Russian validation strings in Zod schemas.

- [ ] **Step 3: Finish theme and accessibility verification in code**

Confirm `ThemeStore` drives the Markdown editor color mode. Confirm preview/PDF paper stays light. Ensure template picker uses text labels and an accessible selected state; tabs, dialogs, buttons, and toolbar wrappers have localized accessible names; document frame sets `lang`.

- [ ] **Step 4: Update list context and project documentation**

Add localized status and template columns to `CvListPage` using the existing DataGrid/Chip pattern; candidates see only their own CVs through the secured API. Document local setup, backfill command, `npm run test:run`, supported Markdown, and PDF download behavior in `README.md`.

- [ ] **Step 5: Execute the release verification matrix**

Run:

```bash
npm run test:run
npm run lint
npm run build
npm --prefix server run dev
```

Manual checks:

1. Candidate creates a CV from profile defaults, customizes projects, and confirms another CV stays unchanged.
2. Candidate refreshes only education and confirms contacts/projects remain untouched.
3. Candidate cannot open another candidate’s draft; recruiter can open a published CV only.
4. Both templates render the same data in EN and RU.
5. Workspace controls follow light/dark mode while the document remains readable light paper.
6. Markdown bold, italic, unordered list, and links render in web preview and downloaded PDF.
7. Both PDF templates download an A4, selectable-text document.
8. Mobile editor/preview tabs, keyboard focus, empty states, load errors, and export retry are usable.

Expected: all automated commands succeed and all manual checks pass before requesting a final code review.

---

## Rollout order

1. Tasks 1–2: contracts and nullable persistence.
2. Tasks 3–5: defaults API, safe CV API, and idempotent data backfill.
3. Tasks 6–8: candidate defaults UI, web templates, and document workspace.
4. Task 9: PDF generation after visual template contract is stable.
5. Task 10: localization, theme/a11y, migration validation, and release checks.

Do not deploy the client snapshot workspace before Task 5 has completed successfully. The old client expects live CV `attributes` and `projects`; coordinate the API behavior change and client release together.
