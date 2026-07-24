# CvManager

Candidate CV workspace with profile-backed content snapshots, two A4 document templates, EN/RU UI, light/dark app chrome, and client-side PDF download.

## Local setup

### Prerequisites

- Node.js 20+
- PostgreSQL with credentials in `server/.env` (see server dotenv usage)

### Install

```bash
npm install
npm --prefix server install
```

### Run

```bash
# API (requires DB credentials in server/.env)
npm --prefix server run dev

# Web app
npm run dev
```

### One-time snapshot backfill

After deploying the nullable snapshot schema, migrate existing rows idempotently:

```bash
npm --prefix server run backfill:cv-snapshots
```

This creates missing candidate profiles, migrates project `description` → `descriptionMarkdown`, and fills CV `content` / `templateKey` when absent. Safe to re-run.

Do not run the backfill against a database you do not intend to modify.

## Tests, lint, and build

```bash
npm run test:run
npm run lint
npm run build
```

## CV document features

### Templates

- `editorial-sidebar` — dark sidebar contact/skills + main education/projects column
- `structured-minimal` — header band with two-column body

Both web preview and PDF consume the same typed `CvContent` snapshot. The preview/PDF paper stays light in both app themes; workspace controls (including the Markdown editor) follow `ThemeStore` light/dark mode.

### Supported Markdown (project descriptions)

Only:

- **bold**
- *italic*
- unordered lists
- links

HTML is rejected by validation and stripped from renderers. Toolbar actions expose localized accessible names (EN/RU).

### PDF download

- Client-side `@react-pdf/renderer` export (A4, selectable text)
- One renderer per template key
- Status feedback: generating → success snackbar, or error + retry
- Browser print remains an optional convenience action

### Roles and list data

- Candidates see only their own CVs from `GET /api/cv`
- Recruiters see published CVs only
- CV list shows localized status and template columns

## i18n

UI copy lives in `client/shared/i18n/languages/en.ts` and `ru.ts`. Feature keys under `cv` and `profile` stay parallel across both languages.
