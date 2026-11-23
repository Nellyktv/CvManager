# CvManager

A full-stack web app for building and managing CVs. Candidates keep one profile (contacts, skills, education, projects) and generate CVs from it. Recruiters publish positions and review the CVs sent to them. The CV editor shows a live preview and exports the CV as an A4 PDF.

**Live demo:** https://cvmanager-ousk.onrender.com

![CV editor with live preview](docs/screenshots/cv-editor.png)

## Demo walkthrough

Sign in with your Google account. To try the recruiter view, the instance operator runs the following command after your first sign-in:

```bash
npm --prefix server run set-role -- your-google-address@example.com RECRUITER
```

In Docker, run the same command via `docker compose exec app`. Sign in again to refresh the role displayed in the interface. Demo email addresses are fixtures for candidate and position records.

The seed provides 15 positions, 15 published CVs and 5 drafts. In **Positions** and **Search CVs**, try:

- Compare the two **Senior React Engineer** submissions in different templates. Search for **React**, **Storybook** or **Web Performance** to review frontend candidates.
- Open **Node.js API Engineer**, **Backend Integrations Engineer** and **Backend Data Engineer**. Search for **API Design**, **Redis** or **PostgreSQL** to review backend candidates.
- **QA Automation Engineer** is invitation-only and has one published CV and one candidate draft.
- **Technical Writer** has only a draft. **Platform Engineer** has no submissions. Duplicate **Platform Engineer** to practice creating, editing and deleting a position you own.
- Open a published CV to preview it and download a PDF.

## Highlights

- **One source of truth for CVs.** Each CV stores a snapshot of the profile. A candidate can refresh a single section (contacts, skills, education or projects) from the profile without losing edits in the others.
- **PDF in the browser.** The CV is exported with `@react-pdf/renderer` on the client, so the server does not need a headless browser. The preview and the PDF use the same data.
- **Role-based access.** Three roles with checks on every API route. Recruiters only see published CVs, and blocked users are rejected even with a valid token.
- **Safe user content.** Markdown in project descriptions is validated with Zod on the server: HTML tags and non-http links are rejected.
- **TypeScript end to end.** Both the React client and the Express API are written in strict TypeScript. Sequelize models are typed, and the CV content type is inferred from the same Zod schema that validates requests.
- **Responsive and themed.** A custom MUI theme with light and dark modes, layouts for phone, tablet and desktop, checked in Chrome, Firefox and Safari.
- **Tested and containerized.** Vitest tests for the client and the server, and Docker Compose to run the whole app with one command.

## Screenshots

| Recruiter dashboard | Positions |
|---|---|
| ![Recruiter dashboard](docs/screenshots/dashboard.png) | ![Positions](docs/screenshots/positions.png) |

| Published CVs (recruiter view) | Second CV template |
|---|---|
| ![CV list](docs/screenshots/cv-list.png) | ![Structured minimal template](docs/screenshots/cv-editor-minimal.png) |

| Candidate profile | User management (admin) |
|---|---|
| ![Candidate profile](docs/screenshots/profile.png) | ![User management](docs/screenshots/admin-users.png) |

| Sign in | Dark theme |
|---|---|
| ![Sign in](docs/screenshots/login.png) | ![Dark theme](docs/screenshots/dashboard-dark.png) |

<p align="center">
  <img src="docs/screenshots/mobile-dashboard.png" alt="Mobile dashboard" width="300">
</p>

## Features

**Candidates**
- A profile with contacts, skills, education and projects. Every CV is built from this profile.
- Multiple CVs, each with its own template, and each can be refreshed from the latest profile data.
- A CV editor with a live preview. Project descriptions are written in Markdown.
- Client-side PDF export (A4, selectable text).
- Draft and published CV statuses.

**Recruiters**
- Create and manage positions and their required skills.
- View the CVs submitted for each position (only published CVs are visible).
- Search CVs by skill and a shared skill library.

**Admins**
- User management: assign roles, block and unblock users, delete accounts.

**General**
- English and Russian interface.
- Light and dark themes.
- Dashboard with position stats and a skills tag cloud.
- Support tickets saved to Dropbox and Salesforce contact sync.

## Authentication

- Google is the sign-in provider. The API verifies the credential against `GOOGLE_CLIENT_ID` and uses the Google account ID for subsequent sessions. Sign-in supports verified Gmail and Google Workspace addresses.
- Configure a [Google OAuth web client](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid) and allow the app's origin under **Authorized JavaScript origins**. For the Docker default, use `http://localhost` and `http://localhost:4300`. For Vite development, add `http://localhost:5173`.
- Set `GOOGLE_CLIENT_ID` in `server/.env` or the deployed server environment. The browser reads the public client ID from the API at runtime.
- Sessions use a JWT that is valid for 24 hours. Roles are `CANDIDATE`, `RECRUITER` and `ADMIN`. New Google users start as candidates.

## CV templates

| Template | Layout |
|---|---|
| `editorial-sidebar` | Dark sidebar with contacts and skills, main column with projects |
| `structured-minimal` | Header band and a two-column body |

The web preview and the PDF are rendered from the same `CvContent` snapshot, so both always show the same content. The CV page stays light in both app themes.

Project descriptions support **bold**, *italic*, unordered lists and links. Raw HTML is rejected.

## Tech stack

| | |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, MUI, React Router, Zustand, React Hook Form + Zod, i18next, @react-pdf/renderer |
| **Backend** | Node.js, TypeScript, Express 5, Sequelize, PostgreSQL, Zod, JWT, Google OAuth |
| **Integrations** | Salesforce (jsforce), Dropbox |
| **Tooling** | Vitest, Testing Library, ESLint, Docker Compose |

## Project structure

```
client/     React app: features/ (pages by domain), shared/, store/, routes/
server/     Express API: routes/, controllers/, models/, service/, middleware/, types/
```

In production the Express server also serves the built frontend from `dist/`, so the whole app runs as one service. The demo is hosted on Render with a PostgreSQL database on Supabase.

## Getting started

### Quick start with Docker

```bash
export SECRET_KEY_ROLE="$(openssl rand -hex 32)"
docker compose up -d --build
docker compose exec app npm --prefix server run seed:demo
```

The app runs on http://localhost:4300 with its own PostgreSQL container. The seed command fills the database with mock candidate profiles, positions and CVs. To use another port, set `APP_PORT`, for example `APP_PORT=5000 docker compose up -d`. Google and optional integration settings are read from `server/.env`.

### Requirements

- Node.js 22.19 or newer
- PostgreSQL

### Install

```bash
npm install
npm --prefix server install
```

### Environment variables

Copy the example files and fill them in:

```bash
cp .env.example .env
cp server/.env.example server/.env
```

| Variable | Where | Purpose |
|---|---|---|
| `VITE_API_URL` | `.env` | API base URL (`/api` when the server serves the frontend) |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | `server/.env` | PostgreSQL connection |
| `SECRET_KEY_ROLE` | `server/.env` | JWT signing key. Generate with `openssl rand -hex 32` |
| `TRUSTED_PROXIES` | `server/.env` | Trusted reverse proxy IP addresses or CIDR ranges, comma-separated |
| `API_URL`, `CLIENT_URL` | `server/.env` | Public API URL and browser CORS origin |
| `GOOGLE_CLIENT_ID` | `server/.env` | Google token verification |
| `SF_CLIENT_ID`, `SF_CLIENT_SECRET` | `server/.env` | Salesforce integration (optional) |
| `DROPBOX_ACCESS_TOKEN` | `server/.env` | Support tickets (optional) |

Database tables are created automatically on server start.

### Run in development

```bash
# API on http://localhost:4200, restarts on changes
npm --prefix server run dev

# Web app on http://localhost:5173
npm run dev
```

### Production build

```bash
npm run build                    # client -> dist/
npm --prefix server run build    # server -> server/dist/
npm --prefix server start
```

### Tests

```bash
npm test          # watch mode
npm run test:run  # single run
```

Vitest runs two projects: `client` (jsdom) and `server` (node). The tests cover role and token checks, the API error handler, CV content validation (HTML and unsafe links are rejected, date ranges), building a CV snapshot from a profile, and client utilities.

To run the demo seed integration test against local PostgreSQL:

```bash
docker compose up -d db
CV_SEED_INTEGRATION=1 npm run test:run
```

The test creates and removes its own temporary database. It uses the Compose PostgreSQL connection by default. Override it with `DB_HOST`, `DB_PORT`, `DB_USER` and `DB_PASSWORD` if needed. The database user needs permission to create databases.

### Other scripts

```bash
npm run lint                                   # ESLint for the client and the server
npm --prefix server run typecheck              # type-check the server
npm --prefix server run seed:demo              # add missing demo users, positions and CVs
npm --prefix server run set-role <email> ADMIN # change a user's role (no arguments lists users)
npm --prefix server run backfill:cv-snapshots  # one-time migration of old CV rows, safe to re-run
```

The last three scripts run the compiled server code, so run `npm --prefix server run build` first.
